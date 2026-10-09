import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { errorMessage } from "../lib/api";
import {
  enrollInPlan,
  listTrainingPlans,
  type PlanDifficulty,
  type TrainingPlanSummary,
} from "../lib/trainingPlans";
import { Button, Card, ErrorNote, Spinner } from "../components/ui";

const DIFFICULTY_LABEL: Record<PlanDifficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const DIFFICULTY_TONE: Record<PlanDifficulty, string> = {
  BEGINNER: "bg-emerald-500/15 text-emerald-300",
  INTERMEDIATE: "bg-brand-500/15 text-brand-300",
  ADVANCED: "bg-orange-500/15 text-orange-300",
};

export function PlanPickerPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TrainingPlanSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    listTrainingPlans()
      .then(setPlans)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const enroll = async (slug: string) => {
    setEnrolling(slug);
    setError(null);
    try {
      await enrollInPlan(slug);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setEnrolling(null);
    }
  };

  if (error && plans === null) {
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  }

  if (plans === null) return <Spinner />;

  return (
    <div className="min-h-screen pb-20">
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/home")}
          aria-label="Back"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Home
        </button>
      </header>

      <div className="px-6">
        <h1 className="heading">Choose a plan</h1>
        <p className="subheading mt-1">
          A structured program makes progress easier. Pick one, or let us
          build one for you.
        </p>

        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        {/* AI generation card */}
        <button
          onClick={() => navigate("/plans/generate")}
          className="mt-6 block w-full text-left transition active:scale-[0.99]"
        >
          <Card className="relative overflow-hidden border-none p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-brand-500/20 to-transparent" />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">
                <Wand2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Just for you
                </p>
                <p className="mt-1 text-base font-bold text-white">
                  Build a plan for me
                </p>
                <p className="mt-1 text-xs text-white/70">
                  Answer 5 questions. We'll generate a custom program for your
                  goal and equipment.
                </p>
              </div>
            </div>
          </Card>
        </button>

        <p className="label mb-3 mt-8">Or pick a preset</p>

        <div className="space-y-3">
          {plans.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                        DIFFICULTY_TONE[p.difficulty]
                      }
                    >
                      {DIFFICULTY_LABEL[p.difficulty]}
                    </span>
                    {p.slug.startsWith("ai-") && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                        <Sparkles size={10} /> AI
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-white">
                    {p.name}
                  </h2>
                  <p className="mt-1 text-sm text-white/60">{p.tagline}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {p.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {p.weeks} weeks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {p.daysPerWeek} days/week
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => enroll(p.slug)}
                disabled={enrolling !== null}
                className="mt-4 w-full"
              >
                {enrolling === p.slug ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Starting…
                  </>
                ) : (
                  "Start this plan"
                )}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}