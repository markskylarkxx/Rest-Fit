-- CreateEnum
CREATE TYPE "PlanDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PlanDayKind" AS ENUM ('STRENGTH', 'MOVEMENT', 'REST');

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "PlanDifficulty" NOT NULL,
    "weeks" INTEGER NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlanWeek" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "TrainingPlanWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlanDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "PlanDayKind" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TrainingPlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlanExercise" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "targetWeight" DOUBLE PRECISION,

    CONSTRAINT "TrainingPlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrainingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "completedDays" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserTrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_slug_key" ON "TrainingPlan"("slug");

-- CreateIndex
CREATE INDEX "TrainingPlan_difficulty_idx" ON "TrainingPlan"("difficulty");

-- CreateIndex
CREATE INDEX "TrainingPlanWeek_planId_idx" ON "TrainingPlanWeek"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlanWeek_planId_weekNumber_key" ON "TrainingPlanWeek"("planId", "weekNumber");

-- CreateIndex
CREATE INDEX "TrainingPlanDay_weekId_idx" ON "TrainingPlanDay"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlanDay_weekId_dayNumber_key" ON "TrainingPlanDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "TrainingPlanExercise_dayId_idx" ON "TrainingPlanExercise"("dayId");

-- CreateIndex
CREATE INDEX "UserTrainingPlan_userId_active_idx" ON "UserTrainingPlan"("userId", "active");

-- AddForeignKey
ALTER TABLE "TrainingPlanWeek" ADD CONSTRAINT "TrainingPlanWeek_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlanDay" ADD CONSTRAINT "TrainingPlanDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "TrainingPlanWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlanExercise" ADD CONSTRAINT "TrainingPlanExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TrainingPlanDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrainingPlan" ADD CONSTRAINT "UserTrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrainingPlan" ADD CONSTRAINT "UserTrainingPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
