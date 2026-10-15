import { Router } from "express";
import { z } from "zod";
import {
  joinGymSchema,
  memberProfileSchema,
  memberRenewSchema,
  otpRequestSchema,
  otpVerifySchema,
} from "@restfit/shared";
import { newCheckInCode } from "../lib/codes.js";
import { db } from "../lib/db.js";
import { HttpError, notFound } from "../lib/errors.js";
import { memberAuth, requireMember } from "../middleware/auth.js";
import { distanceKm, findNearbyGyms } from "../services/places.js";
import { refreshPayment, startSubscription } from "../services/memberships.js";
import { refreshSession, revokeSession, sendResetCode, setPin, signInWithPin, startSignIn, verifyPhone } from "../services/memberAuth.js";
import { rateLimit } from "../lib/rateLimit.js";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
} from "../services/templates.js";
import {
  completeCurrentDay,
  enrollUser,
  getCurrentPlan,
  getTrainingPlan,
  listTrainingPlans,
  quitCurrentPlan,
} from "../services/trainingPlans.js";
import {
  generateTrainingPlan,
  planRequestSchema,
} from "../services/aiPlanGeneration.js";
import {
  addWeight,
  deleteWeight,
  listWeights,
} from "../services/weights.js";
import {
  deleteSnapshot,
  getSnapshot,
  saveSnapshot,
} from "../services/workoutSnapshots.js";
import {
  createWorkout,
  deleteWorkout,
  getBestSetSeries,
  getExerciseNamesLogged,
  getLastForExercise,
  getVolumeByWeek,
  getWorkout,
  listPRs,
  listWorkouts,
} from "../services/workouts.js";

export const appRouter = Router();

const gymPublic = {
  id: true,
  name: true,
  address: true,
  phone: true,
  joinCode: true,
} as const;

async function membershipsFor(userId: string) {
  const now = new Date();
  const members = await db.member.findMany({
    where: { userId },
    include: {
      gym: { select: gymPublic },
      subscriptions: {
        where: { status: "ACTIVE", endDate: { gte: now } },
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return members.map(({ subscriptions, userId: _, ...m }) => ({
    ...m,
    activeUntil: subscriptions[0]?.endDate ?? null,
    planName: subscriptions[0]?.plan.name ?? null,
  }));
}

async function ownedMember(
  req: Parameters<typeof memberAuth>[0],
  memberId: string
) {
  const member = await db.member.findFirst({
    where: { id: memberId, userId: memberAuth(req).userId },
  });
  if (!member) throw notFound("Membership");
  return member;
}

const param = (v: string | string[] | undefined) => String(v);

const backupSchema = z.object({
  workouts: z.array(z.unknown()).optional(),
  weights: z.array(z.unknown()).optional(),
  prs: z.array(z.unknown()).optional(),
  templates: z.array(z.unknown()).optional(),
  schemaVersion: z.number().int().positive().optional(),
  backedUpAt: z.string().optional(),
});

const workoutSetSchema = z.object({
  reps: z.number().int().min(0),
  weightKg: z.number().min(0),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  sets: z.array(workoutSetSchema).min(1),
});

const workoutSchema = z.object({
  date: z.string(),
  durationMin: z.number().int().min(0),
  notes: z.string().optional(),
  exercises: z.array(workoutExerciseSchema).min(1),
});

const templateSchema = z.object({
  name: z.string().min(1).max(60),
  exerciseIds: z.array(z.string().min(1)).min(1).max(50),
});

const weightSchema = z.object({
  kg: z.number().positive().max(500),
  date: z.string().optional(),
});

const experienceSchema = z.object({
  level: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERIENCED"]),
});

// ── Sign in ──────────────────────────────────────────
// Phone + PIN. A code (SMS) is only sent to verify a new phone or reset a
// PIN; after that the device stays signed in with a rotating refresh token.
// See services/memberAuth.ts. Per-IP limits sit on top of the per-phone code
// limits in services/otp.ts. They're generous because Nigerian mobile
// networks put many people behind one IP.
const startLimit = rateLimit({ name: "member-start", windowMs: 60 * 60 * 1000, max: 60 });
const codeLimit = rateLimit({ name: "member-code", windowMs: 60 * 60 * 1000, max: 20 });
const verifyLimit = rateLimit({ name: "member-verify", windowMs: 15 * 60 * 1000, max: 30 });
const pinLimit = rateLimit({ name: "member-pin", windowMs: 15 * 60 * 1000, max: 30 });
const refreshLimit = rateLimit({ name: "member-refresh", windowMs: 15 * 60 * 1000, max: 120 });

const pinSchema = z.string().trim();

async function sessionResponse(session: { userId: string; accessToken: string; refreshToken: string }) {
  const user = await db.memberUser.findUniqueOrThrow({
    where: { id: session.userId },
    select: { id: true, phone: true, firstName: true, experienceLevel: true },
  });
  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    user,
    memberships: await membershipsFor(user.id),
  };
}

// Step 1: PIN for members who have one, otherwise a code is sent.
appRouter.post("/auth/start", startLimit, async (req, res) => {
  const { phone } = otpRequestSchema.parse(req.body);
  res.json(await startSignIn(phone));
});

// "Forgot PIN" / locked PIN: send a code.
appRouter.post("/auth/forgot-pin", codeLimit, async (req, res) => {
  const { phone } = otpRequestSchema.parse(req.body);
  res.json({ sent: true, ...(await sendResetCode(phone)) });
});

// Step 2 for new members and resets: check the code, then choose a PIN.
appRouter.post("/auth/verify", verifyLimit, async (req, res) => {
  const { phone, code } = otpVerifySchema.parse(req.body);
  res.json(await verifyPhone(phone, code));
});

appRouter.post("/auth/set-pin", pinLimit, async (req, res) => {
  const { pinSetupToken, pin } = z.object({ pinSetupToken: z.string().min(1), pin: pinSchema }).parse(req.body);
  res.json(await sessionResponse(await setPin(pinSetupToken, pin)));
});

// Returning member on a new device.
appRouter.post("/auth/pin", pinLimit, async (req, res) => {
  const { phone, pin } = otpRequestSchema.extend({ pin: pinSchema }).parse(req.body);
  res.json(await sessionResponse(await signInWithPin(phone, pin)));
});

appRouter.post("/auth/refresh", refreshLimit, async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
  res.json(await refreshSession(refreshToken));
});

appRouter.post("/auth/logout", refreshLimit, async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
  await revokeSession(refreshToken);
  res.json({ ok: true });
});

// ── Public gym lookups ───────────────────────────────
appRouter.get("/gyms/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Math.min(Number(req.query.radius) || 10, 50);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const gymOSGyms = await db.gym.findMany({
    where: { status: "APPROVED", lat: { not: null }, lng: { not: null } },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      joinCode: true,
      lat: true,
      lng: true,
    },
  });

  const osmGyms = await findNearbyGyms(lat, lng, radiusKm);

  function isOnGymOS(osmName: string, osmLat: number, osmLng: number) {
    return gymOSGyms.find(
      (g) =>
        g.lat !== null &&
        g.lng !== null &&
        Math.abs(g.lat - osmLat) < 0.002 &&
        Math.abs(g.lng - osmLng) < 0.002 &&
        g.name.toLowerCase().trim() === osmName.toLowerCase().trim()
    );
  }

  const result: Array<{
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lng: number;
    distanceKm: number;
    onGymOS: boolean;
    joinCode?: string;
  }> = [];

  for (const g of gymOSGyms) {
    if (g.lat === null || g.lng === null) continue;
    const d = distanceKm(lat, lng, g.lat, g.lng);
    if (d > radiusKm) continue;
    result.push({
      id: g.id,
      name: g.name,
      address: g.address,
      phone: g.phone,
      lat: g.lat,
      lng: g.lng,
      distanceKm: Math.round(d * 10) / 10,
      onGymOS: true,
      joinCode: g.joinCode,
    });
  }

  for (const o of osmGyms) {
    if (isOnGymOS(o.name, o.lat, o.lng)) continue;
    const d = distanceKm(lat, lng, o.lat, o.lng);
    if (d > radiusKm) continue;
    result.push({
      id: o.id,
      name: o.name,
      address: o.address,
      phone: o.phone,
      lat: o.lat,
      lng: o.lng,
      distanceKm: Math.round(d * 10) / 10,
      onGymOS: false,
    });
  }

  result.sort((a, b) => {
    if (a.onGymOS !== b.onGymOS) return a.onGymOS ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });

  res.json(result.slice(0, 50));
});

appRouter.get("/gyms/:joinCode", async (req, res) => {
  const gym = await db.gym.findFirst({
    where: { joinCode: param(req.params.joinCode).toUpperCase(), status: "APPROVED" },
    select: {
      ...gymPublic,
      plans: {
        where: { active: true },
        select: { id: true, name: true, priceKobo: true, durationDays: true },
        orderBy: { priceKobo: "asc" },
      },
    },
  });
  if (!gym) throw notFound("Gym");
  res.json(gym);
});

// ── Authenticated member routes ──────────────────────
appRouter.use(requireMember);

