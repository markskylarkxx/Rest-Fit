import { db } from "../lib/db.js";
import { HttpError, notFound } from "../lib/errors.js";

// ── Shape helpers ────────────────────────────────────

function shapeExercise(e: {
  id: string;
  order: number;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}) {
  return {
    id: e.id,
    order: e.order,
    exerciseId: e.exerciseId,
    name: e.name,
    targetSets: e.targetSets,
    targetReps: e.targetReps,
    targetWeight: e.targetWeight,
  };
}

function shapeDay(d: {
  id: string;
  dayNumber: number;
  label: string;
  kind: string;
  notes: string | null;
  exercises: {
    id: string;
    order: number;
    exerciseId: string;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeight: number | null;
  }[];
}) {
  return {
    id: d.id,
    dayNumber: d.dayNumber,
    label: d.label,
    kind: d.kind,
    notes: d.notes,
    exercises: d.exercises
      .sort((a, b) => a.order - b.order)
      .map(shapeExercise),
  };
}

function shapeWeek(w: {
  id: string;
  weekNumber: number;
  label: string | null;
  days: {
    id: string;
    dayNumber: number;
    label: string;
    kind: string;
    notes: string | null;
    exercises: {
      id: string;
      order: number;
      exerciseId: string;
      name: string;
      targetSets: number;
      targetReps: number;
      targetWeight: number | null;
    }[];
  }[];
}) {
  return {
    id: w.id,
    weekNumber: w.weekNumber,
    label: w.label,
    days: w.days
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(shapeDay),
  };
}

// ── List all plans ───────────────────────────────────

export async function listTrainingPlans() {
  const plans = await db.trainingPlan.findMany({
    orderBy: [{ difficulty: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      difficulty: true,
      weeks: true,
      daysPerWeek: true,
    },
  });
  return plans;
}

// ── One plan, with full week/day/exercise tree ───────

export async function getTrainingPlan(slug: string) {
  const plan = await db.trainingPlan.findUnique({
    where: { slug },
    include: {
      planWeeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!plan) throw notFound("Training plan");

  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    description: plan.description,
    difficulty: plan.difficulty,
    weeks: plan.weeks,
    daysPerWeek: plan.daysPerWeek,
    weekTemplate: plan.planWeeks.map(shapeWeek),
  };
}

// ── Enroll a user in a plan ──────────────────────────

export async function enrollUser(userId: string, slug: string) {
  const plan = await db.trainingPlan.findUnique({ where: { slug } });
  if (!plan) throw notFound("Training plan");

  // Only one active plan at a time.
  await db.userTrainingPlan.updateMany({
    where: { userId, active: true },
    data: { active: false, completedAt: new Date() },
  });

  const enrollment = await db.userTrainingPlan.create({
    data: {
      userId,
      planId: plan.id,
      currentWeek: 1,
      currentDay: 1,
      completedDays: 0,
      active: true,
    },
  });

  return {
    id: enrollment.id,
    planId: plan.id,
    planSlug: plan.slug,
    planName: plan.name,
    startedAt: enrollment.startedAt.toISOString(),
    currentWeek: enrollment.currentWeek,
    currentDay: enrollment.currentDay,
    completedDays: enrollment.completedDays,
  };
}

// ── Internal helpers ─────────────────────────────────

type FlatDay = {
  id: string;
  dayNumber: number;
  label: string;
  kind: string;
  notes: string | null;
  exercises: {
    id: string;
    order: number;
    exerciseId: string;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeight: number | null;
  }[];
  weekNumber: number;
};

function flattenDays(
  weeks: {
    weekNumber: number;
    days: {
      id: string;
      dayNumber: number;
      label: string;
      kind: string;
      notes: string | null;
      exercises: {
        id: string;
        order: number;
        exerciseId: string;
        name: string;
        targetSets: number;
        targetReps: number;
        targetWeight: number | null;
      }[];
    }[];
  }[]
): FlatDay[] {
  const out: FlatDay[] = [];
  for (const w of weeks) {
    for (const d of w.days) {
      out.push({ ...d, weekNumber: w.weekNumber });
    }
  }
  return out;
}

/**
 * Find the previous non-rest day and the next non-rest day relative to
 * a given position (week, day) in the plan.
 */
function findNeighbors(
  flatDays: FlatDay[],
  currentWeek: number,
  currentDay: number
): { previous: FlatDay | null; next: FlatDay | null } {
  // Sort by (week, day) — should already be sorted but be safe.
  const sorted = [...flatDays].sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
    return a.dayNumber - b.dayNumber;
  });

  // Find current index (whether current is REST or not).
  const currentIdx = sorted.findIndex(
    (d) => d.weekNumber === currentWeek && d.dayNumber === currentDay
  );
  if (currentIdx === -1) return { previous: null, next: null };

  // Walk backward for previous non-rest.
  let previous: FlatDay | null = null;
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (sorted[i].kind !== "REST") {
      previous = sorted[i];
      break;
    }
  }

  // Walk forward for next non-rest.
  let next: FlatDay | null = null;
  for (let i = currentIdx + 1; i < sorted.length; i++) {
    if (sorted[i].kind !== "REST") {
      next = sorted[i];
      break;
    }
  }

  return { previous, next };
}

