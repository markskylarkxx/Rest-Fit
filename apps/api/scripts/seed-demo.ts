import { db } from "../src/lib/db.js";

async function main() {
  // 1. Find your user
  const user = await db.memberUser.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!user) {
    console.error("No MemberUser found. Sign in on the app first.");
    process.exit(1);
  }

  console.log(`Seeding demo data for user ${user.id} (${user.phone})`);

  // 2. Clear any existing demo data (rows with 'Fake' marker)
  await db.workout.deleteMany({
    where: {
      userId: user.id,
      notes: { startsWith: "[DEMO]" },
    },
  });

  // 3. Generate 6 weeks of workouts — one per week, progressive weights
  const today = new Date();
  const exercises = [
    { id: "barbell-squat", name: "Barbell Squat", baseWeight: 60, reps: 5, sets: 4 },
    { id: "barbell-bench-press", name: "Barbell Bench Press", baseWeight: 50, reps: 5, sets: 4 },
    { id: "barbell-row", name: "Barbell Row", baseWeight: 45, reps: 5, sets: 4 },
  ];

  for (let week = 5; week >= 0; week--) {
    const date = new Date(today);
    date.setDate(date.getDate() - week * 7);

    // Progress weight by 2.5kg per week
    const progression = (5 - week) * 2.5;

    await db.workout.create({
      data: {
        userId: user.id,
        date,
        durationMin: 45 + week,
        notes: "[DEMO] Progressive 5x5",
        exercises: {
          create: exercises.map((ex, i) => ({
            exerciseId: ex.id,
            name: ex.name,
            order: i,
            sets: {
              create: Array.from({ length: ex.sets }, (_, j) => ({
                order: j,
                reps: ex.reps,
                weightKg: ex.baseWeight + progression,
              })),
            },
          })),
        },
      },
    });
  }

  // 4. Generate weight entries — trending down from 95 to 91 over 6 weeks
  await db.weightEntry.deleteMany({ where: { userId: user.id } });

  for (let week = 5; week >= 0; week--) {
    const date = new Date(today);
    date.setDate(date.getDate() - week * 7);

    await db.weightEntry.create({
      data: {
        userId: user.id,
        kg: 95 - (5 - week) * 0.8,
        date,
      },
    });
  }

  console.log("✓ Seeded 6 workouts and 6 weight entries");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });