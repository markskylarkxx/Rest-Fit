import { ArrowRight, Dumbbell, MapPin, Sparkles } from "lucide-react";

const GYMS = [
  {
    name: "Iron Gym, Lekki",
    plan: "Monthly · Active until 2 Nov",
    status: "active",
  },
  {
    name: "Titan Fitness, Ikeja",
    plan: "Day pass · 12 days left",
    status: "active",
  },
  {
    name: "Home workouts",
    plan: "Logged 8 sessions this month",
    status: "universal",
  },
];

export function MultiGym() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Reversed order: text first on mobile */}
          <div className="order-1 lg:order-2 text-center sm:text-left">
            <p className="eyebrow">One login. Many gyms.</p>
            <h2 className="h2 mt-4">
              Their gym, your gym, and every gym they've ever joined.
            </h2>
            <p className="body-lg mt-6">
              Real gym-goers in Nigeria don't train in one place. Home gym.
              Office gym. The one near their parents' house. A boutique studio
              on the weekend.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              No other gym software supports this. Ours does.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              Their memberships, their workout history, their streaks, their
              check-ins — all in one app. Your gym is one of them. When they
              travel, you're still with them.
            </p>

            <a
              href="#signup"
              className="mt-8 inline-flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 text-sm font-semibold text-lime transition hover:text-lime-hover"
            >
              Become part of it
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="relative order-2 lg:order-1 w-full max-w-[400px] mx-auto mt-8 lg:mt-0">
            <div className="rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5 shadow-2xl shadow-black/50">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    All your gyms
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    One login. Everywhere you train.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GYMS.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div
                      className={
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl " +
                        (g.status === "active"
                          ? "bg-lime/15 text-lime"
                          : "bg-white/[0.06] text-white/60")
                      }
                    >
                      {g.status === "active" ? (
                        <MapPin size={16} />
                      ) : (
                        <Dumbbell size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">
                        {g.name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-white/40">
                        {g.plan}
                      </p>
                    </div>
                    {g.status === "active" && (
                      <span className="shrink-0 rounded-full bg-lime/15 px-2 py-0.5 text-[9px] font-semibold text-lime">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-lime/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-lime">
                  And 12 more gyms nearby
                </p>
                <p className="mt-1 text-[11px] text-white/60">
                  Find gyms around you, see their plans, join in one tap.
                </p>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-lime/[0.06] blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}