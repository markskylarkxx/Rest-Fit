import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { StaffRole } from "@restfit/shared";
import { env } from "../env.js";
import { HttpError } from "../lib/errors.js";

// Staff (admin portal) and members (member app) get different tokens; the
// `typ` claim keeps one from being used on the other's endpoints.
export interface AuthContext {
  staffId: string;
  gymId: string;
  role: StaffRole;
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
  jwt.sign({ typ: "staff", gymId: ctx.gymId, role: ctx.role }, env.JWT_SECRET, { subject: ctx.staffId, expiresIn: "12h" });

export const signMemberToken = (ctx: MemberAuthContext) =>
  jwt.sign({ typ: "member" }, env.JWT_SECRET, { subject: ctx.userId, expiresIn: "30d" });

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

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const payload = readToken(req, "staff");
  req.auth = { staffId: payload.sub!, gymId: payload.gymId, role: payload.role };
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
