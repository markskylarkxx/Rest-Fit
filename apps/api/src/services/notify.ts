// Sends WhatsApp/SMS messages through Termii. Without TERMII_API_KEY the
// message is printed to the console, which is enough for local development.
import { env } from "../env.js";

// "0803..." → "234803..."
const toInternational = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
};

export async function sendMessage(phone: string, text: string, channel = env.TERMII_CHANNEL) {
  if (!env.TERMII_API_KEY) {
    console.log(`[message → ${phone}] ${text}`);
    return;
  }
  const res = await fetch(`${env.TERMII_BASE_URL}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: env.TERMII_API_KEY,
      to: toInternational(phone),
      from: env.TERMII_SENDER_ID,
      sms: text,
      type: "plain",
      channel,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Termii ${res.status}: ${await res.text()}`);
}

// Sign-in codes: WhatsApp first when enabled (usually cheaper than SMS in
// Nigeria and more reliable on DND numbers), falling back to SMS.
export async function sendCode(phone: string, text: string) {
  if (env.OTP_WHATSAPP_FIRST && env.TERMII_API_KEY) {
    try {
      await sendMessage(phone, text, "whatsapp");
      return;
    } catch (err) {
      console.error("WhatsApp code failed, falling back to SMS:", err);
    }
  }
  await sendMessage(phone, text);
}
