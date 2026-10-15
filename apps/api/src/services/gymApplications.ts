// Gym onboarding: a landing-page application becomes a real Gym + owner
// account only when a platform admin approves it. The owner then picks their
// password from a one-time setup link.
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../env.js";
import { newJoinCode } from "../lib/codes.js";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { sendMessage } from "./notify.js";

const TRIAL_DAYS = 30;
const SETUP_LINK_TTL_MS = 48 * 60 * 60 * 1000;
const RESET_LINK_TTL_MS = 60 * 60 * 1000;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

async function uniqueJoinCode(gymName: string) {
  for (;;) {
    const code = newJoinCode(gymName);
    if (!(await db.gym.findUnique({ where: { joinCode: code } }))) return code;
  }
}

// Replaces any unused link for this staff member with a fresh one. SETUP is
// a new owner's first password; RESET is "forgot password".
export async function issueSetupLink(staffId: string, purpose: "SETUP" | "RESET" = "SETUP") {
  const token = crypto.randomBytes(32).toString("base64url");
  const ttl = purpose === "RESET" ? RESET_LINK_TTL_MS : SETUP_LINK_TTL_MS;
  await db.$transaction([
    db.passwordSetupToken.updateMany({ where: { staffId, usedAt: null }, data: { expiresAt: new Date() } }),
    db.passwordSetupToken.create({
      data: { staffId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttl) },
    }),
  ]);
  return `${env.ADMIN_URL}/setup-password?token=${token}`;
}

// "Forgot password": texts a reset link to the gym's verified phone number.
// Silently does nothing when there's no such account, so the response can't
// be used to find out which emails have accounts.
export async function sendPasswordReset(email: string) {
  const staff = await db.staff.findUnique({ where: { email }, include: { gym: true } });
  if (!staff?.active || !staff.gym.phone) return;
  if (staff.role !== "OWNER" && !staff.isPlatformAdmin) return;
  if (staff.gym.status !== "APPROVED" && !staff.isPlatformAdmin) return;

  const url = await issueSetupLink(staff.id, "RESET");
  sendMessage(
    staff.gym.phone,
    `Reset your RestFit password: ${url} (expires in 1 hour). If you didn't ask for this, ignore this message.`
  ).catch((err) => console.error("Password reset message failed:", err));
}

function sendSetupLink(phone: string, gymName: string, url: string) {
  sendMessage(
    phone,
    `Good news! ${gymName} is approved on RestFit. Set your password to open your dashboard: ${url} (link expires in 48 hours)`
  ).catch((err) => console.error("Setup link message failed:", err));
}

export async function approveApplication(applicationId: string, reviewerId: string) {
  const app = await db.gymApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new HttpError(404, "Application not found");
  if (app.status !== "PENDING") throw new HttpError(409, `This application is already ${app.status.toLowerCase()}`);
  if (await db.staff.findUnique({ where: { email: app.email } })) {
    throw new HttpError(409, "A dashboard account already uses this email");
  }

  const joinCode = await uniqueJoinCode(app.gymName);
  // The owner never learns this password; they set their own from the link.
  const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

  const { gym, staff } = await db.$transaction(async (tx) => {
    // Conditional update so two admins clicking Approve can't create two gyms.
    const { count } = await tx.gymApplication.updateMany({
      where: { id: app.id, status: "PENDING" },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: reviewerId },
    });
    if (!count) throw new HttpError(409, "This application was already reviewed");

    const gym = await tx.gym.create({
      data: {
        name: app.gymName,
        joinCode,
        phone: app.phone,
        status: "APPROVED",
        plan: "TRIAL",
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      },
    });
    const staff = await tx.staff.create({
      data: { gymId: gym.id, name: app.ownerName, email: app.email, passwordHash: unusablePassword, role: "OWNER" },
    });
    await tx.gymApplication.update({ where: { id: app.id }, data: { gymId: gym.id } });
    return { gym, staff };
  });

  const setupUrl = await issueSetupLink(staff.id);
  sendSetupLink(app.phone, gym.name, setupUrl);
  return { gymId: gym.id, joinCode: gym.joinCode, setupUrl };
}

export async function rejectApplication(applicationId: string, reviewerId: string, reason: string | null) {
  const { count } = await db.gymApplication.updateMany({
    where: { id: applicationId, status: "PENDING" },
    data: { status: "REJECTED", rejectionReason: reason, reviewedAt: new Date(), reviewedById: reviewerId },
  });
  if (!count) throw new HttpError(409, "This application isn't pending");
}

// For an owner who lost or didn't use their first link.
export async function resendSetupLink(applicationId: string) {
  const app = await db.gymApplication.findUnique({
    where: { id: applicationId },
    include: { gym: { include: { staff: { where: { role: "OWNER" }, include: { setupTokens: { where: { usedAt: { not: null } }, take: 1 } } } } } },
  });
  const owner = app?.gym?.staff[0];
  if (!app || !owner) throw new HttpError(404, "No approved gym for this application");
  if (owner.setupTokens.length) throw new HttpError(409, "The owner has already set their password");

  const setupUrl = await issueSetupLink(owner.id);
  sendSetupLink(app.phone, app.gymName, setupUrl);
  return { setupUrl };
}

// Looks up an unused, unexpired setup link.
export async function findSetupToken(token: string) {
  const row = await db.passwordSetupToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { staff: { include: { gym: true } } },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new HttpError(400, "This link has expired or was already used. Request a new one");
  }
  return row;
}

export async function completeSetup(token: string, password: string) {
  const row = await findSetupToken(token);
  // Consuming is conditional so the same link can't be used twice at once.
  const { count } = await db.passwordSetupToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (!count) throw new HttpError(400, "This link was already used");
  await db.staff.update({
    where: { id: row.staffId },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      // Signs out every existing session (whole seconds, matching JWT iat).
      sessionsValidAfter: new Date(Math.floor(Date.now() / 1000) * 1000),
    },
  });
  return row.staff;
}
