import { Router } from "express";
import { db } from "../lib/db.js";
import { z } from "zod";
import { auth, requireAuth } from "../middleware/auth.js";
import { requirePlatformAdmin } from "../middleware/platform.js";
import { approveApplication, rejectApplication, resendSetupLink } from "../services/gymApplications.js";
import { accessEndsAt, GYM_PLANS, recordManualPayment } from "../services/gymBilling.js";

export const platformRouter = Router();

platformRouter.use(requireAuth);
platformRouter.use(requirePlatformAdmin);

const DAY_MS = 86_400_000;
const daysAgo = (d: Date) => Math.floor((Date.now() - d.getTime()) / DAY_MS);
const daysUntil = (d: Date) => Math.ceil((d.getTime() - Date.now()) / DAY_MS);
const ageDays = (d: Date) => Math.floor((Date.now() - d.getTime()) / DAY_MS);

// ── Metrics ──────────────────────────────────────────
platformRouter.get("/metrics", async (_req, res) => {
  const now = new Date();
  const [
    totalGyms,
    approvedGyms,
    pendingGyms,
    totalMembers,
    activeMembers,
    totalLeads,
    totalWaitlist,
  ] = await Promise.all([
    db.gym.count(),
    db.gym.count({ where: { status: "APPROVED" } }),
    // Applications waiting for review, plus any gyms left PENDING by the old
    // self-serve signup.
    Promise.all([
      db.gymApplication.count({ where: { status: "PENDING" } }),
      db.gym.count({ where: { status: "PENDING" } }),
    ]).then(([apps, gyms]) => apps + gyms),
    db.member.count(),
    db.member.count({
      where: {
        subscriptions: {
          some: { status: "ACTIVE", endDate: { gte: now } },
        },
      },
    }),
    db.gymLead.count(),
    db.waitlist.count(),
  ]);

  res.json({
    totalGyms,
    approvedGyms,
    pendingGyms,
    totalMembers,
    activeMembers,
    totalLeads,
    totalWaitlist,
  });
});

// ── Gyms ─────────────────────────────────────────────
platformRouter.get("/gyms", async (_req, res) => {
  const gyms = await db.gym.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      staff: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
        take: 1,
      },
      _count: { select: { members: true } },
    },
  });
  res.json(gyms);
});

