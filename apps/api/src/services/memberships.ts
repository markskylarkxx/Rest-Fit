import type { StartSubscriptionInput } from "@restfit/shared";
import { env } from "../env.js";
import { db } from "../lib/db.js";
import { badRequest, notFound } from "../lib/errors.js";
import { sendMessage } from "./notify.js";
import * as orchPay from "./orchpay.js";
import { activateSubscription } from "./subscriptions.js";

export const formatDate = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

// Starts (or renews) a membership. Offline payments are recorded as paid and
// the membership starts immediately; online payments return an Orch-Pay link
// and the membership starts when the payment webhook arrives.
// staffId is null when the member starts it themselves from the app.
export async function startSubscription(gymId: string, staffId: string | null, memberId: string, input: StartSubscriptionInput) {
  const [member, plan] = await Promise.all([
    db.member.findFirst({ where: { id: memberId, gymId }, include: { gym: true } }),
    db.plan.findFirst({ where: { id: input.planId, gymId } }),
  ]);
  if (!member) throw notFound("Member");
  if (!plan || !plan.active) throw notFound("Plan");

  if (input.method !== "ONLINE") {
    const result = await db.$transaction(async (tx) => {
      const sub = await tx.subscription.create({ data: { gymId, memberId, planId: plan.id } });
      const payment = await tx.payment.create({
        data: {
          gymId,
          memberId,
          subscriptionId: sub.id,
          amountKobo: plan.priceKobo,
          method: input.method,
          status: "SUCCESS",
          paidAt: new Date(),
          recordedById: staffId,
        },
      });
      return { subscription: await activateSubscription(sub.id, tx), payment };
    });
    notifyPaid(member.phone, member.firstName, member.gym.name, plan.name, result.subscription.endDate!);
    return result;
  }

  if (!member.email) throw badRequest("Add an email address to this member before taking an online payment");

  const { subscription, payment } = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({ data: { gymId, memberId, planId: plan.id } });
    const payment = await tx.payment.create({
      data: {
        gymId,
        memberId,
        subscriptionId: subscription.id,
        amountKobo: plan.priceKobo,
        method: "ONLINE",
        recordedById: staffId,
      },
    });
    return { subscription, payment };
  });

  try {
    const res = await orchPay.createPayment({
      paymentId: payment.id,
      amountKobo: plan.priceKobo,
      customerEmail: member.email,
      returnUrl: `${env.ADMIN_URL}/pay/return?payment=${payment.id}`,
      metadata: { gymId, memberId, subscriptionId: subscription.id, plan: plan.name },
    });
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: { orchPayTxnId: res.transactionId, orchPayRef: res.reference, paymentLink: res.paymentLink },
    });
    if (res.status === "SUCCESS") await completePayment(payment.id, true);
    return { subscription, payment: updated };
  } catch (err) {
    await completePayment(payment.id, false, err instanceof Error ? err.message : "Could not start payment");
    throw err;
  }
}

// Settles an online payment. Safe to call more than once for the same payment
// (webhook retries, manual refresh), because it ignores payments already settled.
export async function completePayment(paymentId: string, success: boolean, failureReason?: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;

  if (!success) {
    await db.$transaction([
      db.payment.update({ where: { id: paymentId }, data: { status: "FAILED", failureReason } }),
      ...(payment.subscriptionId
        ? [db.subscription.updateMany({ where: { id: payment.subscriptionId, status: "PENDING" }, data: { status: "CANCELLED" } })]
        : []),
    ]);
    return;
  }

  const subscription = await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: "SUCCESS", paidAt: new Date() } });
    return payment.subscriptionId ? activateSubscription(payment.subscriptionId, tx) : null;
  });

  if (subscription?.endDate) {
    const member = await db.member.findUniqueOrThrow({ where: { id: payment.memberId }, include: { gym: true } });
    notifyPaid(member.phone, member.firstName, member.gym.name, subscription.plan.name, subscription.endDate);
  }
}

function notifyPaid(phone: string, firstName: string, gymName: string, planName: string, endDate: Date) {
  sendMessage(
    phone,
    `Hi ${firstName}, your ${planName} membership at ${gymName} is active until ${formatDate(endDate)}. See you at the gym!`,
  ).catch((err) => console.error("Could not send payment confirmation", err));
}


// Asks Orch-Pay for an online payment's latest status, in case its webhook
// was missed, and settles the payment if it has finished.
export async function refreshPayment(paymentId: string) {
  const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.status === "PENDING") {
    if (!payment.orchPayTxnId) throw badRequest("This payment was never sent to Orch-Pay");
    const remote = await orchPay.getPayment(payment.orchPayTxnId);
    if (remote.status === "SUCCESS") await completePayment(payment.id, true);
    if (remote.status === "FAILED") await completePayment(payment.id, false, remote.message);
  }
  return db.payment.findUniqueOrThrow({ where: { id: paymentId } });
}
