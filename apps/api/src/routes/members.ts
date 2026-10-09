import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { memberSchema, startSubscriptionSchema } from "@restfit/shared";
import { newCheckInCode } from "../lib/codes.js";
import { db } from "../lib/db.js";
import { notFound } from "../lib/errors.js";
import { auth, requireAuth, requireRole } from "../middleware/auth.js";
import { startSubscription } from "../services/memberships.js";

export const membersRouter = Router();
membersRouter.use(requireAuth);

// Latest-ending subscription that is paid for and not yet over.
const currentSubInclude = (now: Date) =>
  ({
    subscriptions: {
      where: { status: "ACTIVE", endDate: { gte: now } },
      orderBy: { endDate: "desc" },
      take: 1,
      include: { plan: { select: { name: true } } },
    },
  }) satisfies Prisma.MemberInclude;

membersRouter.get("/", async (req, res) => {
  const { gymId } = auth(req);
  const q = String(req.query.q ?? "").trim();
  const status = String(req.query.status ?? "all");
  const phoneDigits = q.replace(/\D/g, "").replace(/^(234|0)/, "");
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeSub: Prisma.SubscriptionWhereInput = { status: "ACTIVE", endDate: { gte: now } };
  const where: Prisma.MemberWhereInput = {
    gymId,
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        // Phones are stored as +234…, so "0803 111" should match "+234803111…".
        ...(phoneDigits.length >= 3 ? [{ phone: { contains: phoneDigits } }] : []),
        { email: { contains: q, mode: "insensitive" } },
        { checkInCode: { equals: q.toUpperCase() } },
      ],
    }),
    ...(status === "active" && { subscriptions: { some: activeSub } }),
    ...(status === "inactive" && { subscriptions: { none: activeSub } }),
    ...(status === "expiring" && {
      subscriptions: { some: { ...activeSub, endDate: { gte: now, lte: weekAhead } }, none: { ...activeSub, endDate: { gt: weekAhead } } },
    }),
  };

  const members = await db.member.findMany({ where, include: currentSubInclude(now), orderBy: { createdAt: "desc" }, take: 200 });
  res.json(
    members.map(({ subscriptions, ...m }) => ({
      ...m,
      activeUntil: subscriptions[0]?.endDate ?? null,
      planName: subscriptions[0]?.plan.name ?? null,
    })),
  );
});

membersRouter.post("/", async (req, res) => {
  const input = memberSchema.parse(req.body);
  const member = await db.member.create({ data: { ...input, gymId: auth(req).gymId, checkInCode: newCheckInCode() } });
  res.status(201).json(member);
});

membersRouter.get("/:id", async (req, res) => {
  const member = await db.member.findFirst({
    where: { id: req.params.id, gymId: auth(req).gymId },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 50 },
      checkIns: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!member) throw notFound("Member");
  const now = new Date();
  const current = member.subscriptions
    .filter((s) => s.status === "ACTIVE" && s.endDate && s.endDate >= now)
    .sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime())[0];
  res.json({ ...member, activeUntil: current?.endDate ?? null });
});

membersRouter.patch("/:id", async (req, res) => {
  const input = memberSchema.partial().parse(req.body);
  const { count } = await db.member.updateMany({ where: { id: req.params.id, gymId: auth(req).gymId }, data: input });
  if (!count) throw notFound("Member");
  res.json(await db.member.findUnique({ where: { id: req.params.id } }));
});

// Issues a new QR code, e.g. when a member's card is lost.
membersRouter.post("/:id/reset-code", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const { count } = await db.member.updateMany({
    where: { id, gymId: auth(req).gymId },
    data: { checkInCode: newCheckInCode() },
  });
  if (!count) throw notFound("Member");
  res.json(await db.member.findUnique({ where: { id } }));
});

membersRouter.post("/:id/subscriptions", async (req, res) => {
  const { gymId, staffId } = auth(req);
  const input = startSubscriptionSchema.parse(req.body);
  res.status(201).json(await startSubscription(gymId, staffId, req.params.id, input));
});
