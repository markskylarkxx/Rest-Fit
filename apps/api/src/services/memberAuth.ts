// Member app sign-in: verify the phone with a code once, choose a 4-digit PIN,
// then stay signed in with rotating refresh tokens. A code (which costs an
// SMS) is only needed at sign-up and to reset a forgotten or locked PIN.
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { signMemberToken } from "../middleware/auth.js";
import { requestOtp, verifyOtp } from "./otp.js";

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_PIN_FAILURES = 5;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

//PIN rules
const COMMON_PINS = new Set(["1212", "1004", "2000", "6969", "1122", "1313", "4321", "2580", "0852", "1010", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]);

export function pinProblem(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "Your PIN must be exactly 4 digits";
  if (/^(\d)\1{3}$/.test(pin)) return "Don't use the same digit four times";
  const digits = pin.split("").map(Number);
  const steps = digits.slice(1).map((d, i) =>  d - digits[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return "Don't use digits in order, like 1234";
  if (COMMON_PINS.has(pin)) return "That PIN is too easy to guess. Choose another";
  return null;
}

// ── Short-lived proof that the phone was verified ───
// Exchanged for a session once the member chooses a PIN.
const signPinSetupToken = (userId: string) =>
  jwt.sign({ typ: "member-pin-setup" }, env.JWT_SECRET, { subject: userId, expiresIn: "15m" });

function readPinSetupToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (payload.typ === "member-pin-setup" && payload.sub) return payload.sub;
  } catch {
    // fall through
  }
  throw new HttpError(401, "That took too long. Start again with your phone number");
}

// Sessions 
async function issueSession(userId: string) {
  const refreshToken = crypto.randomBytes(32).toString("base64url");
  await db.memberSession.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return { accessToken: signMemberToken({ userId }), refreshToken };
}

// Swaps a refresh token for a new pair; the old one stops working at once.
export async function refreshSession(refreshToken: string) {
  const oldHash = hashToken(refreshToken);
  const session = await db.memberSession.findUnique({ where: { tokenHash: oldHash } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new HttpError(401, "Please sign in again");
  }
  const next = crypto.randomBytes(32).toString("base64url");
  const { count } = await db.memberSession.updateMany({
    where: { id: session.id, tokenHash: oldHash, revokedAt: null },
    data: { tokenHash: hashToken(next), expiresAt: new Date(Date.now() + SESSION_TTL_MS), lastUsedAt: new Date() },
  });
  if (!count) throw new HttpError(401, "Please sign in again");
  await db.memberUser.update({ where: { id: session.userId }, data: { lastLoginAt: new Date() } });
  return { accessToken: signMemberToken({ userId: session.userId }), refreshToken: next };
}

export async function revokeSession(refreshToken: string) {
  await db.memberSession.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── Sign-in steps ────────────────────────────────────

// Step 1. Members with a PIN are asked for it (no SMS). Everyone else
// (new, or signed up before PINs existed) gets a code to verify the phone.
export async function startSignIn(phone: string) {
  const user = await db.memberUser.findUnique({ where: { phone }, select: { pinHash: true, pinLockedAt: true } });
  if (user?.pinHash) return { next: "PIN" as const, locked: Boolean(user.pinLockedAt) };
  return { next: "CODE" as const, ...(await requestOtp(phone)) };
}

// "Forgot PIN" (or a locked PIN): always sends a code.
export async function sendResetCode(phone: string) {
  return requestOtp(phone);
}

// Step 2 (new members and PIN resets). Creates the account on first
// verification and links any gym memberships already registered to this phone.
export async function verifyPhone(phone: string, code: string) {
  await verifyOtp(phone, code);
  const user = await db.memberUser.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });
  await db.member.updateMany({ where: { phone, userId: null }, data: { userId: user.id } });
  return { pinSetupToken: signPinSetupToken(user.id), isReset: Boolean(user.pinHash) };
}

// Step 3. Saves the PIN and signs the device in. A reset also signs out every
// other device, in case someone else knew the old PIN.
export async function setPin(pinSetupToken: string, pin: string) {
  const userId = readPinSetupToken(pinSetupToken);
  const problem = pinProblem(pin);
  if (problem) throw new HttpError(400, problem);

  const user = await db.memberUser.findUniqueOrThrow({ where: { id: userId } });
  await db.$transaction([
    ...(user.pinHash ? [db.memberSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })] : []),
    db.memberUser.update({
      where: { id: userId },
      data: { pinHash: await bcrypt.hash(pin, 10), pinSetAt: new Date(), pinFailedCount: 0, pinLockedAt: null, lastLoginAt: new Date() },
    }),
  ]);
  return { userId, ...(await issueSession(userId)) };
}

// Returning member on a new device: phone + PIN, no SMS.
export async function signInWithPin(phone: string, pin: string) {
  const user = await db.memberUser.findUnique({ where: { phone } });
  if (!user?.pinHash) throw new HttpError(401, "Wrong phone number or PIN");
  if (user.pinLockedAt) {
    throw new HttpError(423, "Your PIN is locked after too many wrong tries. Tap \"Forgot PIN\" to reset it with a code");
  }

  if (!(await bcrypt.compare(pin, user.pinHash))) {
    // Atomic increment, so parallel guesses can't slip past the limit.
    const { pinFailedCount: failures } = await db.memberUser.update({
      where: { id: user.id },
      data: { pinFailedCount: { increment: 1 } },
    });
    if (failures >= MAX_PIN_FAILURES) {
      await db.memberUser.update({ where: { id: user.id }, data: { pinFailedCount: 0, pinLockedAt: new Date() } });
      throw new HttpError(423, "Your PIN is locked after too many wrong tries. Tap \"Forgot PIN\" to reset it with a code");
    }
    const left = MAX_PIN_FAILURES - failures;
    throw new HttpError(401, `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left before it locks`);
  }

  await db.memberUser.update({ where: { id: user.id }, data: { pinFailedCount: 0, lastLoginAt: new Date() } });
  return { userId: user.id, ...(await issueSession(user.id)) };
}
