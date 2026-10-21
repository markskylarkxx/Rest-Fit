import { ArrowRight, Sparkles } from "lucide-react";

const QUESTIONS = [
  { label: "What's your goal?", value: "Build muscle" },
  { label: "How many days a week?", value: "4 days" },
  { label: "What equipment do you have?", value: "Full gym" },
  { label: "How long per session?", value: "45 minutes" },
];

export function AIPlans() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center sm:text-left">
            <p className="eyebrow">AI plan generation</p>
            <h2 className="h2 mt-4">
              Your members get a personal training plan in 5 seconds.
            </h2>
            <p className="body-lg mt-6">
              Nobody else in Nigeria does this. Your members answer four
              questions. Our AI generates a structured 4-week program built
              for their goal, their schedule, and their equipment.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              The plan lands in their app immediately. Each day is pre-loaded
              with the right exercises, the right number of sets, and sensible
              starting weights. They just show up and train.
            </p>

            <a
              href="#signup"
              className="mt-8 inline-flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 text-sm font-semibold text-lime transition hover:text-lime-hover"
            >
              Get this for your gym
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="relative w-full max-w-[400px] mx-auto mt-8 lg:mt-0">
            <div className="rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5 shadow-2xl shadow-black/50">
              <div className="mb-5 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-lime/15 text-lime">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lime">
                    Build a plan for me
                  </p>
                  <p className="text-[10px] text-white/40">
                    Answer 4 questions
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {QUESTIONS.map((q) => (
                  <div
                    key={q.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {q.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-ink">
                      {q.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-lime px-4 py-3 text-center">
                <p className="text-xs font-bold text-canvas">
                  Build my plan →
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-lime/20 bg-lime/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-lime">
                  ✓ Plan generated
                </p>
                <p className="mt-1 text-[11px] font-semibold text-ink">
                  Hypertrophy Builder — 4 Day
                </p>
                <p className="mt-0.5 text-[10px] text-white/50">
                  4 weeks · 4 days/week · Push / Pull / Legs split
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