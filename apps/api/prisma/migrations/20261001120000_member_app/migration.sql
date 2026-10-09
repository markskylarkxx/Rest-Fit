-- Gym join codes: add nullable, backfill existing gyms, then require.
ALTER TABLE "Gym" ADD COLUMN "joinCode" TEXT;
UPDATE "Gym" SET "joinCode" = upper(substr(md5(random()::text || id), 1, 7)) WHERE "joinCode" IS NULL;
ALTER TABLE "Gym" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "Gym_joinCode_key" ON "Gym"("joinCode");

-- Store member phones in E.164 so app logins can find staff-created records.
UPDATE "Member" SET "phone" = '+234' || substr(regexp_replace("phone", '\D', '', 'g'), 2)
  WHERE regexp_replace("phone", '\D', '', 'g') ~ '^0[0-9]{10}$';
UPDATE "Member" SET "phone" = '+' || regexp_replace("phone", '\D', '', 'g')
  WHERE regexp_replace("phone", '\D', '', 'g') ~ '^234[0-9]{10}$' AND "phone" NOT LIKE '+%';

-- Member app accounts.
ALTER TABLE "Member" ADD COLUMN "userId" TEXT;

CREATE TABLE "MemberUser" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberUser_phone_key" ON "MemberUser"("phone");
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "OtpCode"("phone", "createdAt");
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
