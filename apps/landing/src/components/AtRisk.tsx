import { ArrowRight } from "lucide-react";

export function AtRisk() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: copy */}
          <div>
            <p className="eyebrow">The feature nobody else has</p>
            <h2 className="h2 mt-4">
              A member who's training elsewhere is not a lost member.
            </h2>
            <p className="body-lg mt-6">
              Every other gym software tells you when someone stops showing up.
              RestFit tells you <em className="text-lime">where they went.</em>
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              Because your members use the RestFit app to track workouts
              anywhere — at home, at another gym, on the road — you see the
              full picture. You know who's actually gone and who's just
              off-schedule.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              That means you send the right message. Not a generic "we miss
              you." But:
            </p>

            <div className="mt-6 rounded-card border border-lime/20 bg-lime/[0.04] p-5">
              <p className="text-sm italic leading-relaxed text-white/80">
                "Saw you crushed a leg day on the app. Come back whenever —
                you've still got time on your plan."
              </p>
            </div>

            <a
              href="#signup"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-lime transition hover:text-lime-hover"
            >
              Start free trial
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right: at-risk mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-white/[0.08] bg-surface p-5 shadow-2xl shadow-black/50">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lime">
                    At-risk members
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Members who haven't checked in for 10+ days
                  </p>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/50">
                  Refresh
                </div>
              </div>

              <div className="space-y-2.5">
                <AtRiskRow
                  name="Chidi Okeke"
                  days="12 days"
                  lastWorkout="yesterday"
                  tag="Training elsewhere"
                  tone="lime"
                />
                <AtRiskRow
                  name="Amara Eze"
                  days="18 days"
                  lastWorkout="3 weeks ago"
                  tag="Lapsed"
                  tone="amber"
                />
                <AtRiskRow
                  name="Tunde Bello"
                  days="11 days"
                  lastWorkout="2 days ago"
                  tag="Training elsewhere"
                  tone="lime"
                />
                <AtRiskRow
                  name="Folake Ade"
                  days="21 days"
                  lastWorkout="never"
                  tag="Never started"
                  tone="slate"
                />
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Suggested message
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                  "Hey Chidi — saw you trained 3 times on the app this week.
                  Nice work. Come train with us whenever — you've still got
                  time on your plan."
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

function AtRiskRow({
  name,
  days,
  lastWorkout,
  tag,
  tone,
}: {
  name: string;
  days: string;
  lastWorkout: string;
  tag: string;
  tone: "lime" | "amber" | "slate";
}) {
  const toneClasses = {
    lime: "bg-lime/15 text-lime",
    amber: "bg-amber/15 text-amber",
    slate: "bg-white/[0.06] text-white/50",
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{name}</p>
          <p className="mt-0.5 text-[10px] text-white/40">
            Last check-in: {days} ago · Last workout: {lastWorkout}
          </p>
        </div>
        <span
          className={
            "ml-3 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold " +
            toneClasses[tone]
          }
        >
          {tag}
        </span>
      </div>
    </div>
  );
}