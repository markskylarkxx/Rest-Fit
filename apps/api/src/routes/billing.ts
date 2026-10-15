import { Router } from "express";
import { z } from "zod";
import { auth, requireAuth, requireRole } from "../middleware/auth.js";
import { GYM_PLANS, getBillingStatus, refreshGymPayment, startCheckout, type GymPlan } from "../services/gymBilling.js";

// The gym's own RestFit subscription. Deliberately not behind
// requireActiveBilling: a locked gym must still be able to pay.
export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get("/", async (req, res) => {
  res.json(await getBillingStatus(auth(req).gymId));
});

const checkoutSchema = z.object({ plan: z.enum(Object.keys(GYM_PLANS) as [GymPlan, ...GymPlan[]]) });

billingRouter.post("/checkout", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const { plan } = checkoutSchema.parse(req.body);
  res.json(await startCheckout(auth(req).gymId, plan));
});

billingRouter.post("/payments/:id/refresh", async (req, res) => {
  res.json(await refreshGymPayment(String(req.params.id), auth(req).gymId));
});
