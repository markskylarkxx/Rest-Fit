// Demo data: one gym, an owner login, three plans and a handful of members in
// different states (active, expiring soon, expired, never paid).
// Admin login: owner@demo.gym / password123. Member app gym code: IRONLEK.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  if (await db.staff.findUnique({ where: { email: "owner@demo.gym" } })) {
    console.log("Demo data already exists, skipping.");
    return;
  }

  const gym = await db.gym.create({ data: { name: "Iron Paradise Lekki", joinCode: "IRONLEK", phone: "+2348030000000", address: "Admiralty Way, Lekki" } });
  const owner = await db.staff.create({
    data: { gymId: gym.id, name: "Demo Owner", email: "owner@demo.gym", passwordHash: await bcrypt.hash("password123", 10), role: "OWNER" },
  });

  const [monthly, quarterly] = await Promise.all([
    db.plan.create({ data: { gymId: gym.id, name: "Monthly", priceKobo: 25_000_00, durationDays: 30 } }),
    db.plan.create({ data: { gymId: gym.id, name: "Quarterly", priceKobo: 65_000_00, durationDays: 90 } }),
    db.plan.create({ data: { gymId: gym.id, name: "Yearly", priceKobo: 220_000_00, durationDays: 365 } }),
  ]);

  // [first, last, phone, plan, days until end (null = never subscribed)]
  const people = [
    ["Chidi", "Okafor", "+2348031110001", monthly, 21],
    ["Amaka", "Eze", "+2348031110002", quarterly, 64],
    ["Tunde", "Bakare", "+2348031110003", monthly, 2],
    ["Ngozi", "Adeyemi", "+2348031110004", monthly, 5],
    ["Emeka", "Nwosu", "+2348031110005", monthly, -4],
    ["Funke", "Alabi", "+2348031110006", null, null],
  ] as const;

  for (const [i, [firstName, lastName, phone, plan, endsIn]] of people.entries()) {
    const member = await db.member.create({
      data: { gymId: gym.id, firstName, lastName, phone, email: `${firstName.toLowerCase()}@example.com`, checkInCode: `DEMO${1000 + i}` },
    });
    if (!plan || endsIn === null) continue;
    const endDate = daysFromNow(endsIn);
    const startDate = new Date(endDate.getTime() - plan.durationDays * DAY);
    const sub = await db.subscription.create({
      data: { gymId: gym.id, memberId: member.id, planId: plan.id, startDate, endDate, status: endsIn < 0 ? "EXPIRED" : "ACTIVE" },
    });
    await db.payment.create({
      data: {
        gymId: gym.id,
        memberId: member.id,
        subscriptionId: sub.id,
        amountKobo: plan.priceKobo,
        method: i % 2 ? "TRANSFER" : "CASH",
        status: "SUCCESS",
        paidAt: startDate,
        recordedById: owner.id,
      },
    });
  }
  console.log("Seeded demo gym. Sign in with owner@demo.gym / password123");
}

main().finally(() => db.$disconnect());
