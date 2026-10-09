import { Router } from "express";
import { db } from "../lib/db.js";
import { completePayment } from "../services/memberships.js";
import { verifyWebhook, type OrchPayWebhook } from "../services/orchpay.js";

// Mounted with express.raw(), so req.body is the exact bytes Orch-Pay signed.
export const webhooksRouter = Router();

webhooksRouter.post("/orchpay", async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!verifyWebhook(raw, req.header("X-Webhook-Signature"), req.header("X-Webhook-Timestamp"))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = JSON.parse(raw) as OrchPayWebhook;
  const refs = [data.transactionReference, data.acquirerReference].filter(Boolean) as string[];
  const payment = await db.payment.findFirst({
    where: { OR: [{ orchPayRef: { in: refs } }, { orchPayTxnId: { in: refs } }] },
  });
  // Acknowledge unknown references so Orch-Pay doesn't keep retrying them.
  if (!payment) return res.json({ received: true, matched: false });

  if (event === "payment.success") await completePayment(payment.id, true);
  if (event === "payment.failed") await completePayment(payment.id, false, data.failureReason);
  res.json({ received: true, matched: true });
});
