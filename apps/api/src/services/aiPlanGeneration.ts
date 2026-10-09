// AI-powered training plan generation via Groq.
//
// Groq doesn't have OpenAI's strict "structured outputs" feature, so we use
// their tool-calling pattern instead: define a single tool that represents
// the plan shape, force the model to call it, and parse the arguments.
//
// Groq's tool validator uses JSON Schema semantics and does NOT accept
// `nullable: true` for optional fields — it must be `type: ["X", "null"]`.
//
// We cap the plan at 4 weeks by default to stay within Groq's output token
// budget. Bodyweight plans can need higher rep counts (planks, mountain
// climbers) so targetReps goes up to 100.

import Groq from "groq-sdk";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { env } from "../env.js";

// ── Groq client (lazy) ───────────────────────────────

let groqClient: Groq | null = null;

function groq(): Groq {
  if (!env.GROQ_API_KEY) {
    throw new HttpError(
      503,
      "AI plan generation is not configured. Set GROQ_API_KEY."
    );
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
}

// ── Input validation ─────────────────────────────────

export const planRequestSchema = z.object({
  goal: z.enum([
    "BUILD_MUSCLE",
    "GET_STRONGER",
    "LOSE_FAT",
    "GENERAL_FITNESS",
  ]),
  daysPerWeek: z.number().int().min(2).max(6),
  equipment: z.enum(["FULL_GYM", "DUMBBELLS_ONLY", "BODYWEIGHT"]),
  sessionMinutes: z.enum(["30", "45", "60", "90"]),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERIENCED"]),
});

export type PlanRequest = z.infer<typeof planRequestSchema>;

// ── Shape of what we expect back ─────────────────────

interface GeneratedExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

interface GeneratedDay {
  dayNumber: number;
  label: string;
  kind: "STRENGTH" | "MOVEMENT" | "REST";
  notes: string | null;
  exercises: GeneratedExercise[];
}

interface GeneratedWeek {
  weekNumber: number;
  label: string | null;
  days: GeneratedDay[];
}

interface GeneratedPlan {
  name: string;
  tagline: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  weeks: number;
  daysPerWeek: number;
  weekTemplate: GeneratedWeek[];
}

// ── The tool Groq must call ──────────────────────────
// Optional-and-null fields use `type: ["X", "null"]`, NOT `nullable: true`.

const providePlanTool: Groq.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "provide_training_plan",
    description:
      "Provide a complete structured training plan for the user. Call this exactly once with the full plan.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Short plan name, e.g. 'Muscle Builder 4-Day'",
        },
        tagline: {
          type: "string",
          description: "One-line summary, max 80 characters",
        },
        description: {
          type: "string",
          description: "2–3 sentence description of the plan",
        },
        difficulty: {
          type: "string",
          enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        },
        weeks: {
          type: "integer",
          minimum: 4,
          maximum: 6,
          description: "Total number of weeks in the plan",
        },
        daysPerWeek: {
          type: "integer",
          minimum: 2,
          maximum: 6,
        },
        weekTemplate: {
          type: "array",
          minItems: 4,
          maxItems: 6,
          description:
            "Each week of the plan. Every week must have exactly 7 days (some REST).",
          items: {
            type: "object",
            properties: {
              weekNumber: { type: "integer", minimum: 1 },
              label: {
                type: ["string", "null"],
                description: "Optional label, e.g. 'Deload'",
              },
              days: {
                type: "array",
                minItems: 7,
                maxItems: 7,
                items: {
                  type: "object",
                  properties: {
                    dayNumber: {
                      type: "integer",
                      minimum: 1,
                      maximum: 7,
                    },
                    label: {
                      type: "string",
                      description: "Day label, e.g. 'Push', 'Rest', 'Walk'",
                    },
                    kind: {
                      type: "string",
                      enum: ["STRENGTH", "MOVEMENT", "REST"],
                    },
                    notes: {
                      type: ["string", "null"],
                    },
                    exercises: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exerciseId: {
                            type: "string",
                            description:
                              "Kebab-case identifier, e.g. 'barbell-bench-press'. Movement uses 'move_' prefix, e.g. 'move_walk'.",
                          },
                          name: { type: "string" },
                          targetSets: {
                            type: "integer",
                            minimum: 1,
                            maximum: 15,
                          },
                          targetReps: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                          },
                          targetWeight: {
                            type: ["number", "null"],
                            description:
                              "Starting weight in kg. Null for beginners or bodyweight moves.",
                          },
                        },
                        required: [
                          "exerciseId",
                          "name",
                          "targetSets",
                          "targetReps",
                          "targetWeight",
                        ],
                      },
                    },
                  },
                  required: ["dayNumber", "label", "kind", "exercises"],
                },
              },
            },
            required: ["weekNumber", "days"],
          },
        },
      },
      required: [
        "name",
        "tagline",
        "description",
        "difficulty",
        "weeks",
        "daysPerWeek",
        "weekTemplate",
      ],
    },
  },
};

