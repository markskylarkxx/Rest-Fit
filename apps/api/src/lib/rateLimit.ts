// Fixed-window rate limit per client IP, counted in Postgres so limits survive
// restarts and hold across several API instances.
import type { NextFunction, Request, Response } from "express";
import { db } from "./db.js";
import { HttpError } from "./errors.js";

// Adds one hit and returns the count in the current window. One atomic
// statement, so concurrent requests can't both slip under the limit.
export async function hit(key: string, windowMs: number) {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + ${windowMs} * interval '1 millisecond')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? 0);
}

// `name` keeps each limiter's counters separate.
export function rateLimit({ name, windowMs, max }: { name: string; windowMs: number; max: number }) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if ((await hit(`${name}:${req.ip ?? "unknown"}`, windowMs)) > max) {
      throw new HttpError(429, "Too many requests. Please try again later");
    }
    next();
  };
}

export const purgeExpiredRateLimits = () => db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
