// Turns off two-step login for a staff member who lost their phone and their
// recovery codes. They'll be asked to set it up again at their next sign-in.
// Usage: npm run mfa:reset -- admin@example.com
import { db } from "../src/lib/db.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run mfa:reset -- <email>");
  process.exit(1);
}

const staff = await db.staff.findUnique({ where: { email } });
if (!staff) {
  console.error(`No staff account with email ${email}`);
  process.exit(1);
}

await db.$transaction([
  db.mfaRecoveryCode.deleteMany({ where: { staffId: staff.id } }),
  db.staff.update({
    where: { id: staff.id },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, mfaFailedCount: 0, mfaLockedUntil: null },
  }),
]);
console.log(`Two-step login reset for ${email}. They'll set it up again after signing in.`);
await db.$disconnect();
