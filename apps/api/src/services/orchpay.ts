// Client for the Orch-Pay payment orchestrator (~/My Apps/payment-orchestrator).
// Flow: createPayment → member pays on the hosted page → Orch-Pay POSTs a signed
// webhook to /webhooks/orchpay → the subscription is activated.
import crypto from "node:crypto";
import { env } from "../env.js";
import { HttpError } from "../lib/errors.js";

export interface OrchPayPayment {
  transactionId: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  paymentLink?: string;
  message?: string;
}

// The `data` object of an Orch-Pay merchant webhook (AcquirerWebhookEvent).
export interface OrchPayWebhook {
  event: "payment.success" | "payment.failed" | "payment.pending" | "payment.reversed" | "payment.updated";
  data: {
    transactionReference: string;
    acquirerReference?: string;
    status: string;
    amount?: number;
    currency?: string;
    failureReason?: string;
  };
}

export const orchPayEnabled = () => Boolean(env.ORCHPAY_API_KEY);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!orchPayEnabled()) throw new HttpError(503, "Online payments are not set up (ORCHPAY_API_KEY is missing)");
  const res = await fetch(`${env.ORCHPAY_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-API-Key": env.ORCHPAY_API_KEY!, ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Orch-Pay error", res.status, body);
    throw new HttpError(502, body.message ?? body.error ?? "Payment provider is unavailable, try again");
  }
  return body as T;
}

export const createPayment = (input: {
  paymentId: string;
  amountKobo: number;
  customerEmail: string;
  returnUrl: string;
  metadata: Record<string, string>;
}) =>
  call<OrchPayPayment>("/payments/process", {
    method: "POST",
    // Our payment id doubles as the idempotency key, so a retried request never charges twice.
    headers: { "Idempotency-Key": input.paymentId },
    body: JSON.stringify({
      amount: input.amountKobo / 100,
      currency: "NGN",
      country: "NG",
      paymentMethod: "CARD",
      customerEmail: input.customerEmail,
      externalReference: input.paymentId,
      returnUrl: input.returnUrl,
      metadata: input.metadata,
    }),
  });

export const getPayment = (transactionId: string) => call<OrchPayPayment>(`/payments/${transactionId}`);

// Orch-Pay signs webhooks as base64(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)).
export function verifyWebhook(rawBody: string, signature?: string, timestamp?: string) {
  if (!env.ORCHPAY_WEBHOOK_SECRET || !signature || !timestamp) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto
    .createHmac("sha256", env.ORCHPAY_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
