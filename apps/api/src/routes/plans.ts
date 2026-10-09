import { Router } from "express";
import { planSchema } from "@restfit/shared";
import { db } from "../lib/db.js";
import { notFound } from "../lib/errors.js";
import { auth, requireAuth, requireRole } from "../middleware/auth.js";

export const plansRouter = Router();
plansRouter.use(requireAuth);

plansRouter.get("/", async (req, res) => {
  res.json(await db.plan.findMany({ where: { gymId: auth(req).gymId }, orderBy: [{ active: "desc" }, { priceKobo: "asc" }] }));
});

plansRouter.post("/", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const input = planSchema.parse(req.body);
  res.status(201).json(await db.plan.create({ data: { ...input, gymId: auth(req).gymId } }));
});

// Plans are never deleted (old subscriptions point at them); deactivate instead.
plansRouter.patch("/:id", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const id = req.params.id as string;
  const input = planSchema.partial().parse(req.body);
  const { count } = await db.plan.updateMany({ where: { id, gymId: auth(req).gymId }, data: input });
  if (!count) throw notFound("Plan");
  res.json(await db.plan.findUnique({ where: { id } }));
});
