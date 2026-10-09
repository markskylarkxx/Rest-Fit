// Workout data lives on the server. Writes go through a queue so a workout
// can always be logged, even on a bad connection. The queue is retried on
// app start and on network restore.

import { api } from "./api";
import { submit } from "./workoutQueue";

export interface SetLog {
  reps: number;
  weight: number;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: SetLog[];
}

export interface Workout {
  id: string;
  date: string;
  durationMin: number;
  exercises: ExerciseLog[];
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  achievedAt: string;
}

export interface PRHit {
  exerciseName: string;
  weightKg: number;
  reps: number;
  previousBestKg?: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeWorkouts(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitWorkoutsChanged() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

// ── Read ────────────────────────────────────────────

export async function getAllWorkouts(): Promise<Workout[]> {
  const { data } = await api.get<
    {
      id: string;
      date: string;
      durationMin: number;
      notes: string | null;
      exercises: {
        exerciseId: string;
        name: string;
        sets: { reps: number; weightKg: number }[];
      }[];
    }[]
  >("/app/workouts");
  return data.map((w) => ({
    id: w.id,
    date: w.date,
    durationMin: w.durationMin,
    notes: w.notes ?? undefined,
    exercises: w.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      sets: e.sets.map((s) => ({ reps: s.reps, weight: s.weightKg })),
    })),
  }));
}

export async function getWorkout(id: string): Promise<Workout | null> {
  try {
    const { data } = await api.get<{
      id: string;
      date: string;
      durationMin: number;
      notes: string | null;
      exercises: {
        exerciseId: string;
        name: string;
        sets: { reps: number; weightKg: number }[];
      }[];
    }>(`/app/workouts/${id}`);
    return {
      id: data.id,
      date: data.date,
      durationMin: data.durationMin,
      notes: data.notes ?? undefined,
      exercises: data.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: e.sets.map((s) => ({ reps: s.reps, weight: s.weightKg })),
      })),
    };
  } catch {
    return null;
  }
}

// ── Write (queued) ──────────────────────────────────

export async function addWorkout(
  w: Omit<Workout, "id">
): Promise<{ queued: boolean; prs?: PRHit[] }> {
  const payload = {
    date: w.date,
    durationMin: w.durationMin,
    notes: w.notes,
    exercises: w.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      sets: e.sets.map((s) => ({ reps: s.reps, weightKg: s.weight })),
    })),
  };
  const result = await submit("create-workout", payload);
  emitWorkoutsChanged();
  const prs =
    (result.response as { prs?: PRHit[] } | undefined)?.prs ?? [];
  return { queued: result.queued, prs };
}

export async function deleteWorkout(id: string): Promise<void> {
  await submit("delete-workout", { id });
  emitWorkoutsChanged();
}

// ── Derived ─────────────────────────────────────────

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const days = new Set(workouts.map((w) => dayKey(new Date(w.date))));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeWorkoutsThisWeek(workouts: Workout[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return workouts.filter((w) => new Date(w.date) >= weekAgo).length;
}

// ── Last performance (server) ───────────────────────

export interface LastPerformance {
  date: string;
  sets: SetLog[];
  suggestion: SetLog[];
}

export async function getLastPerformance(
  exerciseId: string,
  exerciseName: string
): Promise<LastPerformance | null> {
  try {
    const { data } = await api.get<{
      date: string;
      sets: { reps: number; weightKg: number }[];
    } | null>(`/app/workouts/last/${encodeURIComponent(exerciseId)}`);
    if (!data) return null;
    const sets = data.sets.map((s) => ({ reps: s.reps, weight: s.weightKg }));
    return {
      date: data.date,
      sets,
      suggestion: suggestNext(sets, exerciseName),
    };
  } catch {
    return null;
  }
}

function suggestNext(last: SetLog[], exerciseName: string): SetLog[] {
  const isLower = /squat|deadlift|leg press|lunge|calf|hip/i.test(exerciseName);
  const isCompound =
    /squat|deadlift|bench|press|row|pull-?up|pullup|chin|overhead/i.test(
      exerciseName
    );
  const increment = !isCompound ? 1.25 : isLower ? 5 : 2.5;
  const allGood = last.every((s) => s.reps >= 8);
  const lastSetMissed =
    last.length >= 2 && last[last.length - 1].reps < last[0].reps;
  return last.map((s, i) => {
    if (s.weight === 0) return { ...s };
    let weight = s.weight;
    if (allGood && !lastSetMissed) weight = s.weight + increment;
    else if (lastSetMissed && i === last.length - 1) weight = s.weight;
    return { reps: s.reps, weight: Math.round(weight * 100) / 100 };
  });
}

// ── Templates (server) ──────────────────────────────

export async function getAllTemplates(): Promise<WorkoutTemplate[]> {
  const { data } = await api.get<WorkoutTemplate[]>("/app/templates");
  return data;
}

export async function saveTemplate(
  name: string,
  exerciseIds: string[]
): Promise<WorkoutTemplate> {
  const { data } = await api.post<WorkoutTemplate>("/app/templates", {
    name,
    exerciseIds,
  });
  emitWorkoutsChanged();
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/app/templates/${id}`);
  emitWorkoutsChanged();
}

// ── Personal records (server) ───────────────────────

export async function getPRs(): Promise<PersonalRecord[]> {
  const { data } = await api.get<PersonalRecord[]>("/app/prs");
  return data;
}

// ── Stats (server) ──────────────────────────────────

export interface WeekVolume {
  weekStart: string;
  volumeKg: number;
}

export async function getVolumeByWeek(): Promise<WeekVolume[]> {
  const { data } = await api.get<WeekVolume[]>("/app/stats/volume");
  return data;
}

export async function getExerciseNamesLogged(): Promise<string[]> {
  const { data } = await api.get<string[]>("/app/stats/exercises");
  return data;
}

export async function getBestSetSeries(
  exerciseName: string
): Promise<{ date: string; weight: number }[]> {
  const { data } = await api.get<{ date: string; weight: number }[]>(
    `/app/stats/best/${encodeURIComponent(exerciseName)}`
  );
  return data;
}