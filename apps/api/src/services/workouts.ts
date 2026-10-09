import { db } from "../lib/db.js";
import { HttpError, notFound } from "../lib/errors.js";

export interface SetInput {
  reps: number;
  weightKg: number;
}

export interface ExerciseInput {
  exerciseId: string;
  name: string;
  sets: SetInput[];
}

export interface WorkoutInput {
  date: string;
  durationMin: number;
  notes?: string;
  exercises: ExerciseInput[];
}

export interface PRHit {
  exerciseName: string;
  weightKg: number;
  reps: number;
  previousBestKg?: number;
}

function shape(w: {
  id: string;
  date: Date;
  durationMin: number;
  notes: string | null;
  createdAt: Date;
  exercises: {
    exerciseId: string;
    name: string;
    order: number;
    sets: { reps: number; weightKg: number; order: number }[];
  }[];
}) {
  return {
    id: w.id,
    date: w.date.toISOString(),
    durationMin: w.durationMin,
    notes: w.notes,
    createdAt: w.createdAt.toISOString(),
    exercises: w.exercises
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: e.sets
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
      })),
  };
}

export async function listWorkouts(userId: string, limit = 200) {
  const rows = await db.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: { exercises: { include: { sets: true } } },
  });
  return rows.map(shape);
}

export async function getWorkout(userId: string, id: string) {
  const row = await db.workout.findFirst({
    where: { id, userId },
    include: { exercises: { include: { sets: true } } },
  });
  if (!row) throw notFound("Workout");
  return shape(row);
}

export async function createWorkout(userId: string, input: WorkoutInput) {
  if (input.exercises.length === 0) {
    throw new HttpError(400, "A workout needs at least one exercise");
  }

  const created = await db.workout.create({
    data: {
      userId,
      date: new Date(input.date),
      durationMin: Math.max(0, Math.round(input.durationMin)),
      notes: input.notes,
      exercises: {
        create: input.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          order: i,
          sets: {
            create: e.sets.map((s, j) => ({
              order: j,
              reps: Math.max(0, Math.round(s.reps)),
              weightKg: Math.max(0, s.weightKg),
            })),
          },
        })),
      },
    },
    include: { exercises: { include: { sets: true } } },
  });

  const prs = await detectAndUpdatePRs(userId, created);

  return { ...shape(created), prs };
}

export async function deleteWorkout(userId: string, id: string) {
  const existing = await db.workout.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Workout");
  await db.workout.delete({ where: { id } });
}

export async function getLastForExercise(userId: string, exerciseId: string) {
  const row = await db.workoutExercise.findFirst({
    where: { exerciseId, workout: { userId } },
    orderBy: { workout: { date: "desc" } },
    include: {
      sets: true,
      workout: { select: { date: true } },
    },
  });
  if (!row) return null;
  return {
    date: row.workout.date.toISOString(),
    sets: row.sets
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
  };
}

// ── Personal records ─────────────────────────────────

async function detectAndUpdatePRs(
  userId: string,
  workout: {
    date: Date;
    exercises: {
      name: string;
      sets: { reps: number; weightKg: number }[];
    }[];
  }
): Promise<PRHit[]> {
  const existing = await db.personalRecord.findMany({ where: { userId } });
  const byName = new Map(existing.map((p) => [p.exerciseName, p]));
  const hits: PRHit[] = [];

  for (const ex of workout.exercises) {
    const bestSet = ex.sets.reduce(
      (best, s) =>
        s.weightKg > best.weightKg ||
        (s.weightKg === best.weightKg && s.reps > best.reps)
          ? s
          : best,
      { reps: 0, weightKg: 0 }
    );
    if (bestSet.weightKg === 0) continue;

    const current = byName.get(ex.name);
    const isNew =
      !current ||
      bestSet.weightKg > current.weightKg ||
      (bestSet.weightKg === current.weightKg && bestSet.reps > current.reps);

    if (isNew) {
      hits.push({
        exerciseName: ex.name,
        weightKg: bestSet.weightKg,
        reps: bestSet.reps,
        previousBestKg: current?.weightKg,
      });
      await db.personalRecord.upsert({
        where: {
          userId_exerciseName: { userId, exerciseName: ex.name },
        },
        create: {
          userId,
          exerciseName: ex.name,
          weightKg: bestSet.weightKg,
          reps: bestSet.reps,
          achievedAt: workout.date,
        },
        update: {
          weightKg: bestSet.weightKg,
          reps: bestSet.reps,
          achievedAt: workout.date,
        },
      });
    }
  }

  return hits;
}

export async function listPRs(userId: string) {
  return db.personalRecord.findMany({
    where: { userId },
    orderBy: { exerciseName: "asc" },
  });
}

// ── Stats ────────────────────────────────────────────
// Aggregations used by the member app's Progress screen. All scoped by
// userId so a member never sees another member's data.

export async function getVolumeByWeek(userId: string, weeks = 8) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - weeks * 7);
  start.setHours(0, 0, 0, 0);

  const rows = await db.workout.findMany({
    where: { userId, date: { gte: start } },
    include: { exercises: { include: { sets: true } } },
  });

  const buckets: Record<string, number> = {};
  for (const w of rows) {
    const d = new Date(w.date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    const vol = w.exercises.reduce(
      (n, e) => n + e.sets.reduce((s, x) => s + x.reps * x.weightKg, 0),
      0
    );
    buckets[key] = (buckets[key] ?? 0) + vol;
  }

  const out: { weekStart: string; volumeKg: number }[] = [];
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - i * 7);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    out.push({ weekStart: key, volumeKg: Math.round(buckets[key] ?? 0) });
  }
  return out;
}

export async function getExerciseNamesLogged(userId: string) {
  const rows = await db.workoutExercise.findMany({
    where: { workout: { userId } },
    select: { name: true, sets: { select: { weightKg: true } } },
  });
  const names = new Set<string>();
  for (const r of rows) {
    if (r.sets.some((s) => s.weightKg > 0)) names.add(r.name);
  }
  return Array.from(names).sort();
}

export async function getBestSetSeries(userId: string, exerciseName: string) {
  const rows = await db.workoutExercise.findMany({
    where: { workout: { userId }, name: exerciseName },
    include: {
      sets: { select: { weightKg: true } },
      workout: { select: { date: true } },
    },
    orderBy: { workout: { date: "asc" } },
  });
  const points: { date: string; weight: number }[] = [];
  for (const r of rows) {
    const best = Math.max(...r.sets.map((s) => s.weightKg), 0);
    if (best > 0) {
      points.push({ date: r.workout.date.toISOString(), weight: best });
    }
  }
  return points;
}