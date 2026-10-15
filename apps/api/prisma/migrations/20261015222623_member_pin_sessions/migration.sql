-- AlterTable
ALTER TABLE "MemberUser" ADD COLUMN     "pinFailedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "pinLockedAt" TIMESTAMP(3),
ADD COLUMN     "pinSetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MemberSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberSession_tokenHash_key" ON "MemberSession"("tokenHash");

-- CreateIndex
CREATE INDEX "MemberSession_userId_idx" ON "MemberSession"("userId");

-- AddForeignKey
ALTER TABLE "MemberSession" ADD CONSTRAINT "MemberSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