// ── Free-tier gate ───────────────────────────────────

const MAX_FREE_GENERATED_PLANS = 3;

async function assertUnderFreeLimit(userId: string) {
  const count = await db.trainingPlan.count({
    where: {
      slug: { startsWith: "ai-" },
      enrollments: { some: { userId } },
    },
  });
  if (count >= MAX_FREE_GENERATED_PLANS) {
    throw new HttpError(
      403,
      `You've generated ${MAX_FREE_GENERATED_PLANS} plans. Enjoy the ones you have — or contact us for more.`
    );
  }
}

// ── Main entry point ─────────────────────────────────

export async function generateTrainingPlan(
  userId: string,
  input: PlanRequest
): Promise<{ planId: string; planSlug: string }> {
  await assertUnderFreeLimit(userId);

  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);

  const completion = await groq().chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [providePlanTool],
    tool_choice: "required",
    temperature: 0.3,
    max_tokens: 32000,
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "provide_training_plan") {
    throw new HttpError(
      502,
      "The AI didn't return a plan. Please try again."
    );
  }

  let plan: GeneratedPlan;
  try {
    plan = JSON.parse(toolCall.function.arguments) as GeneratedPlan;
  } catch {
    throw new HttpError(
      502,
      "The AI's response was incomplete. Please try again."
    );
  }

  return persistGeneratedPlan(userId, plan, input);
}

// ── Prompts ──────────────────────────────────────────

