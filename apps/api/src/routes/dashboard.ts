import { Router } from "express";
import { db } from "../lib/db.js";
import { auth, requireActiveBilling, requireAuth } from "../middleware/auth.js";
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
        subscriptions: {
          some: { status: "ACTIVE", endDate: { gte: now } },
        },
      },
    }),
    db.payment.aggregate({
      where: {
        gymId,
        status: "SUCCESS",
        paidAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { amountKobo: true },
    }),
    db.payment.aggregate({
      where: {
        gymId,
        status: "SUCCESS",
        paidAt: { gte: lastMonthStart, lt: monthStart },
      },
      _sum: { amountKobo: true },
    }),
    db.subscription.count({
      where: {
        gymId,
        status: "ACTIVE",
        endDate: { gte: now, lte: weekFromNow },
      },
    }),
    db.checkIn.count({
      where: { gymId, createdAt: { gte: todayStart }, allowed: true },
    }),
    db.payment.count({
      where: { gymId, status: "PENDING" },
    }),
    db.checkIn.findMany({
      where: { gymId, allowed: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.gym.findUnique({
      where: { id: gymId },
      select: { name: true, joinCode: true, status: true },
    }),
  ]);

  const revThis = revenueThisMonth._sum.amountKobo ?? 0;
  const revLast = revenueLastMonth._sum.amountKobo ?? 0;
  const revenueChangePct =
    revLast === 0 ? null : Math.round(((revThis - revLast) / revLast) * 100);

  res.json({
    gym,
    activeMembers,
    revenueThisMonthKobo: revThis,
    revenueChangePct,
    endingThisWeek,
    checkInsToday,
    pendingPayments,
    recentCheckIns: recentCheckIns.map(
      (c: {
        id: string;
        createdAt: Date;
        allowed: boolean;
        member: { firstName: string; lastName: string };
      }) => ({
        id: c.id,
        at: c.createdAt.toISOString(),
        allowed: c.allowed,
        memberName: `${c.member.firstName} ${c.member.lastName}`.trim(),
      })
    ),
  });
});

dashboardRouter.get("/at-risk", async (req, res) => {
  const { gymId } = auth(req);
  const minDays = Number(req.query.minDays) || 10;
  res.json(await getAtRiskMembers(gymId, minDays));
});



