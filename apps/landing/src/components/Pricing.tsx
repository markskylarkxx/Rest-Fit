import { Check } from "lucide-react";

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
    <section id="pricing" className="border-t border-white/[0.06] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="h2 mt-4">One price. Everything included.</h2>
          <p className="body-lg mx-auto mt-4 max-w-xl">
            No setup fee. No hidden costs. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 rounded-card border border-lime/30 bg-gradient-to-b from-lime/[0.06] to-transparent p-8 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/50">Monthly</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-5xl font-extrabold tracking-tight sm:text-6xl">
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

          <p className="mt-4 text-sm text-white/60">
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

          <a
            href="#signup"
            className="btn-primary mt-8 w-full justify-center"
          >
            Start free trial
          </a>

          <p className="mt-4 text-center text-xs text-white/40">
            Most gyms recover the cost with 2 retained members per month.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          We're onboarding our first partner gyms in Lagos.{" "}
          <span className="text-lime">
            Early adopters get locked-in pricing and direct input on the
            roadmap.
          </span>
        </p>
      </div>
    </section>
  );
}