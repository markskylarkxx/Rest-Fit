// Request schemas and types shared by the API and the admin app.
// Money is always stored and sent in kobo (integers) to avoid float rounding.
import { z } from "zod";

export const STAFF_ROLES = ["OWNER", "ADMIN", "FRONT_DESK", "TRAINER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PAYMENT_METHODS = ["CASH", "TRANSFER", "POS", "ONLINE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

// ── Phone numbers ────────────────────────────────────
// Phones are stored in E.164 ("+2348031234567"). The phone number is how a
// member's app login finds the records staff created for them, so every
// spelling of the same number ("0803 123 4567", "2348031234567") must match.
export function canonicalPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return `+${digits}`;
  if (input.trim().startsWith("+") && /^\d{8,15}$/.test(digits)) return `+${digits}`;
  return null;
}

// "+2348031234567" → "0803 123 4567" (other countries are shown as stored).
export const formatPhone = (phone: string) => {
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : phone;
};

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((v, ctx) => {
    const phone = canonicalPhone(v);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid phone number, e.g. 0803 123 4567" });
      return z.NEVER;
    }
    return phone;
  });

// ── Auth ─────────────────────────────────────────────
export const registerGymSchema = z.object({
  gymName: z.string().trim().min(2, "Gym name is required"),
  ownerName: z.string().trim().min(2, "Your name is required"),
  email: z.string().trim().toLowerCase().email(),
  phone: phoneSchema.optional(),
  password: z.string().min(8, "Use at least 8 characters"),
});
export type RegisterGymInput = z.infer<typeof registerGymSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createStaffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "FRONT_DESK", "TRAINER"]),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// ── Plans ────────────────────────────────────────────
export const planSchema = z.object({
  name: z.string().trim().min(2, "Plan name is required"),
  priceKobo: z.coerce.number().int().min(100, "Price must be at least ₦1"),
  durationDays: z.coerce.number().int().min(1).max(730),
  active: z.boolean().optional(),
});
export type PlanInput = z.infer<typeof planSchema>;

// ── Members ──────────────────────────────────────────
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const memberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email().optional())
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  emergencyContact: optionalText,
  notes: optionalText,
});
export type MemberInput = z.infer<typeof memberSchema>;

// ── Memberships & payments ───────────────────────────
export const startSubscriptionSchema = z.object({
  planId: z.string().min(1, "Choose a plan"),
  method: z.enum(PAYMENT_METHODS),
});
export type StartSubscriptionInput = z.infer<typeof startSubscriptionSchema>;

export const checkInSchema = z.object({
  code: z.string().trim().min(4, "Scan or type a member code"),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

// ── Member app ───────────────────────────────────────
export const otpRequestSchema = z.object({ phone: phoneSchema });
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

// Self sign-up at a gym. Email is required because online payments need it.
export const joinGymSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  emergencyContact: optionalText,
});
export type JoinGymInput = z.infer<typeof joinGymSchema>;

// What a member may change about themselves. The phone is their login, so it
// can only be changed by staff.
export const memberProfileSchema = joinGymSchema.partial();
export type MemberProfileInput = z.infer<typeof memberProfileSchema>;

export const memberRenewSchema = z.object({ planId: z.string().min(1, "Choose a plan") });
export type MemberRenewInput = z.infer<typeof memberRenewSchema>;

// ── Helpers ──────────────────────────────────────────
export const formatNaira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
