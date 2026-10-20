import { Check } from "lucide-react";
import { whatsappLink } from "../lib/whatsapp";

const FEATURES = [
  "Unlimited members",
  "Automated WhatsApp reminders",
  "QR check-in",
  "Payment tracking (cash, transfer, POS, online)",
  "At-risk dashboard",
  "Member app access",
  "Multi-gym support",
  "Founding member pricing (locked in)",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">One price. Everything included.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg">
            No setup fee. No hidden costs. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-b from-lime/[0.06] to-transparent p-6 sm:rounded-card sm:p-10">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-white/50">Monthly</p>
              <div className="mt-1 flex items-baseline justify-center gap-2 sm:justify-start">
                <p className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                  ₦25,000
                </p>
                <span className="text-sm font-medium text-white/40">/mo</span>
              </div>
            </div>
            <div className="rounded-full bg-lime/15 px-4 py-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-lime">
                30 days free
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-white/60 sm:text-left">
            No card required. Full access for 30 days. Then ₦25,000/month.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lime/20">
                  <Check size={10} className="text-lime" strokeWidth={3} />
                </div>
                <p className="text-sm text-white/80">{f}</p>
              </div>
            ))}
          </div>

          <a href="#signup" className="btn-primary mt-8 w-full justify-center">
            Start free trial
          </a>

          <p className="mt-4 text-center text-xs text-white/40">
            Not sure yet?{" "}
            <a
              href={whatsappLink(
                "Hi RESTFit, I have a question about the pricing before I sign up."
              )}
              target="_blank"
              rel="noreferrer"
              className="text-lime underline-offset-2 hover:underline"
            >
              Chat with us on WhatsApp
            </a>
          </p>

          <p className="mt-4 text-center text-xs text-white/40">
            Most gyms recover the cost with 2 retained members per month.
          </p>
        </div>
      </div>
    </section>
  );
}