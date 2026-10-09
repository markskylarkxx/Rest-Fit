import type {
    PlanDayKind,
    PlanDifficulty,
  } from "@prisma/client";
  
  export interface SeedExercise {
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }
  
  export interface SeedDay {
    dayNumber: number;
    label: string;
    kind: PlanDayKind;
    notes?: string;
    exercises?: SeedExercise[];
  }
  
  export interface SeedWeek {
    weekNumber: number;
    label?: string;
    days: SeedDay[];
  }
  
  export interface SeedPlan {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    difficulty: PlanDifficulty;
    weeks: number;
    daysPerWeek: number;
    weekTemplate: SeedWeek[];
  }
  
  // Helper to keep plan definitions readable. Every exercise gets a stable
  // exerciseId so the member app can look it up in its library and show
  // the right name and muscle group.
  function ex(
    exerciseId: string,
    name: string,
    sets: number,
    reps: number,
    weight?: number
  ): SeedExercise {
    return { exerciseId, name, sets, reps, weight };
  }
  
  // ─────────────────────────────────────────────────────
  // Plan 1 — First Steps (Beginner, movement-based, 8 weeks)
  // ─────────────────────────────────────────────────────
  
  const firstSteps: SeedPlan = {
    slug: "first-steps",
    name: "First Steps",
    tagline: "8 weeks. Walk, move, and feel better.",
    description:
      "A gentle 8-week program for anyone new to exercise or coming back after a long break. No gym required. Just walking, light home movement, and consistency.",
    difficulty: "BEGINNER",
    weeks: 8,
    daysPerWeek: 3,
    weekTemplate: [
      {
        weekNumber: 1,
        label: "Ease in",
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "15 minutes at a comfortable pace. Slow is fine.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          {
            dayNumber: 2,
            label: "Rest",
            kind: "REST",
          },
          {
            dayNumber: 3,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "15 minutes. Bring a friend if you can.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          {
            dayNumber: 4,
            label: "Rest",
            kind: "REST",
          },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "15 minutes. Try a new route.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          {
            dayNumber: 6,
            label: "Rest",
            kind: "REST",
          },
          {
            dayNumber: 7,
            label: "Rest",
            kind: "REST",
          },
        ],
      },
      {
        weekNumber: 2,
        label: "Build",
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "20 minutes. Same pace.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "20 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "10 minutes of light movement at home.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 3,
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "25 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "15 minutes of light movement.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "25 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 4,
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "30 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "15 minutes.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "30 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 5,
        label: "Find your rhythm",
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "30 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "20 minutes.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "30 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 6,
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "35 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "20 minutes.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "35 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 7,
        label: "One more",
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "40 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "20 minutes.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "40 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
      {
        weekNumber: 8,
        label: "Finish strong",
        days: [
          {
            dayNumber: 1,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "40 minutes.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 2, label: "Rest", kind: "REST" },
          {
            dayNumber: 3,
            label: "Home workout",
            kind: "MOVEMENT",
            notes: "25 minutes.",
            exercises: [ex("move_home", "Home workout", 1, 1)],
          },
          { dayNumber: 4, label: "Rest", kind: "REST" },
          {
            dayNumber: 5,
            label: "Walk",
            kind: "MOVEMENT",
            notes: "45 minutes. Celebrate this one.",
            exercises: [ex("move_walk", "Walk", 1, 1)],
          },
          { dayNumber: 6, label: "Rest", kind: "REST" },
          { dayNumber: 7, label: "Rest", kind: "REST" },
        ],
      },
    ],
  };
  
  // ─────────────────────────────────────────────────────
  // Plan 2 — Gym Basics (Beginner, 3 days/week, 8 weeks)
  // ─────────────────────────────────────────────────────
  
  function gymBasicsWeek(week: number): SeedWeek {
    // Weeks 1–2: light weights, focus on form. Weeks 3–4: add weight.
    // Weeks 5–6: more reps. Weeks 7–8: push hard.
    const w = (base: number) => base + (week - 1) * 2.5;
  
    return {
      weekNumber: week,
      days: [
        {
          dayNumber: 1,
          label: "Full Body A",
          kind: "STRENGTH",
          exercises: [
            ex("goblet-squat", "Goblet Squat", 3, 10, w(8)),
            ex("dumbbell-bench-press", "Dumbbell Bench Press", 3, 10, w(6)),
            ex("lat-pulldown", "Lat Pulldown", 3, 10, w(20)),
            ex("plank", "Plank", 3, 30),
          ],
        },
        { dayNumber: 2, label: "Rest", kind: "REST" },
        {
          dayNumber: 3,
          label: "Full Body B",
          kind: "STRENGTH",
          exercises: [
            ex("romanian-deadlift", "Romanian Deadlift", 3, 10, w(20)),
            ex("seated-row", "Seated Row", 3, 10, w(20)),
            ex("dumbbell-shoulder-press", "Dumbbell Shoulder Press", 3, 10, w(5)),
            ex("dead-bug", "Dead Bug", 3, 12),
          ],
        },
        { dayNumber: 4, label: "Rest", kind: "REST" },
        {
          dayNumber: 5,
          label: "Full Body C",
          kind: "STRENGTH",
          exercises: [
            ex("leg-press", "Leg Press", 3, 10, w(30)),
            ex("dumbbell-row", "Dumbbell Row", 3, 10, w(8)),
            ex("cable-fly", "Cable Fly", 3, 12, w(5)),
            ex("hanging-knee-raise", "Hanging Knee Raise", 3, 10),
          ],
        },
        { dayNumber: 6, label: "Rest", kind: "REST" },
        { dayNumber: 7, label: "Rest", kind: "REST" },
      ],
    };
  }
  
  const gymBasics: SeedPlan = {
    slug: "gym-basics",
    name: "Gym Basics",
    tagline: "8 weeks. Your first real training program.",
    description:
      "A beginner-friendly full-body program for anyone stepping into a gym for the first time. 3 days a week, 45 minutes a session. Weights progress every week.",
    difficulty: "BEGINNER",
    weeks: 8,
    daysPerWeek: 3,
    weekTemplate: Array.from({ length: 8 }, (_, i) => gymBasicsWeek(i + 1)),
  };
  
  // ─────────────────────────────────────────────────────
  // Plan 3 — Upper / Lower (Intermediate, 4 days/week, 8 weeks)
  // ─────────────────────────────────────────────────────
  
  function upperLowerWeek(week: number): SeedWeek {
    const w = (base: number) => base + (week - 1) * 2.5;
  
    return {
      weekNumber: week,
      days: [
        {
          dayNumber: 1,
          label: "Upper A",
          kind: "STRENGTH",
          exercises: [
            ex("barbell-bench-press", "Barbell Bench Press", 4, 8, w(40)),
            ex("barbell-row", "Barbell Row", 4, 8, w(40)),
            ex("overhead-press", "Overhead Press", 3, 10, w(25)),
            ex("lat-pulldown", "Lat Pulldown", 3, 10, w(35)),
            ex("bicep-curl", "Bicep Curl", 3, 12, w(10)),
          ],
        },
        {
          dayNumber: 2,
          label: "Lower A",
          kind: "STRENGTH",
          exercises: [
            ex("barbell-squat", "Barbell Squat", 4, 8, w(50)),
            ex("romanian-deadlift", "Romanian Deadlift", 4, 8, w(50)),
            ex("leg-press", "Leg Press", 3, 10, w(70)),
            ex("leg-curl", "Leg Curl", 3, 12, w(25)),
            ex("calf-raise", "Calf Raise", 4, 15, w(30)),
          ],
        },
        { dayNumber: 3, label: "Rest", kind: "REST" },
        {
          dayNumber: 4,
          label: "Upper B",
          kind: "STRENGTH",
          exercises: [
            ex("incline-bench-press", "Incline Bench Press", 4, 8, w(35)),
            ex("pull-up", "Pull-Up", 4, 6),
            ex("dumbbell-shoulder-press", "Dumbbell Shoulder Press", 3, 10, w(10)),
            ex("seated-row", "Seated Row", 3, 10, w(35)),
            ex("tricep-pushdown", "Tricep Pushdown", 3, 12, w(15)),
          ],
        },
        {
          dayNumber: 5,
          label: "Lower B",
          kind: "STRENGTH",
          exercises: [
            ex("deadlift", "Deadlift", 4, 5, w(60)),
            ex("front-squat", "Front Squat", 4, 8, w(35)),
            ex("leg-extension", "Leg Extension", 3, 12, w(25)),
            ex("leg-curl", "Leg Curl", 3, 12, w(25)),
            ex("hanging-knee-raise", "Hanging Knee Raise", 3, 12),
          ],
        },
        { dayNumber: 6, label: "Rest", kind: "REST" },
        { dayNumber: 7, label: "Rest", kind: "REST" },
      ],
    };
  }
  
  const upperLower: SeedPlan = {
    slug: "upper-lower",
    name: "Upper / Lower",
    tagline: "8 weeks. Build real strength.",
    description:
      "A classic 4-day split alternating upper body and lower body sessions. Great balance of volume and recovery. Best for someone with 6+ months of training experience.",
    difficulty: "INTERMEDIATE",
    weeks: 8,
    daysPerWeek: 4,
    weekTemplate: Array.from({ length: 8 }, (_, i) => upperLowerWeek(i + 1)),
  };
  
  // ─────────────────────────────────────────────────────
  // Plan 4 — Push / Pull / Legs (Intermediate, 6 days/week, 12 weeks)
  // ─────────────────────────────────────────────────────
  
  function pplWeek(week: number): SeedWeek {
    const w = (base: number) => base + (week - 1) * 2.5;
  
    const push = (): SeedDay => ({
      dayNumber: 1,
      label: "Push",
      kind: "STRENGTH",
      exercises: [
        ex("barbell-bench-press", "Barbell Bench Press", 4, 8, w(50)),
        ex("overhead-press", "Overhead Press", 4, 8, w(30)),
        ex("incline-dumbbell-press", "Incline Dumbbell Press", 3, 10, w(12)),
        ex("lateral-raise", "Lateral Raise", 3, 15, w(5)),
        ex("tricep-pushdown", "Tricep Pushdown", 3, 12, w(20)),
      ],
    });
    const pull = (): SeedDay => ({
      dayNumber: 2,
      label: "Pull",
      kind: "STRENGTH",
      exercises: [
        ex("deadlift", "Deadlift", 4, 5, w(70)),
        ex("barbell-row", "Barbell Row", 4, 8, w(45)),
        ex("pull-up", "Pull-Up", 4, 8),
        ex("face-pull", "Face Pull", 3, 15, w(15)),
        ex("bicep-curl", "Bicep Curl", 3, 12, w(12)),
      ],
    });
    const legs = (): SeedDay => ({
      dayNumber: 3,
      label: "Legs",
      kind: "STRENGTH",
      exercises: [
        ex("barbell-squat", "Barbell Squat", 4, 8, w(60)),
        ex("romanian-deadlift", "Romanian Deadlift", 4, 8, w(55)),
        ex("leg-press", "Leg Press", 4, 10, w(80)),
        ex("leg-curl", "Leg Curl", 3, 12, w(30)),
        ex("calf-raise", "Calf Raise", 4, 15, w(35)),
      ],
    });
  
    return {
      weekNumber: week,
      days: [
        push(),
        { ...pull(), dayNumber: 2 },
        { ...legs(), dayNumber: 3 },
        { ...push(), dayNumber: 4, label: "Push (Volume)" },
        { ...pull(), dayNumber: 5, label: "Pull (Volume)" },
        { ...legs(), dayNumber: 6, label: "Legs (Volume)" },
        { dayNumber: 7, label: "Rest", kind: "REST" },
      ],
    };
  }
  
  const ppl: SeedPlan = {
    slug: "push-pull-legs",
    name: "Push / Pull / Legs",
    tagline: "12 weeks. Serious volume.",
    description:
      "A 6-day split rotating Push, Pull, and Legs twice a week. High volume, high frequency. For experienced lifters who want to maximize muscle growth.",
    difficulty: "INTERMEDIATE",
    weeks: 12,
    daysPerWeek: 6,
    weekTemplate: Array.from({ length: 12 }, (_, i) => pplWeek(i + 1)),
  };
  
  // ─────────────────────────────────────────────────────
  // Plan 5 — Strength 5×5 (Advanced, 3 days/week, 12 weeks)
  // ─────────────────────────────────────────────────────
  
  function strength5x5Week(week: number): SeedWeek {
    const w = (base: number) => base + (week - 1) * 5;
    const isDeload = week === 7 || week === 10;
    const sets = isDeload ? 3 : 5;
  
    return {
      weekNumber: week,
      label: isDeload ? "Deload" : undefined,
      days: [
        {
          dayNumber: 1,
          label: "Workout A",
          kind: "STRENGTH",
          notes: isDeload ? "Light week. Same movements, less weight." : undefined,
          exercises: [
            ex("barbell-squat", "Barbell Squat", sets, 5, w(60)),
            ex("barbell-bench-press", "Barbell Bench Press", sets, 5, w(50)),
            ex("barbell-row", "Barbell Row", sets, 5, w(45)),
          ],
        },
        { dayNumber: 2, label: "Rest", kind: "REST" },
        {
          dayNumber: 3,
          label: "Workout B",
          kind: "STRENGTH",
          exercises: [
            ex("barbell-squat", "Barbell Squat", sets, 5, w(60)),
            ex("overhead-press", "Overhead Press", sets, 5, w(30)),
            ex("deadlift", "Deadlift", isDeload ? 1 : 3, 5, w(80)),
          ],
        },
        { dayNumber: 4, label: "Rest", kind: "REST" },
        {
          dayNumber: 5,
          label: "Workout A",
          kind: "STRENGTH",
          exercises: [
            ex("barbell-squat", "Barbell Squat", sets, 5, w(60)),
            ex("barbell-bench-press", "Barbell Bench Press", sets, 5, w(50)),
            ex("barbell-row", "Barbell Row", sets, 5, w(45)),
          ],
        },
        { dayNumber: 6, label: "Rest", kind: "REST" },
        { dayNumber: 7, label: "Rest", kind: "REST" },
      ],
    };
  }
  
  const strength5x5: SeedPlan = {
    slug: "strength-5x5",
    name: "Strength 5×5",
    tagline: "12 weeks. The classic. Nothing fancy.",
    description:
      "Squat, Bench, Row, OHP, Deadlift. Five sets of five reps. Weights climb every session. Deloads in weeks 7 and 10. Pure strength.",
    difficulty: "ADVANCED",
    weeks: 12,
    daysPerWeek: 3,
    weekTemplate: Array.from({ length: 12 }, (_, i) => strength5x5Week(i + 1)),
  };
  
  // ─────────────────────────────────────────────────────
  // All plans
  // ─────────────────────────────────────────────────────
  
  export const seedPlans: SeedPlan[] = [
    firstSteps,
    gymBasics,
    upperLower,
    ppl,
    strength5x5,
  ];