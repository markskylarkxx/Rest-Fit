import { db } from "../lib/db.js";
import { seedPlans, type SeedPlan } from "./trainingPlans.js";

async function upsertPlan(seed: SeedPlan) {
  // Delete the existing plan tree (if any) and recreate it. This keeps
  // seed runs idempotent without tracking every nested row.
  const existing = await db.trainingPlan.findUnique({
    where: { slug: seed.slug },
    select: { id: true },
  });
  if (existing) {
    await db.trainingPlan.delete({ where: { id: existing.id } });
  }

  await db.trainingPlan.create({
    data: {
      slug: seed.slug,
      name: seed.name,
      tagline: seed.tagline,
      description: seed.description,
      difficulty: seed.difficulty,
      weeks: seed.weeks,
      daysPerWeek: seed.daysPerWeek,
      planWeeks: {
        create: seed.weekTemplate.map((week) => ({
          weekNumber: week.weekNumber,
          label: week.label,
          days: {
            create: week.days.map((day) => ({
              dayNumber: day.dayNumber,
              label: day.label,
              kind: day.kind,
              notes: day.notes,
              exercises:
                day.kind === "STRENGTH" && day.exercises
                  ? {
                      create: day.exercises.map((e, i) => ({
                        order: i,
                        exerciseId: e.exerciseId,
                        name: e.name,
                        targetSets: e.sets,
                        targetReps: e.reps,
                        targetWeight: e.weight,
                      })),
                    }
                  : undefined,
            })),
          },
        })),
      },
    },
  });

  console.log(`✓ ${seed.name} (${seed.weeks} weeks)`);
}

async function main() {
  console.log("Seeding training plans…");
  for (const plan of seedPlans) {
    await upsertPlan(plan);
  }
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });