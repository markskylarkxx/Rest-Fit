// One-time codes that verify a phone number, sent by WhatsApp or SMS.
import crypto from "node:crypto";
import { env } from "../env.js";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { sendCode } from "./notify.js";

const TTL_MS = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const hash = (phone: string, code: string) => crypto.createHmac("sha256", env.JWT_SECRET).update(`${phone}:${code}`).digest("hex");

// Returns the code only when messages aren't really being sent (local
// development), so the app can be tested without an SMS provider.
export async function requestOtp(phone: string) {
  const recent = await db.otpCode.findMany({
    where: { phone, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_AFTER_MS) {
    throw new HttpError(429, "Please wait a minute before asking for another code");
  }
  if (recent.length >= MAX_PER_HOUR) throw new HttpError(429, "Too many codes requested. Try again in an hour");

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.otpCode.create({ data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + TTL_MS) } });
  await sendCode(phone, `Your RestFit code is ${code}. It expires in 10 minutes. Don't share it with anyone.`);

  const devMode = !env.TERMII_API_KEY && env.NODE_ENV !== "production";
  return devMode ? { devCode: code } : {};
}

// Throws unless `code` is the latest unused, unexpired code for `phone`.
export async function verifyOtp(phone: string, code: string) {
  const otp = await db.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new HttpError(400, "That code has expired or was already used. Request a new one");
  if (otp.attempts >= MAX_ATTEMPTS) throw new HttpError(429, "Too many wrong attempts. Request a new code");

  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(hash(phone, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "Wrong code");
  }
  // Consuming is conditional so two simultaneous requests can't both use the code.
  const { count } = await db.otpCode.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (!count) throw new HttpError(400, "That code has already been used");
}
