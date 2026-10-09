import cron from "node-cron";
import type { ReminderKind } from "@prisma/client";
import { db } from "../lib/db.js";
import { formatDate } from "../services/memberships.js";
import { sendMessage } from "../services/notify.js";
import { daysBetween, expireLapsedSubscriptions } from "../services/subscriptions.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const kindFor = (daysLeft: number): ReminderKind | null =>
  daysLeft <= 1 ? "DAYS_1" : daysLeft <= 3 ? "DAYS_3" : daysLeft <= 7 ? "DAYS_7" : null;

// Sends "your membership ends soon" and "your membership has ended" messages.
// Each (subscription, kind) is sent at most once, enforced by a unique index,
// so running this more often than daily is harmless.
export async function sendRenewalReminders() {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY_MS);
  const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);
  // Skip anyone who has already renewed past the subscription in question.
  const notRenewed = (after: Date) => ({ subscriptions: { none: { status: "ACTIVE" as const, endDate: { gt: after } } } });

  const ending = await db.subscription.findMany({
    where: { status: "ACTIVE", endDate: { gte: now, lte: weekAhead }, member: notRenewed(weekAhead) },
    include: { member: { include: { gym: true } }, plan: true },
  });
  const ended = await db.subscription.findMany({
    where: { status: "EXPIRED", endDate: { gte: twoDaysAgo, lt: now }, member: notRenewed(now) },
    include: { member: { include: { gym: true } }, plan: true },
  });

  const jobs = [
    ...ending.map((s) => {
      const daysLeft = daysBetween(now, s.endDate!);
      return {
        sub: s,
        kind: kindFor(daysLeft),
        text: `Hi ${s.member.firstName}, your ${s.plan.name} membership at ${s.member.gym.name} ends on ${formatDate(s.endDate!)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left). Renew at the front desk to keep training.`,
      };
    }),
    ...ended.map((s) => ({
      sub: s,
      kind: "EXPIRED" as const,
      text: `Hi ${s.member.firstName}, your ${s.plan.name} membership at ${s.member.gym.name} ended on ${formatDate(s.endDate!)}. Renew any time — we'd love to see you back.`,
    })),
  ];

  let sent = 0;
  for (const { sub, kind, text } of jobs) {
    if (!kind) continue;
    try {
      // Claim the reminder first; a duplicate throws and is skipped.
      await db.reminder.create({ data: { gymId: sub.gymId, memberId: sub.memberId, subscriptionId: sub.id, kind } });
    } catch {
      continue;
    }
    await sendMessage(sub.member.phone, text).catch((err) => console.error("Reminder failed", sub.id, err));
    sent++;
  }
  return sent;
}

export function startJobs() {
  const tz = { timezone: "Africa/Lagos" };
  cron.schedule("5 * * * *", () => void expireLapsedSubscriptions().catch(console.error), tz);
  cron.schedule("0 9 * * *", () => void sendRenewalReminders().catch(console.error), tz);
}