// ── At-risk gyms ─────────────────────────────────────
platformRouter.get("/at-risk-gyms", async (_req, res) => {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY_MS);
  const d14 = new Date(now.getTime() - 14 * DAY_MS);
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const in7 = new Date(now.getTime() + 7 * DAY_MS);

  const gyms = await db.gym.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      staff: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
        take: 1,
      },
      _count: {
        select: { members: true, checkIns: true, payments: true },
      },
    },
  });

  const [lastCheckIns, lastPayments, lastMemberAdds] = await Promise.all([
    db.checkIn.groupBy({
      by: ["gymId"],
      where: { allowed: true },
      _max: { createdAt: true },
    }),
    db.payment.groupBy({
      by: ["gymId"],
      where: { status: "SUCCESS" },
      _max: { paidAt: true },
    }),
    db.member.groupBy({
      by: ["gymId"],
      _max: { createdAt: true },
    }),
  ]);

  const lastCheckInByGym = new Map(
    lastCheckIns.map((r) => [r.gymId, r._max.createdAt]),
  );
  const lastPaymentByGym = new Map(
    lastPayments.map((r) => [r.gymId, r._max.paidAt]),
  );
  const lastMemberAddByGym = new Map(
    lastMemberAdds.map((r) => [r.gymId, r._max.createdAt]),
  );

  type Row = {
    id: string;
    name: string;
    status: string;
    plan: string;
    ownerName: string | null;
    ownerEmail: string | null;
    ownerPhone: string | null;
    memberCount: number;
    checkInCount: number;
    paymentCount: number;
    lastCheckInAt: string | null;
    lastPaymentAt: string | null;
    lastMemberAddAt: string | null;
    trialEndsAt: string | null;
    createdAt: string;
    reasons: string[];
    riskScore: number;
  };

  const buckets: Record<
    "active" | "at_risk" | "dormant" | "pending",
    Row[]
  > = {
    active: [],
    at_risk: [],
    dormant: [],
    pending: [],
  };

  for (const gym of gyms) {
    const lastCheckIn = lastCheckInByGym.get(gym.id) ?? null;
    const lastPayment = lastPaymentByGym.get(gym.id) ?? null;
    const lastMemberAdd = lastMemberAddByGym.get(gym.id) ?? null;
    const memberCount = gym._count.members;
    const hasEverBeenActive =
      gym._count.checkIns > 0 || gym._count.payments > 0;

    const reasons: string[] = [];
    let bucket: keyof typeof buckets;

    if (gym.status !== "APPROVED") {
      bucket = "pending";
      reasons.push(gym.status === "PENDING" ? "Awaiting approval" : "Rejected");
    } else {
      const noCheckIn7 = memberCount > 0 && (!lastCheckIn || lastCheckIn < d7);
      const noPayment14 = memberCount > 0 && (!lastPayment || lastPayment < d14);
      const trialEnding =
        gym.plan === "TRIAL" && !!gym.trialEndsAt && gym.trialEndsAt < in7;
      const noMembers = memberCount === 0 && gym.createdAt < d7;
      const dormantCheck =
        (!lastCheckIn || lastCheckIn < d30) &&
        (!lastPayment || lastPayment < d30) &&
        hasEverBeenActive;

      if (dormantCheck) {
        bucket = "dormant";
        reasons.push(
          lastCheckIn
            ? `Last check-in ${daysAgo(lastCheckIn)}d ago`
            : "Never checked in",
        );
        reasons.push(
          lastPayment
            ? `Last payment ${daysAgo(lastPayment)}d ago`
            : "Never paid",
        );
      } else if (noCheckIn7 || noPayment14 || trialEnding || noMembers) {
        bucket = "at_risk";
        if (noCheckIn7) reasons.push(`No check-ins ${daysAgo(lastCheckIn!)}d`);
        if (noPayment14) reasons.push(`No payments ${daysAgo(lastPayment!)}d`);
        if (trialEnding)
          reasons.push(`Trial ends in ${daysUntil(gym.trialEndsAt!)}d`);
        if (noMembers) reasons.push("No members added since signup");
      } else {
        bucket = "active";
      }
    }

    const reference = lastCheckIn ?? lastPayment ?? gym.createdAt;

    buckets[bucket].push({
      id: gym.id,
      name: gym.name,
      status: gym.status,
      plan: gym.plan,
      ownerName: gym.staff[0]?.name ?? null,
      ownerEmail: gym.staff[0]?.email ?? null,
      ownerPhone: gym.phone ?? null,
      memberCount,
      checkInCount: gym._count.checkIns,
      paymentCount: gym._count.payments,
      lastCheckInAt: lastCheckIn?.toISOString() ?? null,
      lastPaymentAt: lastPayment?.toISOString() ?? null,
      lastMemberAddAt: lastMemberAdd?.toISOString() ?? null,
      trialEndsAt: gym.trialEndsAt?.toISOString() ?? null,
      createdAt: gym.createdAt.toISOString(),
      reasons,
      riskScore: reasons.length * 10 + ageDays(reference),
    });
  }

  for (const key of Object.keys(buckets) as (keyof typeof buckets)[]) {
    buckets[key].sort((a, b) => b.riskScore - a.riskScore);
  }

  res.json({
    counts: {
      active: buckets.active.length,
      at_risk: buckets.at_risk.length,
      dormant: buckets.dormant.length,
      pending: buckets.pending.length,
      total: gyms.length,
    },
    active: buckets.active,
    at_risk: buckets.at_risk,
    dormant: buckets.dormant,
    pending: buckets.pending,
  });
});

// ── Gym applications ─────────────────────────────────
const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

platformRouter.get("/applications", async (req, res) => {
  const status = APPLICATION_STATUSES.find((s) => s === req.query.status) ?? "PENDING";
  const [applications, grouped] = await Promise.all([
    db.gymApplication.findMany({
      where: { status },
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
      take: 200,
      include: {
        reviewedBy: { select: { name: true } },
        gym: {
          select: {
            id: true,
            joinCode: true,
            staff: {
              where: { role: "OWNER" },
              select: { setupTokens: { where: { usedAt: { not: null } }, select: { id: true }, take: 1 } },
              take: 1,
            },
          },
        },
      },
    }),
    db.gymApplication.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
  for (const g of grouped) counts[g.status] = g._count._all;

  res.json({
    counts,
    applications: applications.map(({ gym, reviewedBy, ...a }) => ({
      ...a,
      reviewedBy: reviewedBy?.name ?? null,
      gym: gym
        ? { id: gym.id, joinCode: gym.joinCode, ownerActivated: Boolean(gym.staff[0]?.setupTokens.length) }
        : null,
    })),
  });
});

platformRouter.post("/applications/:id/approve", async (req, res) => {
  res.json(await approveApplication(String(req.params.id), auth(req).staffId));
});

platformRouter.post("/applications/:id/reject", async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().max(500).optional() }).parse(req.body ?? {});
  await rejectApplication(String(req.params.id), auth(req).staffId, reason || null);
  res.json({ ok: true });
});

