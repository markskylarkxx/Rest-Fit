import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { env } from "../env.js";

export const publicRouter = Router();

const applySchema = z.object({
  gymName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  phone: z.string().min(7).max(30),
  email: z.string().email(),
});

// Public: no auth. Rate limiting is handled at the CORS/edge layer.
publicRouter.post("/gyms/apply", async (req, res) => {
  const input = applySchema.parse(req.body);

  // Best-effort: store the lead. If the Gym model gets a `leads` table
  // later, migrate to that. For now, log it to the API console so we
  // don't lose leads while we're still in early access.
  console.log(
    `[LEAD] ${input.gymName} — ${input.ownerName} — ${input.phone} — ${input.email}`
  );

  // TODO: send a WhatsApp/SMS to the RestFit team so we respond within 24h.
  // TODO: send an acknowledgment SMS to the gym owner.

  res.status(201).json({ ok: true });
});