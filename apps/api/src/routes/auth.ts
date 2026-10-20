import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { createStaffSchema, loginSchema } from "@restfit/shared";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { rateLimit } from "../lib/rateLimit.js";
import { assertGymApproved, auth, readMfaChallenge, requireActiveBilling, requireAuth, requireRole, signMfaChallenge, signToken } from "../middleware/auth.js";
import { enableMfa, remainingRecoveryCodes, startMfaEnrollment, verifyMfaCode } from "../services/mfa.js";
import { completeSetup, findSetupToken, sendPasswordReset } from "../services/gymApplications.js";

export const authRouter = Router();

const publicStaff = { id: true, name: true, email: true, role: true, gymId: true } as const;

async function sessionStaff(staffId: string, mfaVerified: boolean) {
  const { totpEnabledAt, ...staff } = await db.staff.findUniqueOrThrow({
    where: { id: staffId },
    select: { ...publicStaff, gym: true, isPlatformAdmin: true, totpEnabledAt: true },
  });
  return {
    ...staff,
    mfaEnabled: Boolean(totpEnabledAt),
    mfaVerified,
    recoveryCodesLeft: totpEnabledAt ? await remainingRecoveryCodes(staffId) : null,
  };
}

const authLimit = rateLimit({ name: "staff-auth", windowMs: 15 * 60 * 1000, max: 20 });

authRouter.post("/login", authLimit, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const staff = await db.staff.findUnique({ where: { email: input.email }, include: { gym: true } });
  if (!staff || !staff.active || !(await bcrypt.compare(input.password, staff.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  assertGymApproved(staff);
  if (staff.totpEnabledAt) {
    res.json({ mfaRequired: true, mfaToken: signMfaChallenge(staff.id) });
    return;
  }
  res.json({ token: signToken({ staffId: staff.id, gymId: staff.gymId, role: staff.role }), staff: await sessionStaff(staff.id, false) });
});

const forgotLimit = rateLimit({ name: "staff-forgot", windowMs: 60 * 60 * 1000, max: 5 });

authRouter.post("/forgot-password", forgotLimit, async (req, res) => {
  const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
  await sendPasswordReset(email);
  res.json({ ok: true });
});

const mfaVerifySchema = z.object({ mfaToken: z.string().min(1), code: z.string().trim().min(6).max(20) });

authRouter.post("/mfa/verify", authLimit, async (req, res) => {
  const input = mfaVerifySchema.parse(req.body);
  const staffId = readMfaChallenge(input.mfaToken);
  await verifyMfaCode(staffId, input.code);
  const staff = await db.staff.findUniqueOrThrow({ where: { id: staffId }, include: { gym: true } });
  if (!staff.active) throw new HttpError(401, "Wrong email or password");
  assertGymApproved(staff);
  res.json({
    token: signToken({ staffId, gymId: staff.gymId, role: staff.role, mfa: true }),
    staff: await sessionStaff(staffId, true),
  });
});

async function requireEnrollingAdmin(staffId: string) {
  const staff = await db.staff.findUniqueOrThrow({ where: { id: staffId } });
  if (!staff.isPlatformAdmin) throw new HttpError(403, "Not allowed");
}

authRouter.post("/mfa/setup", requireAuth, async (req, res) => {
  await requireEnrollingAdmin(auth(req).staffId);
  res.json(await startMfaEnrollment(auth(req).staffId));
});

authRouter.post("/mfa/enable", requireAuth, authLimit, async (req, res) => {
  const { staffId, gymId, role } = auth(req);
  await requireEnrollingAdmin(staffId);
  const { code } = z.object({ code: z.string().trim().length(6) }).parse(req.body);
  const recoveryCodes = await enableMfa(staffId, code);
  res.json({
    recoveryCodes,
    token: signToken({ staffId, gymId, role, mfa: true }),
    staff: await sessionStaff(staffId, true),
  });
});

const setupSchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(100) });

authRouter.get("/setup/:token", authLimit, async (req, res) => {
  const row = await findSetupToken(String(req.params.token));
  res.json({ name: row.staff.name, email: row.staff.email, gymName: row.staff.gym.name, purpose: row.purpose });
});

authRouter.post("/setup", authLimit, async (req, res) => {
  const input = setupSchema.parse(req.body);
  const staff = await completeSetup(input.token, input.password);
  assertGymApproved(staff);
  if (staff.totpEnabledAt) {
    res.json({ signInRequired: true });
    return;
  }
  res.json({ token: signToken({ staffId: staff.id, gymId: staff.gymId, role: staff.role }), staff: await sessionStaff(staff.id, false) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(await sessionStaff(auth(req).staffId, Boolean(auth(req).mfa)));
});

// ── Staff Management ─────────────────────────────────
export const staffRouter = Router();
staffRouter.use(requireAuth, requireActiveBilling);

staffRouter.get("/", async (req, res) => {
  res.json(await db.staff.findMany({ 
    where: { gymId: auth(req).gymId }, 
    select: { ...publicStaff, active: true }, 
    orderBy: { createdAt: "asc" } 
  }));
});

staffRouter.post("/", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const { name, email, role } = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(["ADMIN", "FRONT_DESK", "TRAINER"]),
  }).parse(req.body);

  const gymId = auth(req).gymId;
  const existing = await db.staff.findUnique({ where: { email } });
  if (existing) throw new HttpError(400, "Email already in use");

  const inviteToken = crypto.randomBytes(24).toString("base64url");
  
  const staff = await db.staff.create({
    data: {
      gymId,
      name,
      email,
      role,
      passwordHash: "PENDING_INVITE", 
      inviteToken,
      inviteSentAt: new Date(),
    },
  });

  const inviteUrl = `${process.env.ADMIN_URL ?? "http://localhost:5173"}/setup-password?token=${inviteToken}`;
  console.log(`\n[STAFF INVITE] ${name} (${role}): ${inviteUrl}\n`);
  
  res.status(201).json({ id: staff.id, name: staff.name, email: staff.email, role: staff.role });
});