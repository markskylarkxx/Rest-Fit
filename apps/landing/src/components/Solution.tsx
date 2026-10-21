import {
  Calendar,
  CreditCard,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

const GYM_FEATURES = [
  {
    icon: TrendingUp,
    title: "Live dashboard",
    body: "Active members, revenue, expiring this week, check-ins today. All in one view.",
  },
  {
    icon: ShieldCheck,
    title: "At-risk members",
    body: "See who's drifting — and whether they're still training on the app elsewhere.",
  },
  {
    icon: QrCode,
    title: "QR check-in",
    body: "Scan at the door. Green or red. Every scan logged with the exact time.",
  },
  {
    icon: CreditCard,
    title: "Payments ledger",
    body: "Cash, transfer, POS, online. One ledger. No notebook required.",
  },
  {
    icon: RefreshCw,
    title: "Retention engine",
    body: "Automated WhatsApp reminders at 7, 3, and 1 day. Zero manual chasing.",
  },
  {
    icon: Users,
    title: "Member profiles",
    body: "Full payment and check-in history for every member, at a glance.",
  },
  {
    icon: UserCog,
    title: "Staff accounts",
    body: "Owner, Admin, Front Desk, Trainer. Each role sees only what it needs.",
  },
];

const MEMBER_FEATURES = [
  {
    icon: Calendar,
    title: "Training plans",
    body: "5 preset programs, or AI-generated based on their goal and equipment.",
  },
  {
    icon: Users,
    title: "Multi-gym support",
    body: "One login. Every gym they use. You become part of their identity.",
  },
  {
    icon: QrCode,
    title: "One-tap check-in",
    body: "They show a QR at your door. It works offline. No friction.",
  },
  {
    icon: Sparkles,
    title: "AI fitness coach",
    body: "Answers their questions, builds their plans, tracks their progress.",
  },
  {
    icon: CreditCard,
    title: "In-app renewal",
    body: "They pay from their phone. You get the money instantly. No front-desk friction.",
  },
  {
    icon: TrendingUp,
    title: "Progress tracking",
    body: "Weight charts, strength progression, personal records. Proof they're improving.",
  },
  {
    icon: RefreshCw,
    title: "Progressive overload hints",
    body: "The app remembers what they lifted last time — and tells them what to try next.",
  },
];

export function Solution() {
  return (
    <section id="solution" className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
          <p className="eyebrow">The solution</p>
          <h2 className="h2 mt-4">One platform. Two apps.</h2>
          <p className="body-lg mt-4">
            RestFit isn't just software for you. It's an app for your members
            too — and that combination is what makes it work.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-card border border-white/[0.08] bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-canvas">
                <span className="text-sm font-extrabold">G</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-lime">
                  For your gym
                </p>
                <p className="text-sm font-semibold">The dashboard</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {GYM_FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-lime">
                    <f.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-white/[0.08] bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06]">
                <span className="text-sm font-extrabold text-lime">M</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  For your members
                </p>
                <p className="text-sm font-semibold">The mobile app</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {MEMBER_FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-lime">
                    <f.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}