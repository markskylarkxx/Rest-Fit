import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { errorMessage } from "../lib/api";
import {
  enrollInPlan,
  getTrainingPlan,
  type PlanDifficulty,
  type TrainingPlanFull,
} from "../lib/trainingPlans";
import { Button, Card, ErrorNote, Spinner } from "../components/ui";

const DIFFICULTY_LABEL: Record<PlanDifficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function PlanDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TrainingPlanFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getTrainingPlan(slug)
      .then(setPlan)
      .catch((err) => setError(errorMessage(err)));
  }, [slug]);

  const enroll = async () => {
    if (!plan) return;
    setEnrolling(true);
    setError(null);
    try {
      await enrollInPlan(plan.slug);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setEnrolling(false);
    }
  };

  if (error && plan === null) {
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  }

  if (plan === null) return <Spinner />;

  const firstWeek = plan.weekTemplate[0];

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/plans")}
          aria-label="Back"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Plans
        </button>
      </header>

      <div className="px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
          {DIFFICULTY_LABEL[plan.difficulty]}
        </p>
        <h1 className="mt-1 heading">{plan.name}</h1>
        <p className="subheading mt-2">{plan.tagline}</p>
        <p className="mt-4 text-sm text-white/50">{plan.description}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} /> {plan.weeks} weeks
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {plan.daysPerWeek} days/week
          </span>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorNote message={error} />
          </div>
        )}

        {firstWeek && (
          <div className="mt-8">
            <p className="label mb-3">
              Week 1 preview
              {firstWeek.label ? ` · ${firstWeek.label}` : ""}
            </p>
            <div className="space-y-3">
              {firstWeek.days.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-white/40">
                        Day {d.dayNumber}
                        {d.kind === "REST" && " · Rest"}
                        {d.kind === "MOVEMENT" && " · Movement"}
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {d.label}
                      </p>
                      {d.notes && (
                        <p className="mt-1 text-xs text-white/50">
                          {d.notes}
                        </p>
                      )}
                      {d.exercises.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {d.exercises.map((e) => (
                            <li
                              key={e.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-white/80">{e.name}</span>
                              <span className="text-white/40">
                                {e.targetSets} × {e.targetReps}
                                {e.targetWeight
                                  ? ` @ ${e.targetWeight}kg`
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-white/40">
          Preview shows Week 1. The full {plan.weeks}-week plan unlocks when
          you start.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
        <Button
          onClick={enroll}
          disabled={enrolling}
          className="w-full max-w-md mx-auto block"
        >
          {enrolling ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Starting…
            </>
          ) : (
            "Start this plan"
          )}
        </Button>
      </div>
    </div>
  );
}