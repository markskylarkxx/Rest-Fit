import type { Prisma } from "@prisma/client";
import { db } from "../lib/db.js";

const DAY_MS = 24 * 60 * 60 * 1000;

type Tx = Prisma.TransactionClient;

// The subscription that lets a member in right now, if any.
export const findActiveSubscription = (memberId: string, at = new Date(), tx: Tx = db) =>
  tx.subscription.findFirst({
    where: { memberId, status: "ACTIVE", startDate: { lte: at }, endDate: { gte: at } },
    include: { plan: true },
    orderBy: { endDate: "desc" },
  });

// Activates a paid subscription. A renewal bought before the current plan
// runs out starts the day after it ends, so members never lose paid days.
export async function activateSubscription(subscriptionId: string, tx: Tx) {
  const sub = await tx.subscription.findUniqueOrThrow({ where: { id: subscriptionId }, include: { plan: true } });
  if (sub.status === "ACTIVE") return sub;

  const latest = await tx.subscription.findFirst({
    where: { memberId: sub.memberId, status: "ACTIVE", endDate: { gte: new Date() } },
    orderBy: { endDate: "desc" },
  });
  const startDate = latest?.endDate ? new Date(latest.endDate.getTime() + 1) : new Date();
  const endDate = new Date(startDate.getTime() + sub.plan.durationDays * DAY_MS - 1);

  return tx.subscription.update({
    where: { id: subscriptionId },
    data: { status: "ACTIVE", startDate, endDate },
    include: { plan: true },
  });
}

// Marks ACTIVE subscriptions whose end date has passed as EXPIRED.
export const expireLapsedSubscriptions = () =>
  db.subscription.updateMany({ where: { status: "ACTIVE", endDate: { lt: new Date() } }, data: { status: "EXPIRED" } });

export const daysBetween = (from: Date, to: Date) => Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
