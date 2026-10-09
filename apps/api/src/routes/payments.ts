import { Router } from "express";
import { db } from "../lib/db.js";
import { notFound } from "../lib/errors.js";
import { auth, requireAuth } from "../middleware/auth.js";
import { refreshPayment } from "../services/memberships.js";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

paymentsRouter.get("/", async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  res.json(
    await db.payment.findMany({
      where: { gymId: auth(req).gymId, ...(status && { status: status as never }) },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        subscription: { select: { plan: { select: { name: true } } } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
});

// Asks Orch-Pay for the latest status, in case a webhook was missed.
paymentsRouter.post("/:id/refresh", async (req, res) => {
  const payment = await db.payment.findFirst({ where: { id: req.params.id, gymId: auth(req).gymId } });
  if (!payment) throw notFound("Payment");
  res.json(await refreshPayment(payment.id));
});