appRouter.get("/me", async (req, res) => {
  const user = await db.memberUser.findUniqueOrThrow({
    where: { id: memberAuth(req).userId },
    select: { id: true, phone: true, firstName: true, experienceLevel: true },
  });
  res.json({ user, memberships: await membershipsFor(user.id) });
});

const nameSchema = z.object({ firstName: z.string().trim().min(1, "Enter your first name").max(40) });

appRouter.put("/me/name", async (req, res) => {
  const { firstName } = nameSchema.parse(req.body);
  const user = await db.memberUser.update({
    where: { id: memberAuth(req).userId },
    data: { firstName },
    select: { firstName: true },
  });
  res.json(user);
});

appRouter.get("/me/experience", async (req, res) => {
  const user = await db.memberUser.findUniqueOrThrow({
    where: { id: memberAuth(req).userId },
    select: { experienceLevel: true },
  });
  res.json(user);
});

appRouter.put("/me/experience", async (req, res) => {
  const { userId } = memberAuth(req);
  const { level } = experienceSchema.parse(req.body);
  const user = await db.memberUser.update({
    where: { id: userId },
    data: { experienceLevel: level },
    select: { experienceLevel: true },
  });
  res.json(user);
});

appRouter.post("/gyms/:joinCode/join", async (req, res) => {
  const { userId } = memberAuth(req);
  const input = joinGymSchema.parse(req.body);
  const [user, gym] = await Promise.all([
    db.memberUser.findUniqueOrThrow({ where: { id: userId } }),
    db.gym.findFirst({
      where: { joinCode: param(req.params.joinCode).toUpperCase(), status: "APPROVED" },
    }),
  ]);
  if (!gym) throw notFound("Gym");

  const existing = await db.member.findUnique({
    where: { gymId_phone: { gymId: gym.id, phone: user.phone } },
  });
  if (existing && existing.userId && existing.userId !== userId) {
    throw new HttpError(
      409,
      "This phone number is already registered at this gym"
    );
  }

  const member = existing
    ? await db.member.update({
        where: { id: existing.id },
        data: {
          userId,
          email: existing.email ?? input.email,
          emergencyContact: existing.emergencyContact ?? input.emergencyContact,
        },
      })
    : await db.member.create({
        data: {
          ...input,
          gymId: gym.id,
          phone: user.phone,
          userId,
          checkInCode: newCheckInCode(),
        },
      });

  res
    .status(existing ? 200 : 201)
    .json({ memberId: member.id, alreadyMember: Boolean(existing) });
});

appRouter.get("/memberships/:memberId", async (req, res) => {
  const owned = await ownedMember(req, param(req.params.memberId));
  const member = await db.member.findUniqueOrThrow({
    where: { id: owned.id },
    include: {
      gym: { select: gymPublic },
      subscriptions: {
        include: { plan: { select: { name: true, durationDays: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      payments: {
        select: {
          id: true,
          amountKobo: true,
          method: true,
          status: true,
          paymentLink: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      checkIns: {
        where: { allowed: true },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });
  const now = new Date();
  const current = member.subscriptions
    .filter((s) => s.status === "ACTIVE" && s.endDate && s.endDate >= now)
    .sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime())[0];
  const { notes: _notes, userId: _userId, ...visible } = member;
  res.json({ ...visible, activeUntil: current?.endDate ?? null });
});

appRouter.patch("/memberships/:memberId", async (req, res) => {
  const member = await ownedMember(req, param(req.params.memberId));
  const input = memberProfileSchema.parse(req.body);
  const { notes: _, userId: __, ...updated } = await db.member.update({
    where: { id: member.id },
    data: input,
  });
  res.json(updated);
});

appRouter.post("/memberships/:memberId/renew", async (req, res) => {
  const member = await ownedMember(req, param(req.params.memberId));
  const { planId } = memberRenewSchema.parse(req.body);
  const { subscription, payment } = await startSubscription(
    member.gymId,
    null,
    member.id,
    { planId, method: "ONLINE" }
  );
  res.status(201).json({
    subscriptionId: subscription.id,
    paymentId: payment.id,
    paymentLink: payment.paymentLink,
    status: payment.status,
  });
});

appRouter.post(
  "/memberships/:memberId/payments/:paymentId/refresh",
  async (req, res) => {
    const member = await ownedMember(req, param(req.params.memberId));
    const payment = await db.payment.findFirst({
      where: { id: param(req.params.paymentId), memberId: member.id },
    });
    if (!payment) throw notFound("Payment");
    const { status, paidAt } = await refreshPayment(payment.id);
    res.json({ id: payment.id, status, paidAt });
  }
);

// ── Workouts ─────────────────────────────────────────
// IMPORTANT: /workouts/last/:exerciseId must be registered BEFORE
// /workouts/:id, or Express will treat "last" as an id.

appRouter.get("/workouts", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await listWorkouts(userId));
});

appRouter.post("/workouts", async (req, res) => {
  const { userId } = memberAuth(req);
  const input = workoutSchema.parse(req.body);
  const workout = await createWorkout(userId, input);
  res.status(201).json(workout);
});

appRouter.get("/workouts/last/:exerciseId", async (req, res) => {
  const { userId } = memberAuth(req);
  const last = await getLastForExercise(userId, param(req.params.exerciseId));
  res.json(last);
});

appRouter.get("/workouts/:id", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await getWorkout(userId, param(req.params.id)));
});

appRouter.delete("/workouts/:id", async (req, res) => {
  const { userId } = memberAuth(req);
  await deleteWorkout(userId, param(req.params.id));
  res.json({ deleted: true });
});

// ── Templates ────────────────────────────────────────
appRouter.get("/templates", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await listTemplates(userId));
});

appRouter.post("/templates", async (req, res) => {
  const { userId } = memberAuth(req);
  const input = templateSchema.parse(req.body);
  const template = await createTemplate(userId, input);
  res.status(201).json(template);
});

appRouter.delete("/templates/:id", async (req, res) => {
  const { userId } = memberAuth(req);
  await deleteTemplate(userId, param(req.params.id));
  res.json({ deleted: true });
});

// ── Personal records ─────────────────────────────────
appRouter.get("/prs", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await listPRs(userId));
});

