-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "paidUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PasswordSetupToken" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'SETUP';

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "sessionsValidAfter" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GymPayment" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orchPayTxnId" TEXT,
    "orchPayRef" TEXT,
    "paymentLink" TEXT,
    "failureReason" TEXT,
    "note" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "recordedById" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymPayment_orchPayTxnId_key" ON "GymPayment"("orchPayTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "GymPayment_orchPayRef_key" ON "GymPayment"("orchPayRef");

-- CreateIndex
CREATE INDEX "GymPayment_gymId_createdAt_idx" ON "GymPayment"("gymId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GymPayment_status_paidAt_idx" ON "GymPayment"("status", "paidAt");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- AddForeignKey
ALTER TABLE "GymPayment" ADD CONSTRAINT "GymPayment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymPayment" ADD CONSTRAINT "GymPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
