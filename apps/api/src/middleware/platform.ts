import type { NextFunction, Request, Response } from "express";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { auth } from "./auth.js";

export async function requirePlatformAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const { staffId, mfa } = auth(req);
  const staff = await db.staff.findUnique({
    where: { id: staffId },
    select: { isPlatformAdmin: true, totpEnabledAt: true },
  });
  if (!staff?.isPlatformAdmin) {
    throw new HttpError(403, "Not allowed");
  }
  // Platform access always needs a session that passed two-step login.
  if (!staff.totpEnabledAt || !mfa) {
    throw new HttpError(403, "Two-step login is required for the platform admin");
  }
  next();
}