import { Router } from "express";
import axios from "axios";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { auth, requireAuth } from "../middleware/auth.js";
import { env } from "../env.js";

export const paystackRouter = Router();

paystackRouter.post("/initialize", requireAuth, async (req, res) => {
  const { planId } = req.body;
  const memberId = auth(req).staffId;

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new HttpError(404, "Plan not found");

  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member?.email) throw new HttpError(400, "Member needs an email to pay online");

  const payment = await db.payment.create({
    data: {
      gymId: plan.gymId,
      memberId,
      amountKobo: plan.priceKobo,
      method: "ONLINE",
      status: "PENDING",
    },
  });

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: member.email,
      amount: plan.priceKobo,
      metadata: {
        paymentId: payment.id,
        planId: plan.id,
        memberId: member.id,
      },
    },
    {
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    }
  );

  res.json({
    authorization_url: response.data.data.authorization_url,
    reference: response.data.data.reference,
  });
});

paystackRouter.get("/verify/:reference", requireAuth, async (req, res) => {
  const reference = String(req.params.reference);

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    }
  );

  const data = response.data.data;
  if (data.status !== "success") {
    throw new HttpError(400, "Payment was not successful");
  }

  const { paymentId, planId, memberId } = data.metadata;

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS", paystackRef: reference, paidAt: new Date() },
    });

    // Mark the member as ACTIVE
    await tx.member.update({
      where: { id: memberId },
      data: { status: "ACTIVE" },
    });

    const plan = await tx.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new HttpError(404, "Plan not found");

    await tx.subscription.create({
      data: {
        memberId,
        gymId: plan.gymId,
        planId: plan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.durationDays * 86_400_000),
      },
    });
  });

  res.json({ ok: true });
});

export const paystackWebhook = async (req: any, res: any) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(raw)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(raw.toString("utf8"));

  if (event.event === "charge.success") {
    const reference = String(event.data.reference);
    const metadata = event.data.metadata;

    const existingPayment = await db.payment.findUnique({
      where: { id: metadata.paymentId },
    });
    if (existingPayment?.status === "SUCCESS") return res.sendStatus(200);

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: metadata.paymentId },
        data: { status: "SUCCESS", paystackRef: reference, paidAt: new Date() },
      });

      // Mark the member as ACTIVE
      await tx.member.update({
        where: { id: metadata.memberId },
        data: { status: "ACTIVE" },
      });

      const plan = await tx.plan.findUnique({ where: { id: metadata.planId } });
      if (plan) {
        await tx.subscription.create({
          data: {
            memberId: metadata.memberId,
            gymId: plan.gymId,
            planId: plan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + plan.durationDays * 86_400_000),
          },
        });
      }
    });
  }

  res.sendStatus(200);
};