// ── Current plan + today's day + neighbors ───────────

export async function getCurrentPlan(userId: string) {
  const enrollment = await db.userTrainingPlan.findFirst({
    where: { userId, active: true },
    include: {
      plan: {
        include: {
          planWeeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: {
                orderBy: { dayNumber: "asc" },
                include: {
                  exercises: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return null;

  const plan = enrollment.plan;
  const flat = flattenDays(plan.planWeeks);

  const currentWeek = enrollment.currentWeek;
  const currentDay = enrollment.currentDay;

  const today = flat.find(
    (d) => d.weekNumber === currentWeek && d.dayNumber === currentDay
  );
  if (!today) return null;

  const { previous, next } = findNeighbors(flat, currentWeek, currentDay);

  const totalDays = plan.weeks * 7;

  return {
    id: enrollment.id,
    startedAt: enrollment.startedAt.toISOString(),
    currentWeek,
    currentDay,
    completedDays: enrollment.completedDays,
    totalDays,
    plan: {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      tagline: plan.tagline,
      difficulty: plan.difficulty,
      weeks: plan.weeks,
      daysPerWeek: plan.daysPerWeek,
    },
    today: shapeDay(today),
    previousNonRest: previous ? shapeDay(previous) : null,
    nextNonRest: next ? shapeDay(next) : null,
  };
}

// ── Advance the user to the next day ─────────────────

export async function completeCurrentDay(userId: string) {
  const enrollment = await db.userTrainingPlan.findFirst({
    where: { userId, active: true },
    include: {
      plan: {
        include: {
          planWeeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: { orderBy: { dayNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!enrollment) throw new HttpError(404, "No active training plan");

  const plan = enrollment.plan;
  const week = plan.planWeeks.find(
    (w) => w.weekNumber === enrollment.currentWeek
  );
  if (!week) throw new HttpError(500, "Plan structure is broken");

  const daysInWeek = week.days.length;
  const isLastDayOfWeek = enrollment.currentDay >= daysInWeek;
  const isLastWeek = enrollment.currentWeek >= plan.weeks;

  let nextWeek = enrollment.currentWeek;
  let nextDay = enrollment.currentDay + 1;
  let isFinished = false;

  if (isLastDayOfWeek) {
    if (isLastWeek) {
      isFinished = true;
    } else {
      nextWeek = enrollment.currentWeek + 1;
      nextDay = 1;
    }
  }

  const updated = await db.userTrainingPlan.update({
    where: { id: enrollment.id },
    data: {
      currentWeek: nextWeek,
      currentDay: isFinished ? enrollment.currentDay : nextDay,
      completedDays: enrollment.completedDays + 1,
      active: !isFinished,
      completedAt: isFinished ? new Date() : null,
    },
  });

  return {
    id: updated.id,
    currentWeek: updated.currentWeek,
    currentDay: updated.currentDay,
    completedDays: updated.completedDays,
    finished: isFinished,
  };
}

// ── Quit the current plan ────────────────────────────

export async function quitCurrentPlan(userId: string) {
  const enrollment = await db.userTrainingPlan.findFirst({
    where: { userId, active: true },
  });
  if (!enrollment) throw new HttpError(404, "No active training plan");

  await db.userTrainingPlan.update({
    where: { id: enrollment.id },
    data: { active: false, completedAt: new Date() },
  });

  return { ok: true };
}