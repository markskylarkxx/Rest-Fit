import { Router } from "express";
import { checkInSchema } from "@restfit/shared";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { auth, requireAuth } from "../middleware/auth.js";
import { daysBetween, findActiveSubscription } from "../services/subscriptions.js";

export const checkInsRouter = Router();
checkInsRouter.use(requireAuth);

// Called when the front desk scans a member's QR code (or types the code).
// Every attempt is recorded, including refused ones.
checkInsRouter.post("/", async (req, res) => {
  const { gymId, staffId } = auth(req);
  const { code } = checkInSchema.parse(req.body);
  const member = await db.member.findFirst({ where: { gymId, checkInCode: code.toUpperCase() } });
  if (!member) throw new HttpError(404, "No member with that code");

  const sub = await findActiveSubscription(member.id);
  const reason = sub ? null : "No active membership";
  const checkIn = await db.checkIn.create({
    data: { gymId, memberId: member.id, staffId, allowed: Boolean(sub), reason },
  });

  res.status(201).json({
    allowed: checkIn.allowed,
    reason,
    member: { id: member.id, firstName: member.firstName, lastName: member.lastName, phone: member.phone },
    plan: sub?.plan.name ?? null,
    activeUntil: sub?.endDate ?? null,
    daysLeft: sub?.endDate ? daysBetween(new Date(), sub.endDate) : null,
  });
});

checkInsRouter.get("/", async (req, res) => {
  res.json(
    await db.checkIn.findMany({
      where: { gymId: auth(req).gymId },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
});
