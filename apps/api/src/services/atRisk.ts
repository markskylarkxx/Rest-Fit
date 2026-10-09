import { db } from "../lib/db.js";

export interface AtRiskMember {
  memberId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  lastCheckIn: string | null;
  daysSinceCheckIn: number | null;
  lastWorkout: string | null;
  daysSinceWorkout: number | null;
  workoutsLast7Days: number;
  activeUntil: string | null;
  planName: string | null;
  suggestedMessage: string;
  category: "TRAINING_ELSEWHERE" | "LAPSED" | "NEVER_STARTED";
}

const DAY = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY);
}

function suggestMessage(
  firstName: string,
  category: AtRiskMember["category"],
  workoutCount: number
): string {
  if (category === "TRAINING_ELSEWHERE") {
    return `Hey ${firstName} — saw you trained ${workoutCount} time${workoutCount === 1 ? "" : "s"} on the app this week. Nice work. Come train with us whenever — you've still got time on your plan.`;
  }
  if (category === "LAPSED") {
    return `Hey ${firstName}, we've missed you at the gym. Everything okay? Your membership is still active — no pressure, just want to make sure you're good.`;
  }
  return `Hey ${firstName}, welcome to the gym! If you need help getting started, I'm here. Let me know when you're coming in next.`;
}

/**
 * Members of a gym who:
 *   - haven't checked in for `minDaysInactive`+ days, OR have never checked in
 *   - still have an active subscription (or one that ended in the last 30 days)
 *
 * If they've logged workouts on the app in the last 7 days, they're flagged
 * as TRAINING_ELSEWHERE rather than LAPSED.
 */
export async function getAtRiskMembers(
  gymId: string,
  minDaysInactive = 10
): Promise<AtRiskMember[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * DAY);

  const members = await db.member.findMany({
    where: { gymId },
    include: {
      user: { select: { id: true } },
      checkIns: {
        where: { allowed: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      subscriptions: {
        where: {
          OR: [
            { status: "ACTIVE" },
            { endDate: { gte: cutoff } },
          ],
        },
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: { select: { name: true } } },
      },
    },
  });

  const out: AtRiskMember[] = [];

  for (const m of members) {
    const lastCheckIn = m.checkIns[0]?.createdAt ?? null;
    const daysSinceCheckIn = lastCheckIn
      ? daysBetween(lastCheckIn, now)
      : null;

    // Skip if recently checked in
    if (daysSinceCheckIn !== null && daysSinceCheckIn < minDaysInactive) {
      continue;
    }

    // Must have an active or recently-ended subscription
    const sub = m.subscriptions[0];
    if (!sub) continue;

    // No user login = never downloaded the app. Skip.
    if (!m.user) continue;

    // Look up their recent workouts
    const recentWorkouts = await db.workout.findMany({
      where: {
        userId: m.user.id,
        date: { gte: new Date(now.getTime() - 7 * DAY) },
      },
      orderBy: { date: "desc" },
      take: 5,
      select: { date: true },
    });

    const lastWorkout = recentWorkouts[0]?.date ?? null;

    // Most recent workout overall — explicit `Date | null` so TS allows
    // the null fallback below.
    let latestWorkoutEver: Date | null = lastWorkout;
    if (!latestWorkoutEver) {
      const w = await db.workout.findFirst({
        where: { userId: m.user.id },
        orderBy: { date: "desc" },
        select: { date: true },
      });
      latestWorkoutEver = w?.date ?? null;
    }

    const daysSinceWorkout = latestWorkoutEver
      ? daysBetween(latestWorkoutEver, now)
      : null;

    let category: AtRiskMember["category"];
    if (recentWorkouts.length > 0) {
      category = "TRAINING_ELSEWHERE";
    } else if (lastCheckIn) {
      category = "LAPSED";
    } else {
      category = "NEVER_STARTED";
    }

    out.push({
      memberId: m.id,
      userId: m.user.id,
      name: `${m.firstName} ${m.lastName}`.trim(),
      phone: m.phone,
      email: m.email,
      lastCheckIn: lastCheckIn?.toISOString() ?? null,
      daysSinceCheckIn,
      lastWorkout: latestWorkoutEver?.toISOString() ?? null,
      daysSinceWorkout,
      workoutsLast7Days: recentWorkouts.length,
      activeUntil: sub.endDate?.toISOString() ?? null,
      planName: sub.plan.name,
      suggestedMessage: suggestMessage(
        m.firstName,
        category,
        recentWorkouts.length
      ),
      category,
    });
  }

  // Order by urgency: TRAINING_ELSEWHERE first (still engaged, drifting),
  // then LAPSED, then NEVER_STARTED.
  const order: Record<AtRiskMember["category"], number> = {
    TRAINING_ELSEWHERE: 0,
    LAPSED: 1,
    NEVER_STARTED: 2,
  };
  out.sort((a, b) => {
    if (order[a.category] !== order[b.category]) {
      return order[a.category] - order[b.category];
    }
    return (b.daysSinceCheckIn ?? 999) - (a.daysSinceCheckIn ?? 999);
  });

  return out;
}