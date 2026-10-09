import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { errorMessage } from "../lib/api";
import { generatePlan, type GeneratePlanInput, type PlanGoal, type PlanEquipment } from "../lib/trainingPlans";
import {
  fetchExperience,
  getCachedExperience,
  type ExperienceLevel,
} from "../lib/experience";
import { Button, ErrorNote } from "../components/ui";

const GOALS: { value: PlanGoal; label: string; sub: string }[] = [
  {
    value: "BUILD_MUSCLE",
    label: "Build muscle",
    sub: "Grow size and shape",
  },
  {
    value: "GET_STRONGER",
    label: "Get stronger",
    sub: "Lift heavier over time",
  },
  {
    value: "LOSE_FAT",
    label: "Lose fat",
    sub: "Lean down and feel lighter",
  },
  {
    value: "GENERAL_FITNESS",
    label: "General fitness",
    sub: "Just feel better",
  },
];

const EQUIPMENT: { value: PlanEquipment; label: string; sub: string }[] = [
  {
    value: "FULL_GYM",
    label: "Full gym",
    sub: "Barbells, machines, cables",
  },
  {
    value: "DUMBBELLS_ONLY",
    label: "Dumbbells only",
    sub: "Dumbbells and a bench",
  },
  {
    value: "BODYWEIGHT",
    label: "Bodyweight",
    sub: "No equipment",
  },
];

const DURATIONS: { value: "30" | "45" | "60" | "90"; label: string }[] = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "90 min" },
];

const DAYS = [2, 3, 4, 5, 6];

export function GeneratePlanPage() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    getCachedExperience()
  );
  const [goal, setGoal] = useState<PlanGoal | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<PlanEquipment | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState<"30" | "45" | "60" | "90" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (experience) return;
    fetchExperience().then((l) => l && setExperience(l));
  }, [experience]);

  const ready =
    goal !== null &&
    daysPerWeek !== null &&
    equipment !== null &&
    sessionMinutes !== null &&
    experience !== null;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const input: GeneratePlanInput = {
        goal,
        daysPerWeek,
        equipment,
        sessionMinutes,
        experienceLevel: experience,
      };
      await generatePlan(input);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  // While Groq is generating, show a full-screen loading state.
  if (busy) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/15 text-brand-400">
          <Sparkles size={32} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">
          Building your plan
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-white/50">
          Picking exercises, setting the reps, and laying out your weeks.
          This takes a few seconds.
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-white/40">
          <Loader2 size={16} className="animate-spin" />
          Generating…
        </div>
      </div>
    );
  }

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
        <h1 className="heading">Build a plan for me</h1>
        <p className="subheading mt-1">
          Five questions. Then we build a plan just for you.
        </p>

        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        {/* Goal */}
        <div className="mt-6">
          <p className="label mb-3">
            <Target size={14} className="mr-2 inline" />
            What's your goal?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={
                  "rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
                  (goal === g.value
                    ? "border-brand-400/60 bg-brand-500/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                }
              >
                <p className="text-sm font-semibold text-white">{g.label}</p>
                <p className="mt-0.5 text-xs text-white/50">{g.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Days per week */}
        <div className="mt-6">
          <p className="label mb-3">
            <Calendar size={14} className="mr-2 inline" />
            How many days a week?
          </p>
          <div className="grid grid-cols-5 gap-2">
            {DAYS.map((n) => (
              <button
                key={n}
                onClick={() => setDaysPerWeek(n)}
                className={
                  "rounded-xl py-3 text-sm font-semibold transition " +
                  (daysPerWeek === n
                    ? "bg-brand-500/20 text-brand-300"
                    : "bg-white/5 text-white/60 hover:bg-white/10")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="mt-6">
          <p className="label mb-3">
            <Dumbbell size={14} className="mr-2 inline" />
            What equipment do you have?
          </p>
          <div className="space-y-2">
            {EQUIPMENT.map((e) => (
              <button
                key={e.value}
                onClick={() => setEquipment(e.value)}
                className={
                  "w-full rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
                  (equipment === e.value
                    ? "border-brand-400/60 bg-brand-500/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                }
              >
                <p className="text-sm font-semibold text-white">{e.label}</p>
                <p className="mt-0.5 text-xs text-white/50">{e.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Session length */}
        <div className="mt-6">
          <p className="label mb-3">
            <Clock size={14} className="mr-2 inline" />
            How long per session?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSessionMinutes(d.value)}
                className={
                  "rounded-xl py-3 text-sm font-semibold transition " +
                  (sessionMinutes === d.value
                    ? "bg-brand-500/20 text-brand-300"
                    : "bg-white/5 text-white/60 hover:bg-white/10")
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            onClick={submit}
            disabled={!ready}
            className="w-full"
          >
            <Sparkles size={16} /> Build my plan
          </Button>
          {!ready && (
            <p className="mt-2 text-center text-xs text-white/40">
              Answer all questions to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}