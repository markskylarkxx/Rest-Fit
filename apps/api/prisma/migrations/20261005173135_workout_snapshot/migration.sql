-- CreateTable
CREATE TABLE "WorkoutSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSnapshot_userId_key" ON "WorkoutSnapshot"("userId");

-- AddForeignKey
ALTER TABLE "WorkoutSnapshot" ADD CONSTRAINT "WorkoutSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
