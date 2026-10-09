import { AlertTriangle, MessageSquare, Receipt } from "lucide-react";

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: "Silent churn",
    body: "Member X hasn't checked in for two weeks. You don't notice until they cancel. By then, they've already decided.",
    solution:
      "RestFit shows you exactly who's drifting — and whether they're still training on the app somewhere else. You catch them before they're gone.",
  },
  {
    icon: MessageSquare,
    title: "Manual renewal chasing",
    body: "You're messaging 47 people on WhatsApp, one by one, every month. Half of them don't reply. The other half forgot.",
    solution:
      "Automated 7/3/1-day reminders. Each member gets one message. You get your time back.",
  },
  {
    icon: Receipt,
    title: "Invisible money",
    body: "Cash, transfer, POS. Tracked in a notebook that never balances. You don't know what you actually made last month.",
    solution:
      "A digital ledger. Every payment logged with member, plan, method, and timestamp. You see your business in real time.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow">The problem</p>
          <h2 className="h2 mt-4">You already know this feeling.</h2>
          <p className="body-lg mt-4">
            Running a gym in Nigeria means juggling memberships, payments, and
            renewals. Most of it happens on WhatsApp and in a notebook. And
            when members quietly stop coming, you find out too late.
          </p>
        </div>

        <div className="mt-14 space-y-6">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="grid gap-6 rounded-card border border-white/[0.06] bg-white/[0.02] p-8 md:grid-cols-2 md:gap-12 md:p-10"
            >
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber/10 text-amber">
                  <p.icon size={20} />
                </div>
                <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {p.body}
                </p>
              </div>
              <div className="flex items-start gap-4 border-t border-white/[0.06] pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lime/10 text-xs font-bold text-lime">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-lime">
                    With RestFit
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {p.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stat callout */}
        <div className="mt-14 rounded-card border border-lime/20 bg-lime/[0.04] p-8 sm:p-10">
          <p className="text-lg font-bold leading-relaxed sm:text-xl">
            A gym with 400 members losing 8% to churn loses{" "}
            <span className="text-lime">₦320,000 every month.</span>
          </p>
          <p className="mt-3 text-sm text-white/60">
            RestFit costs ₦25,000. The math is easy.
          </p>
        </div>
      </div>
    </section>
  );
}