platformRouter.post("/applications/:id/resend-link", async (req, res) => {
  res.json(await resendSetupLink(String(req.params.id)));
});

// ── Pending gyms (legacy) ────────────────────────────
// Gyms created by the old self-serve signup before applications existed.

platformRouter.get("/pending-gyms", async (_req, res) => {
  const gyms = await db.gym.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      staff: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
      },
    },
  });
  res.json(gyms);
});

platformRouter.post("/pending-gyms/:id/approve", async (req, res) => {
  await db.gym.update({
    where: { id: String(req.params.id) },
    data: { status: "APPROVED" },
  });
  res.json({ ok: true });
});

platformRouter.post("/pending-gyms/:id/reject", async (req, res) => {
  await db.gym.update({
    where: { id: String(req.params.id) },
    data: { status: "REJECTED" },
  });
  res.json({ ok: true });
});

// ── Gym detail ───────────────────────────────────────
// NOTE: keep this AFTER /pending-gyms and /at-risk-gyms.
// Express matches routes in order; a wildcard /gyms/:id
// would otherwise intercept /gyms/at-risk if that ever exists.
platformRouter.get("/gyms/:id", async (req, res) => {
  const gymId = String(req.params.id);

  const gym = await db.gym.findUnique({
    where: { id: gymId },
    include: {
      staff: {
        where: { role: "OWNER" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        take: 1,
      },
      _count: {
        select: {
          members: true,
          plans: true,
          payments: true,
          checkIns: true,
        },
      },
    },
  });
  if (!gym) {
    res.status(404).json({ error: "Gym not found" });
    return;
  }

  const now = new Date();

  const [activeMembers, recentCheckIns, recentPayments] = await Promise.all([
    db.member.count({
      where: {
        gymId,
        subscriptions: {
          some: { status: "ACTIVE", endDate: { gte: now } },
        },
      },
    }),
    db.checkIn.findMany({
      where: { gymId, allowed: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.payment.findMany({
      where: { gymId, status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
      take: 20,
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
  ]);

  const totalRevenueKobo = await db.payment.aggregate({
    where: { gymId, status: "SUCCESS" },
    _sum: { amountKobo: true },
  });
  const subscriptionPayments = await db.gymPayment.findMany({
    where: { gymId, status: "SUCCESS" },
    orderBy: { paidAt: "desc" },
    take: 12,
    include: { recordedBy: { select: { name: true } } },
  });

  res.json({
    gym: {
      id: gym.id,
      name: gym.name,
      joinCode: gym.joinCode,
      phone: gym.phone,
      address: gym.address,
      status: gym.status,
      plan: gym.plan,
      trialStartedAt: gym.trialStartedAt.toISOString(),
      trialEndsAt: gym.trialEndsAt?.toISOString() ?? null,
      paidUntil: gym.paidUntil?.toISOString() ?? null,
      accessEndsAt: accessEndsAt(gym).toISOString(),
      createdAt: gym.createdAt.toISOString(),
      counts: gym._count,
    },
    owner: gym.staff[0] ?? null,
    activeMembers,
    totalRevenueKobo: totalRevenueKobo._sum.amountKobo ?? 0,
    recentCheckIns: recentCheckIns.map((c) => ({
      id: c.id,
      at: c.createdAt.toISOString(),
      memberName: `${c.member.firstName} ${c.member.lastName}`.trim(),
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amountKobo: p.amountKobo,
      method: p.method,
      paidAt: p.paidAt?.toISOString() ?? null,
      memberName: `${p.member.firstName} ${p.member.lastName}`.trim(),
    })),
    subscriptionPayments: subscriptionPayments.map((p) => ({
      id: p.id,
      plan: p.plan,
      amountKobo: p.amountKobo,
      method: p.method,
      note: p.note,
      periodEnd: p.periodEnd?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      recordedBy: p.recordedBy?.name ?? null,
    })),
  });
});

// ── Billing ──────────────────────────────────────────
platformRouter.get("/billing", async (_req, res) => {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * DAY_MS);

  const [gyms, revenue] = await Promise.all([
    db.gym.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, plan: true, trialStartedAt: true, trialEndsAt: true, paidUntil: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.gymPayment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true } }),
  ]);

  const paying = gyms.filter((g) => g.paidUntil && g.paidUntil > now);
  const monthly = paying.filter((g) => g.plan === "MONTHLY").length;
  const annual = paying.filter((g) => g.plan === "ANNUAL").length;
  const trialing = gyms.filter((g) => !paying.includes(g) && accessEndsAt(g) > now).length;
  const mrrKobo = monthly * GYM_PLANS.MONTHLY.amountKobo + annual * Math.round(GYM_PLANS.ANNUAL.amountKobo / 12);

  const row = (g: (typeof gyms)[number]) => ({
    id: g.id,
    name: g.name,
    // Named trialEndsAt for the existing page: the date access runs out.
    trialEndsAt: accessEndsAt(g).toISOString(),
    createdAt: g.createdAt.toISOString(),
  });
  const byEnd = (a: (typeof gyms)[number], b: (typeof gyms)[number]) => accessEndsAt(a).getTime() - accessEndsAt(b).getTime();

  res.json({
    mrrKobo,
    arrKobo: mrrKobo * 12,
    counts: { totalGyms: gyms.length, trialing, monthly, annual },
    // Access ended (trial or subscription), oldest first.
    expiredTrials: gyms.filter((g) => accessEndsAt(g) < now).sort(byEnd).map(row),
    // Access ending in the next 14 days.
    upcomingRenewals: gyms
      .filter((g) => accessEndsAt(g) >= now && accessEndsAt(g) <= in14Days)
      .sort(byEnd)
      .map(row),
    totalGymRevenueKobo: revenue._sum.amountKobo ?? 0,
  });
});

// A gym paid RestFit by bank transfer or cash: record it and extend access.
const manualPaymentSchema = z.object({
  plan: z.enum(["MONTHLY", "ANNUAL"]),
  method: z.enum(["TRANSFER", "CASH"]),
  note: z.string().trim().max(300).optional(),
});

platformRouter.post("/gyms/:id/payments", async (req, res) => {
  const input = manualPaymentSchema.parse(req.body);
  const payment = await recordManualPayment({
    gymId: String(req.params.id),
    plan: input.plan,
    method: input.method,
    note: input.note || null,
    recordedById: auth(req).staffId,
  });
  res.status(201).json(payment);
});

// ── Leads ────────────────────────────────────────────
const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

platformRouter.get("/leads", async (req, res) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const leads = await db.gymLead.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
  res.json(leads);
});

platformRouter.get("/leads/counts", async (_req, res) => {
  const grouped = await db.gymLead.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    CONVERTED: 0,
    LOST: 0,
  };
  for (const g of grouped) counts[g.status] = g._count._all;
  res.json(counts);
});

platformRouter.patch("/leads/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const data: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!LEAD_STATUSES.includes(body.status as LeadStatus)) {
      res.status(400).json({ error: `Invalid status: ${body.status}` });
      return;
    }
    data.status = body.status;
    // Auto-stamp milestones when the status moves forward.
    if (body.status === "CONTACTED") data.contactedAt = new Date();
    if (body.status === "CONVERTED") data.onboardedAt = new Date();
  }

  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const lead = await db.gymLead.update({ where: { id }, data });
  res.json(lead);
});
// ── Waitlist ─────────────────────────────────────────
// Grouped by city so the operator can see where demand is
// concentrated. Biggest city first.
platformRouter.get("/waitlist", async (_req, res) => {
  const entries = await db.waitlist.findMany({
    orderBy: [{ city: "asc" }, { createdAt: "desc" }],
    take: 500,
  });

  const byCity = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.city?.trim() || "Unknown";
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(e);
  }

  const groups = Array.from(byCity.entries())
    .map(([city, items]) => ({
      city,
      count: items.length,
      entries: items,
    }))
    .sort((a, b) => b.count - a.count);

  res.json({
    total: entries.length,
    cities: groups.length,
    groups,
  });
});