function buildSystemPrompt(input: PlanRequest): string {
  const goals = {
    BUILD_MUSCLE:
      "hypertrophy (muscle growth). Moderate rep ranges (8–12), 3–4 sets per exercise, progressive overload week over week.",
    GET_STRONGER:
      "strength. Low rep ranges (3–6), heavy compound lifts, longer rest between sets.",
    LOSE_FAT:
      "fat loss. Higher rep ranges (10–20), shorter rest, some superset-style work. Balance strength with conditioning.",
    GENERAL_FITNESS:
      "general fitness. Balanced mix of strength and light cardio. Aim for sustainability over intensity.",
  };

  const equipment = {
    FULL_GYM:
      "a full commercial gym — barbells, dumbbells, machines, cables, benches, squat racks.",
    DUMBBELLS_ONLY:
      "dumbbells and a bench only. No barbells, no machines, no cables.",
    BODYWEIGHT:
      "bodyweight and minimal equipment (floor, wall, a chair). No weights. For progression, increase reps week over week.",
  };

  const experience = {
    BEGINNER:
      "BEGINNER. Prioritize form and simple movements. Do NOT prescribe starting weights — set targetWeight to null for all exercises. 3 sets per exercise is enough.",
    INTERMEDIATE:
      "INTERMEDIATE. Include compound lifts and accessories. Progressive overload week over week. You may prescribe reasonable starting weights, but it is fine to set targetWeight to null if unsure.",
    EXPERIENCED:
      "EXPERIENCED. Heavy compound work plus targeted accessories. Prescribe starting weights.",
  };

  return `You are an expert strength and conditioning coach. You build structured, sensible workout programs.

USER'S CONSTRAINTS
- Goal: ${goals[input.goal]}
- Equipment available: ${equipment[input.equipment]}
- Session length: ${input.sessionMinutes} minutes
- Training days per week: ${input.daysPerWeek}
- Experience level: ${experience[input.experienceLevel]}

HARD RULES
1. Every week in the plan must have exactly 7 days. Days not used for training must be marked kind: "REST" with an empty exercises array.
2. STRENGTH days must fit the time budget. Roughly 1 minute per set including rest. For a 45-minute session, aim for ~15–20 total sets across all exercises. For 60 minutes, ~20–25 sets.
3. exerciseId must be kebab-case and describe the movement: "barbell-bench-press", "dumbbell-row", "bodyweight-squat", "cable-face-pull". For non-gym movement (walks, runs), use the "move_" prefix: "move_walk", "move_run".
4. Never invent equipment the user doesn't have. If the user has dumbbells only, do not include barbell exercises.
5. Every strength day must have 3–6 exercises.
6. For BEGINNER experience, set targetWeight to null for every exercise. For INTERMEDIATE and EXPERIENCED, prescribe a reasonable starting weight in kg.
7. Keep the "notes" field short — one line, no more than 15 words. Only the first day of each week needs a note.
8. Name the plan in a way that reflects the goal and structure, e.g. "Muscle Builder — 4 Day Dumbbell" or "Strength Foundations 5×5".

Keep the plan compact. Do not add extra fields. Do not include extra commentary.

Call provide_training_plan exactly once with the complete plan. Do not call any other tool. Do not respond in plain text.`;
}

function buildUserPrompt(input: PlanRequest): string {
  return `Build a 4-week, ${input.daysPerWeek}-day-per-week program that matches all constraints. Return it by calling provide_training_plan.`;
}

// ── Persist ──────────────────────────────────────────

async function persistGeneratedPlan(
  userId: string,
  plan: GeneratedPlan,
  input: PlanRequest
): Promise<{ planId: string; planSlug: string }> {
  const slug = `ai-${input.goal.toLowerCase().replace(/_/g, "-")}-${
    input.daysPerWeek
  }d-${Date.now()}`.slice(0, 60);

  const created = await db.trainingPlan.create({
    data: {
      slug,
      name: plan.name,
      tagline: plan.tagline,
      description: plan.description,
      difficulty: plan.difficulty,
      weeks: plan.weeks,
      daysPerWeek: plan.daysPerWeek,
      planWeeks: {
        create: plan.weekTemplate.map((week) => ({
          weekNumber: week.weekNumber,
          label: week.label,
          days: {
            create: week.days.map((day) => ({
              dayNumber: day.dayNumber,
              label: day.label,
              kind: day.kind,
              notes: day.notes,
              exercises:
                day.kind === "STRENGTH" && day.exercises.length > 0
                  ? {
                      create: day.exercises.map((e, i) => ({
                        order: i,
                        exerciseId: e.exerciseId,
                        name: e.name,
                        targetSets: e.targetSets,
                        targetReps: e.targetReps,
                        targetWeight: e.targetWeight,
                      })),
                    }
                  : undefined,
            })),
          },
        })),
      },
    },
  });

  await db.userTrainingPlan.updateMany({
    where: { userId, active: true },
    data: { active: false, completedAt: new Date() },
  });

  await db.userTrainingPlan.create({
    data: {
      userId,
      planId: created.id,
      currentWeek: 1,
      currentDay: 1,
      completedDays: 0,
      active: true,
    },
  });

  return { planId: created.id, planSlug: created.slug };
}