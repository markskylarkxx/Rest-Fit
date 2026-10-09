import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: Number(optional("PORT", "4000")),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  ADMIN_URL: optional("ADMIN_URL", "http://localhost:5173"),

  // Orch-Pay (optional in dev)
  ORCHPAY_API_KEY: optional("ORCHPAY_API_KEY"),
  ORCHPAY_BASE_URL: optional("ORCHPAY_BASE_URL"),
  ORCHPAY_WEBHOOK_SECRET: optional("ORCHPAY_WEBHOOK_SECRET"),

  // Termii (optional in dev — reminders print to console instead)
  TERMII_API_KEY: optional("TERMII_API_KEY"),
  TERMII_BASE_URL: optional("TERMII_BASE_URL", "https://api.ng.termii.com"),
  TERMII_SENDER_ID: optional("TERMII_SENDER_ID", "GymOS"),
  TERMII_CHANNEL: optional("TERMII_CHANNEL", "generic"),

  // Groq (required for AI plan generation)
  GROQ_API_KEY: optional("GROQ_API_KEY"),
};