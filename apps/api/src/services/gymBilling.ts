// What gyms pay RestFit: a 30-day free trial, then Monthly or Annual. Paying
// online goes through Orch-Pay; bank transfers are recorded by a platform admin.
import { env } from "../env.js";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { sendMessage } from "./notify.js";
import * as orchPay from "./orchpay.js";

const DAY_MS = 86_400_000;
const TRIAL_DAYS = 30;
// After access ends, the dashboard keeps working this long with a warning.
export const GRACE_DAYS = 3;

export const GYM_PLANS = {
  MONTHLY: { label: "Monthly", amountKobo: 25_000_00, months: 1 },
  ANNUAL: { label: "Annual", amountKobo: 250_000_00, months: 12 },
} as const;
export type GymPlan = keyof typeof GYM_PLANS;

type GymDates = { trialStartedAt: Date; trialEndsAt: Date | null; paidUntil: Date | null };

const addMonths = (d: Date, months: number) => {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
};

const trialEnd = (g: GymDates) => g.trialEndsAt ?? new Date(g.trialStartedAt.getTime() + TRIAL_DAYS * DAY_MS);

// The last moment the gym has paid-for (or trial) access, before grace.
export const accessEndsAt = (g: GymDates) => {
  const end = trialEnd(g);
  return g.paidUntil && g.paidUntil > end ? g.paidUntil : end;
};

export const isBillingLocked = (g: GymDates, now = new Date()) =>
  now.getTime() > accessEndsAt(g).getTime() + GRACE_DAYS * DAY_MS;

export async function getBillingStatus(gymId: string) {
  const gym = await db.gym.findUniqueOrThrow({ where: { id: gymId } });
  const now = new Date();
  const endsAt = accessEndsAt(gym);
  const paid = Boolean(gym.paidUntil && gym.paidUntil >= trialEnd(gym));
  const state = endsAt > now ? (paid ? "ACTIVE" : "TRIAL") : isBillingLocked(gym, now) ? "LOCKED" : "GRACE";
  const payments = await db.gymPayment.findMany({
    where: { gymId, status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, plan: true, amountKobo: true, method: true, status: true, periodStart: true, periodEnd: true, paidAt: true, createdAt: true },
  });

  return {
    state,
    plan: gym.plan,
    trialEndsAt: trialEnd(gym).toISOString(),
    paidUntil: gym.paidUntil?.toISOString() ?? null,
    accessEndsAt: endsAt.toISOString(),
    graceEndsAt: new Date(endsAt.getTime() + GRACE_DAYS * DAY_MS).toISOString(),
    daysLeft: Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS)),
    onlinePayments: orchPay.orchPayEnabled(),
    plans: Object.entries(GYM_PLANS).map(([key, p]) => ({ key, label: p.label, amountKobo: p.amountKobo, months: p.months })),
    payments,
  };
}

export async function startCheckout(gymId: string, plan: GymPlan) {
  const gym = await db.gym.findUniqueOrThrow({
    where: { id: gymId },
    include: { staff: { where: { role: "OWNER" }, select: { email: true }, take: 1 } },
  });
  const email = gym.staff[0]?.email;
  if (!email) throw new HttpError(400, "This gym has no owner email to send the receipt to");

  const payment = await db.gymPayment.create({
    data: { gymId, plan, amountKobo: GYM_PLANS[plan].amountKobo, method: "ONLINE" },
  });
  try {
    const res = await orchPay.createPayment({
      paymentId: payment.id,
      amountKobo: payment.amountKobo,
      customerEmail: email,
      returnUrl: `${env.ADMIN_URL}/billing/return?payment=${payment.id}`,
      metadata: { kind: "gym_subscription", gymId, plan },
    });
    await db.gymPayment.update({
      where: { id: payment.id },
      data: { orchPayTxnId: res.transactionId, orchPayRef: res.reference, paymentLink: res.paymentLink },
    });
    if (res.status === "SUCCESS") {
      await completeGymPayment(payment.id, true);
      return { paymentId: payment.id, paymentLink: null };
    }
    if (!res.paymentLink) throw new HttpError(502, "The payment provider didn't return a payment page");
    return { paymentId: payment.id, paymentLink: res.paymentLink };
  } catch (err) {
    await completeGymPayment(payment.id, false, err instanceof Error ? err.message : "Could not start payment");
    throw err;
  }
}

// Settles a gym payment and extends access. Safe to call repeatedly (webhook
// retries, the return page refreshing): only a PENDING payment changes.
export async function completeGymPayment(paymentId: string, success: boolean, failureReason?: string) {
  if (!success) {
    await db.gymPayment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED", failureReason } });
    return;
  }

  const result = await db.$transaction(async (tx) => {
    const { count } = await tx.gymPayment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status: "SUCCESS", paidAt: new Date() },
    });
    if (!count) return null;

    const payment = await tx.gymPayment.findUniqueOrThrow({ where: { id: paymentId } });
    const gym = await tx.gym.findUniqueOrThrow({ where: { id: payment.gymId } });
    // Paying early keeps the remaining trial or paid time.
    const now = new Date();
    const currentEnd = accessEndsAt(gym);
    const periodStart = currentEnd > now ? currentEnd : now;
    const periodEnd = addMonths(periodStart, GYM_PLANS[payment.plan as GymPlan].months);

    await tx.gymPayment.update({ where: { id: paymentId }, data: { periodStart, periodEnd } });
    await tx.gym.update({ where: { id: gym.id }, data: { paidUntil: periodEnd, plan: payment.plan } });
    return { gym, periodEnd };
  });

  if (result?.gym.phone) {
    sendMessage(
      result.gym.phone,
      `Thanks! ${result.gym.name}'s RestFit subscription is active until ${result.periodEnd.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.`
    ).catch((err) => console.error("Billing confirmation failed:", err));
  }
}

// For the return page: ask Orch-Pay directly in case the webhook is late.
export async function refreshGymPayment(paymentId: string, gymId: string) {
  const payment = await db.gymPayment.findFirst({ where: { id: paymentId, gymId } });
  if (!payment) throw new HttpError(404, "Payment not found");
  if (payment.status === "PENDING" && payment.orchPayTxnId && orchPay.orchPayEnabled()) {
    const remote = await orchPay.getPayment(payment.orchPayTxnId);
    if (remote.status === "SUCCESS") await completeGymPayment(payment.id, true);
    if (remote.status === "FAILED") await completeGymPayment(payment.id, false, remote.message);
  }
  const { status, plan, periodEnd } = await db.gymPayment.findUniqueOrThrow({ where: { id: paymentId } });
  return { status, plan, periodEnd };
}

// A bank transfer or cash payment the operator received outside Orch-Pay.
export async function recordManualPayment(input: {
  gymId: string;
  plan: GymPlan;
  method: "TRANSFER" | "CASH";
  note: string | null;
  recordedById: string;
}) {
  const payment = await db.gymPayment.create({
    data: {
      gymId: input.gymId,
      plan: input.plan,
      amountKobo: GYM_PLANS[input.plan].amountKobo,
      method: input.method,
      note: input.note,
      recordedById: input.recordedById,
    },
  });
  await completeGymPayment(payment.id, true);
  return db.gymPayment.findUniqueOrThrow({ where: { id: payment.id } });
}
