import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { auth, requireActiveBilling, requireAuth, requireRole } from "../middleware/auth.js";
import { getAtRiskMembers } from "../services/atRisk.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireActiveBilling);

dashboardRouter.get("/", async (req, res) => {
  const { gymId } = auth(req);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    activeMembers,
    revenueThisMonth,
    revenueLastMonth,
    endingThisWeek,
    checkInsToday,
    pendingPayments,
    recentCheckIns,
    gym,
  ] = await Promise.all([
    db.member.count({
      where: {
        gymId,
        subscriptions: { some: { status: "ACTIVE", endDate: { gte: now } } },
      },
    }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCESS", paidAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amountKobo: true },
    }),
    db.payment.aggregate({
      where: { gymId, status: "SUCCESS", paidAt: { gte: lastMonthStart, lt: monthStart } },
      _sum: { amountKobo: true },
    }),
    db.subscription.count({
      where: { gymId, status: "ACTIVE", endDate: { gte: now, lte: weekFromNow } },
    }),
    db.checkIn.count({ where: { gymId, createdAt: { gte: todayStart }, allowed: true } }),
    db.payment.count({ where: { gymId, status: "PENDING" } }),
    db.checkIn.findMany({
      where: { gymId, allowed: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
    db.gym.findUnique({
      where: { id: gymId },
      select: { name: true, joinCode: true, status: true, phone: true, address: true },
    }),
  ]);

  const revThis = revenueThisMonth._sum.amountKobo ?? 0;
  const revLast = revenueLastMonth._sum.amountKobo ?? 0;
  const revenueChangePct = revLast === 0 ? null : Math.round(((revThis - revLast) / revLast) * 100);

  res.json({
    gym,
    activeMembers,
    revenueThisMonthKobo: revThis,
    revenueChangePct,
    endingThisWeek,
    checkInsToday,
    pendingPayments,
    recentCheckIns: recentCheckIns.map((c: any) => ({
      id: c.id,
      at: c.createdAt.toISOString(),
      allowed: c.allowed,
      memberName: `${c.member.firstName} ${c.member.lastName}`.trim(),
    })),
  });
});

dashboardRouter.get("/at-risk", async (req, res) => {
  const { gymId } = auth(req);
  const minDays = Number(req.query.minDays) || 10;
  res.json(await getAtRiskMembers(gymId, minDays));
});

// ── Phase 7.5: Gym Settings ──────────────────────────
dashboardRouter.patch("/gym", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const { name, phone, address } = z.object({
    name: z.string().min(2).max(100),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).parse(req.body);

  const gym = await db.gym.update({
    where: { id: auth(req).gymId },
    data: { name, phone, address },
  });

  res.json(gym);
});

dashboardRouter.patch("/me/password", async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const staff = await db.staff.findUniqueOrThrow({ where: { id: auth(req).staffId } });
  
  if (!(await bcrypt.compare(currentPassword, staff.passwordHash))) {
    throw new HttpError(401, "Current password is incorrect");
  }

  await db.staff.update({
    where: { id: staff.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  res.json({ ok: true });
});