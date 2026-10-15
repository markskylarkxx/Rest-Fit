
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { errorHandler } from "./middleware/error.js";
import { appRouter } from "./routes/app.js";
import { authRouter, staffRouter } from "./routes/auth.js";
import { checkInsRouter } from "./routes/checkins.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { membersRouter } from "./routes/members.js";
import { paymentsRouter } from "./routes/payments.js";
import { plansRouter } from "./routes/plans.js";
import { publicRouter } from "./routes/public.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { platformRouter } from "./routes/platform.js";
import { billingRouter } from "./routes/billing.js";

export const app = express();

// Behind one proxy in production (Railway); makes req.ip the real client IP
// so rate limits apply per visitor instead of to everyone at once.
app.set("trust proxy", 1);

// CORS must be before helmet so preflight responses get the right headers.
//
// IMPORTANT: Capacitor apps run from origins like "https://localhost" or
// "capacitor://localhost" which can't be whitelisted statically. So we
// reflect any origin back. This is fine because authentication is done via
// Bearer tokens, not cookies — there's no CSRF risk from reflected origins.
app.use(
  cors({
    origin: true, // reflect the request's origin
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(helmet());

app.use("/webhooks", express.raw({ type: "*/*", limit: "1mb" }), webhooksRouter);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);
app.use("/api/plans", plansRouter);
app.use("/api/members", membersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/checkins", checkInsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/billing", billingRouter);
app.use("/api/app", appRouter);
app.use("/api/public", publicRouter);
app.use("/api/platform", platformRouter);


app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);