// ── Stats (Progress screen) ──────────────────────────
appRouter.get("/stats/volume", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await getVolumeByWeek(userId, 8));
});

appRouter.get("/stats/exercises", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await getExerciseNamesLogged(userId));
});

appRouter.get("/stats/best/:exerciseName", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await getBestSetSeries(userId, param(req.params.exerciseName)));
});

// ── Body weight ──────────────────────────────────────
appRouter.get("/weights", async (req, res) => {
  const { userId } = memberAuth(req);
  res.json(await listWeights(userId));
});

appRouter.post("/weights", async (req, res) => {
  const { userId } = memberAuth(req);
  const input = weightSchema.parse(req.body);
  const entry = await addWeight(userId, input);
  res.status(201).json(entry);
});

appRouter.delete("/weights/:id", async (req, res) => {
  const { userId } = memberAuth(req);
  await deleteWeight(userId, param(req.params.id));
  res.json({ deleted: true });
});

// ── Training plans ───────────────────────────────────
// Route registration order matters:
//   1. /training-plans/current  (literal)
//   2. /training-plans/generate (literal)
//   3. /training-plans          (list)
//   4. /training-plans/:slug    (param, last)

appRouter.get("/training-plans/current", async (req, res) => {
  const { userId } = memberAuth(req);
  const current = await getCurrentPlan(userId);
  res.json(current);
});

appRouter.post("/training-plans/current/complete-day", async (req, res) => {
  const { userId } = memberAuth(req);
  const result = await completeCurrentDay(userId);
  res.json(result);
});

appRouter.delete("/training-plans/current", async (req, res) => {
  const { userId } = memberAuth(req);
  const result = await quitCurrentPlan(userId);
  res.json(result);
});

appRouter.post("/training-plans/generate", async (req, res) => {
  const { userId } = memberAuth(req);
  const input = planRequestSchema.parse(req.body);
  const result = await generateTrainingPlan(userId, input);
  res.status(201).json(result);
});

appRouter.get("/training-plans", async (_req, res) => {
  res.json(await listTrainingPlans());
});

appRouter.get("/training-plans/:slug", async (req, res) => {
  res.json(await getTrainingPlan(param(req.params.slug)));
});

appRouter.post("/training-plans/:slug/enroll", async (req, res) => {
  const { userId } = memberAuth(req);
  const result = await enrollUser(userId, param(req.params.slug));
  res.status(201).json(result);
});

// ── Cloud backup (safety net for pre-migration installs) ──
appRouter.post("/workouts/backup", async (req, res) => {
  const { userId } = memberAuth(req);
  const payload = backupSchema.parse(req.body);
  const result = await saveSnapshot(userId, payload);
  res.json(result);
});

appRouter.get("/workouts/backup", async (req, res) => {
  const { userId } = memberAuth(req);
  const snapshot = await getSnapshot(userId);
  if (!snapshot) {
    res.status(404).json({ error: "No backup found" });
    return;
  }
  res.json(snapshot);
});

appRouter.delete("/workouts/backup", async (req, res) => {
  const { userId } = memberAuth(req);
  await deleteSnapshot(userId);
  res.json({ deleted: true });
});