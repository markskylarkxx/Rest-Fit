import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { rateLimit } from "../lib/rateLimit.js";
import { sendMessage } from "../services/notify.js";
import { requestOtp, verifyOtp } from "../services/otp.js";

export const publicRouter = Router();

const ROLE_OWNER = "GYM_OWNER";
const ROLE_TRAINER = "TRAINER";
const ROLE_MEMBER = "GYM_MEMBER";
const ROLE_OTHER = "OTHER";

const LEAD_NOTIFY_PHONE = process.env.LEAD_NOTIFY_PHONE ?? "";

/**
 * Normalizes a Nigerian phone number to E.164 (+234...).
 */
function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("+234")) return digits;
  return `+234${digits}`;
}

// ── Gym applications (OTP gated, reviewed by the operator) ──
// The landing page only creates a GymApplication. No Gym or Staff row exists
// until a platform admin approves it (see services/gymApplications.ts).

const applicationSchema = z.object({
  gymName: z.string().trim().min(2).max(100),
  ownerName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().min(7).max(30),
  city: z.string().trim().min(2).max(80),
  // Honeypot: hidden from people, filled in by bots.
  website: z.string().optional(),
});

const applyLimit = rateLimit({ name: "apply", windowMs: 60 * 60 * 1000, max: 10 });

async function assertCanApply(email: string, phone: string) {
  if (await db.staff.findUnique({ where: { email } })) {
    throw new HttpError(409, "A dashboard account already uses this email. Try signing in instead.");
  }
  const pending = await db.gymApplication.findFirst({
    where: { status: "PENDING", OR: [{ email }, { phone }] },
  });
  if (pending) {
    throw new HttpError(409, "We already have your application. We'll WhatsApp you within 24 hours.");
  }
}

publicRouter.post("/gyms/applications/code", applyLimit, async (req, res) => {
  const input = applicationSchema.parse(req.body);
  if (input.website) {
    res.json({ sent: true });
    return;
  }
  const phone = normalisePhone(input.phone);
  await assertCanApply(input.email, phone);

  const { devCode } = await requestOtp(phone);
  res.json({ sent: true, phone, ...(devCode ? { devCode } : {}) });
});

publicRouter.post("/gyms/applications", applyLimit, async (req, res) => {
  const input = applicationSchema.extend({ code: z.string().length(6) }).parse(req.body);
  if (input.website) {
    res.status(201).json({ ok: true, status: "PENDING" });
    return;
  }
  const phone = normalisePhone(input.phone);

  await verifyOtp(phone, input.code);
  await assertCanApply(input.email, phone);

  const application = await db.gymApplication.create({
    data: {
      gymName: input.gymName,
      ownerName: input.ownerName,
      email: input.email,
      phone,
      city: input.city,
    },
  });

  console.log(`[gym application] ${application.gymName} (${application.city}) — ${application.ownerName}, ${phone}`);
  if (LEAD_NOTIFY_PHONE) {
    sendMessage(
      LEAD_NOTIFY_PHONE,
      `New RestFit gym application: ${application.gymName}, ${application.city} (${application.ownerName}, ${phone}). Review it in the platform admin.`
    ).catch((err) => console.error("Notify failed:", err));
  }

  res.status(201).json({ ok: true, status: "PENDING" });
});

// ── Lead capture (concierge path for bigger gyms) ────

const applySchema = z.object({
  role: z.enum([ROLE_OWNER, ROLE_TRAINER, ROLE_MEMBER, ROLE_OTHER]),
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(30),
  email: z.string().email(),
  gymName: z.string().min(2).max(100).optional(),
  city: z.string().max(80).optional(),
});

publicRouter.post("/gyms/apply", applyLimit, async (req, res) => {
  const input = applySchema.parse(req.body);
  const isOwnerOrTrainer =
    input.role === ROLE_OWNER || input.role === ROLE_TRAINER;

  if (isOwnerOrTrainer) {
    if (!input.gymName) {
      res.status(400).json({ error: "Gym name is required" });
      return;
    }

    const existing = await db.gymLead.findUnique({
      where: { phone: input.phone },
    });
    if (existing) {
      res.status(200).json({
        ok: true,
        kind: "lead",
        duplicate: true,
        leadId: existing.id,
      });
      return;
    }

    const lead = await db.gymLead.create({
      data: {
        gymName: input.gymName,
        ownerName: input.name,
        phone: input.phone,
        email: input.email,
        role: input.role,
      },
    });

    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log("  NEW GYM LEAD");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Lead ID:  ${lead.id}`);
    console.log(`  Role:     ${input.role}`);
    console.log(`  Gym:      ${input.gymName}`);
    console.log(`  Owner:    ${input.name}`);
    console.log(`  WhatsApp: ${input.phone}`);
    console.log(`  Email:    ${input.email}`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("");

    if (LEAD_NOTIFY_PHONE) {
      sendMessage(
        LEAD_NOTIFY_PHONE,
        `New RestFit lead: ${input.gymName} — ${input.name} — ${input.phone}`
      ).catch((err) => console.error("Notify failed:", err));
    }

    res.status(201).json({ ok: true, kind: "lead", leadId: lead.id });
    return;
  }

  const entry = await db.waitlist.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      reason: input.role,
      city: input.city ?? null,
    },
  });

  console.log("");
  console.log("───────────────────────────────────────────────────────");
  console.log("  NEW WAITLIST ENTRY");
  console.log("───────────────────────────────────────────────────────");
  console.log(`  Reason: ${input.role}`);
  console.log(`  Name:   ${input.name}`);
  console.log(`  Phone:  ${input.phone}`);
  console.log("───────────────────────────────────────────────────────");
  console.log("");

  res.status(201).json({ ok: true, kind: "waitlist", entryId: entry.id });
});