import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { StaffRole } from "@restfit/shared";
import { env } from "../env.js";
import { db } from "../lib/db.js";
import { isBillingLocked } from "../services/gymBilling.js";
import { HttpError } from "../lib/errors.js";

// Staff (admin portal) and members (member app) get different tokens; the
// `typ` claim keeps one from being used on the other's endpoints.
export interface AuthContext {
  staffId: string;
  gymId: string;
  role: StaffRole;
  // True when this session passed two-step login. Platform routes require it.
  mfa?: boolean;
  isPlatformAdmin?: boolean;
  // Trial/subscription ran out (past the grace period). See requireActiveBilling.
  billingLocked?: boolean;
}

export interface MemberAuthContext {
  userId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      memberAuth?: MemberAuthContext;
    }
  }
}

export const signToken = (ctx: AuthContext) =>
  jwt.sign({ typ: "staff", gymId: ctx.gymId, role: ctx.role, mfa: Boolean(ctx.mfa) }, env.JWT_SECRET, { subject: ctx.staffId, expiresIn: "12h" });

// Short-lived proof that the password was right; exchanged for a session
// once the two-step code is checked.
export const signMfaChallenge = (staffId: string) =>
  jwt.sign({ typ: "mfa" }, env.JWT_SECRET, { subject: staffId, expiresIn: "5m" });

export function readMfaChallenge(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (payload.typ === "mfa" && payload.sub) return payload.sub;
  } catch {
    // fall through
  }
  throw new HttpError(401, "Sign-in timed out. Enter your email and password again");
}

// Short-lived; the member app renews it with its refresh token (see
// services/memberAuth.ts), so revoking a session takes effect within an hour.
export const signMemberToken = (ctx: MemberAuthContext) =>
  jwt.sign({ typ: "member" }, env.JWT_SECRET, { subject: ctx.userId, expiresIn: "1h" });

function readToken(req: Request, typ: "staff" | "member") {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Not signed in");
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new HttpError(401, "Session expired, please sign in again");
  }
  if (payload.typ !== typ) throw new HttpError(401, "Not signed in");
  return payload;
}

// Platform admins keep access regardless of their own gym's status.
export function assertGymApproved(staff: { isPlatformAdmin: boolean; gym: { status: string } }) {
  if (staff.isPlatformAdmin || staff.gym.status === "APPROVED") return;
  throw new HttpError(
    403,
    staff.gym.status === "REJECTED"
      ? "This gym's RestFit account is closed. Contact RestFit if you think this is a mistake."
      : "Your gym hasn't been approved yet. We'll WhatsApp you as soon as it is."
  );
}

// Re-checks the database on every request so deactivating a staff member or
// closing a gym takes effect immediately, not when the 12h token expires.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const payload = readToken(req, "staff");
  const staff = await db.staff.findUnique({
    where: { id: payload.sub! },
    select: {
      active: true,
      isPlatformAdmin: true,
      sessionsValidAfter: true,
      gym: { select: { status: true, trialStartedAt: true, trialEndsAt: true, paidUntil: true } },
    },
  });
  if (!staff?.active) throw new HttpError(401, "Not signed in");
  // e.g. the password was reset since this session started.
  if (staff.sessionsValidAfter && (payload.iat ?? 0) * 1000 < staff.sessionsValidAfter.getTime()) {
    throw new HttpError(401, "Session expired, please sign in again");
  }
  assertGymApproved(staff);
  req.auth = {
    staffId: payload.sub!,
    gymId: payload.gymId,
    role: payload.role,
    mfa: payload.mfa === true,
    isPlatformAdmin: staff.isPlatformAdmin,
    billingLocked: !staff.isPlatformAdmin && isBillingLocked(staff.gym),
  };
  next();
}

// Back-office routes stop working once the trial or subscription has run out
// (after the grace period). Billing, sign-in and the front desk (check-in,
// member lookup, renewals) stay open so members are never stopped from training.
export function requireActiveBilling(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.billingLocked) {
    throw new HttpError(
      402,
      "Your RestFit subscription has ended. Check-in and member renewals still work; renew on the Billing page to use the rest of the dashboard"
    );
  }
  next();
}

export function requireMember(req: Request, _res: Response, next: NextFunction) {
  req.memberAuth = { userId: readToken(req, "member").sub! };
  next();
}

export const requireRole =
  (...roles: StaffRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) throw new HttpError(403, "You don't have access to this");
    next();
  };

// Use inside handlers that sit behind requireAuth / requireMember.
export const auth = (req: Request) => req.auth!;
export const memberAuth = (req: Request) => req.memberAuth!;
