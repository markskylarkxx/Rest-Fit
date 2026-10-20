/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "inviteSentAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_inviteToken_key" ON "Staff"("inviteToken");
