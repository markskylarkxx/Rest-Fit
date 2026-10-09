import { api } from "./api";

export type PlanDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type PlanDayKind = "STRENGTH" | "MOVEMENT" | "REST";

export type PlanGoal =
  | "BUILD_MUSCLE"
  | "GET_STRONGER"
  | "LOSE_FAT"
  | "GENERAL_FITNESS";

export type PlanEquipment = "FULL_GYM" | "DUMBBELLS_ONLY" | "BODYWEIGHT";
export type PlanSessionMinutes = "30" | "45" | "60" | "90";

export interface TrainingPlanSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: PlanDifficulty;
  weeks: number;
  daysPerWeek: number;
}

export interface TrainingPlanExercise {
  id: string;
  order: number;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

export interface TrainingPlanDay {
  id: string;
  dayNumber: number;
  label: string;
  kind: PlanDayKind;
  notes: string | null;
  exercises: TrainingPlanExercise[];
}

export interface TrainingPlanWeek {
  id: string;
  weekNumber: number;
  label: string | null;
  days: TrainingPlanDay[];
}

export interface TrainingPlanFull extends TrainingPlanSummary {
  weekTemplate: TrainingPlanWeek[];
}

export interface CurrentPlan {
  id: string;
  startedAt: string;
  currentWeek: number;
  currentDay: number;
  completedDays: number;
  totalDays: number;
  plan: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    difficulty: PlanDifficulty;
    weeks: number;
    daysPerWeek: number;
  };
  today: TrainingPlanDay;
  previousNonRest: TrainingPlanDay | null;
  nextNonRest: TrainingPlanDay | null;
}

export interface GeneratePlanInput {
  goal: PlanGoal;
  daysPerWeek: number;
  equipment: PlanEquipment;
  sessionMinutes: PlanSessionMinutes;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERIENCED";
}

export async function listTrainingPlans(): Promise<TrainingPlanSummary[]> {
  const { data } = await api.get<TrainingPlanSummary[]>("/app/training-plans");
  return data;
}

export async function getTrainingPlan(slug: string): Promise<TrainingPlanFull> {
  const { data } = await api.get<TrainingPlanFull>(
    `/app/training-plans/${slug}`
  );
  return data;
}

export async function enrollInPlan(slug: string) {
  const { data } = await api.post(`/app/training-plans/${slug}/enroll`);
  return data;
}

export async function getCurrentPlan(): Promise<CurrentPlan | null> {
  const { data } = await api.get<CurrentPlan | null>(
    "/app/training-plans/current"
  );
  return data;
}

export async function completeCurrentDay() {
  const { data } = await api.post(
    "/app/training-plans/current/complete-day"
  );
  return data as {
    id: string;
    currentWeek: number;
    currentDay: number;
    completedDays: number;
    finished: boolean;
  };
}

export async function quitCurrentPlan() {
  const { data } = await api.delete("/app/training-plans/current");
  return data;
}

export async function generatePlan(
  input: GeneratePlanInput
): Promise<{ planId: string; planSlug: string }> {
  const { data } = await api.post<{ planId: string; planSlug: string }>(
    "/app/training-plans/generate",
    input,
    { timeout: 45000 } // AI generation takes longer than the default timeout
  );
  return data;
}