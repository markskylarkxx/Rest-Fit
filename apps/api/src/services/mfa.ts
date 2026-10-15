// Two-step login with an authenticator app, plus single-use recovery codes.
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { decryptSecret, encryptSecret, newTotpSecret, otpauthUrl, verifyTotp } from "../lib/totp.js";

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const RECOVERY_CODE_COUNT = 10;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const hashRecoveryCode = (code: string) =>
  crypto.createHash("sha256").update(code.replace(/[^A-Z0-9]/gi, "").toUpperCase()).digest("hex");

const newRecoveryCode = () => {
  const chars = Array.from(crypto.randomBytes(10), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
};

// Generates (or regenerates, if enrollment was abandoned) a secret for the
// authenticator app. Not active until confirmed with enableMfa.
export async function startMfaEnrollment(staffId: string) {
  const staff = await db.staff.findUniqueOrThrow({ where: { id: staffId } });
  if (staff.totpEnabledAt) throw new HttpError(409, "Two-step login is already on");
  const secret = newTotpSecret();
  await db.staff.update({ where: { id: staffId }, data: { totpSecret: encryptSecret(secret) } });
  return { secret, otpauthUrl: otpauthUrl(secret, staff.email) };
}

// Confirms the app is set up correctly and returns recovery codes (shown once).
export async function enableMfa(staffId: string, code: string) {
  const staff = await db.staff.findUniqueOrThrow({ where: { id: staffId } });
  if (staff.totpEnabledAt) throw new HttpError(409, "Two-step login is already on");
  if (!staff.totpSecret) throw new HttpError(400, "Start setup first");

  const step = verifyTotp(decryptSecret(staff.totpSecret), code, null);
  if (step === null) throw new HttpError(400, "That code didn't match. Check your phone's time is set automatically and try the newest code");

  const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, newRecoveryCode);
  await db.$transaction([
    db.mfaRecoveryCode.deleteMany({ where: { staffId } }),
    db.mfaRecoveryCode.createMany({ data: recoveryCodes.map((c) => ({ staffId, codeHash: hashRecoveryCode(c) })) }),
    db.staff.update({
      where: { id: staffId },
      data: { totpEnabledAt: new Date(), totpLastStep: step, mfaFailedCount: 0, mfaLockedUntil: null },
    }),
  ]);
  return recoveryCodes;
}

// Checks a 6-digit app code or a recovery code at sign-in. Locks the account's
// second step for 15 minutes after 5 wrong codes, whatever IP they come from.
export async function verifyMfaCode(staffId: string, rawCode: string) {
  const staff = await db.staff.findUniqueOrThrow({ where: { id: staffId } });
  if (!staff.totpEnabledAt || !staff.totpSecret) throw new HttpError(400, "Two-step login isn't set up");
  if (staff.mfaLockedUntil && staff.mfaLockedUntil > new Date()) {
    throw new HttpError(429, "Too many wrong codes. Try again in 15 minutes");
  }

  const code = rawCode.trim();
  let ok = false;
  if (/^\d{6}$/.test(code)) {
    const step = verifyTotp(decryptSecret(staff.totpSecret), code, staff.totpLastStep);
    if (step !== null) {
      // Conditional so the same code can't be accepted twice concurrently.
      const { count } = await db.staff.updateMany({
        where: { id: staffId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
        data: { totpLastStep: step },
      });
      ok = count === 1;
    }
  } else {
    const { count } = await db.mfaRecoveryCode.updateMany({
      where: { staffId, codeHash: hashRecoveryCode(code), usedAt: null },
      data: { usedAt: new Date() },
    });
    ok = count === 1;
  }

  if (ok) {
    await db.staff.update({ where: { id: staffId }, data: { mfaFailedCount: 0, mfaLockedUntil: null } });
    return;
  }

  const failures = staff.mfaFailedCount + 1;
  await db.staff.update({
    where: { id: staffId },
    data:
      failures >= MAX_FAILURES
        ? { mfaFailedCount: 0, mfaLockedUntil: new Date(Date.now() + LOCK_MS) }
        : { mfaFailedCount: failures },
  });
  throw new HttpError(400, "Wrong code");
}

export const remainingRecoveryCodes = (staffId: string) =>
  db.mfaRecoveryCode.count({ where: { staffId, usedAt: null } });
