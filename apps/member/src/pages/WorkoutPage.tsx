import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  CloudOff,
  Dumbbell,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatDate, formatTime } from "../lib/format";
import {
  deleteTemplate,
  getAllTemplates,
  getAllWorkouts,
  subscribeWorkouts,
  type Workout,
  type WorkoutTemplate,
} from "../lib/workouts";
import {
  getCurrentPlan,
  type CurrentPlan,
} from "../lib/trainingPlans";
import { Button, Card, ErrorNote, Spinner } from "../components/ui";

export function WorkoutPage() {
  const location = useLocation();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [plan, setPlan] = useState<CurrentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justQueued, setJustQueued] = useState(false);
  const [prs, setPRs] = useState<
    {
      exerciseName: string;
      weightKg: number;
      reps: number;
      previousBestKg?: number;
    }[]
  >([]);

  useEffect(() => {
    const state = location.state as
      | { queued?: boolean; prs?: typeof prs }
      | null;
    if (state?.queued) setJustQueued(true);
    if (state?.prs && state.prs.length > 0) setPRs(state.prs);
  }, [location.state]);

  const load = useCallback(async () => {
    try {
      const [w, t, p] = await Promise.all([
        getAllWorkouts(),
        getAllTemplates(),
        getCurrentPlan().catch(() => null),
      ]);
      setWorkouts(w);
      setTemplates(t);
      setPlan(p);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workouts");
    }
  }, []);

  useEffect(() => {
    load();
    return subscribeWorkouts(load);
  }, [load]);

  const removeTemplate = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await deleteTemplate(id);
    } catch {
      /* load() will refresh next tick */
    }
  };

  if (error && workouts === null) {
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  }

  if (workouts === null) return <Spinner />;

  const visibleTemplates = templates.filter(
    (t) => !t.exerciseIds.some((id) => id.startsWith("move_"))
  );

  const hasPlanToday =
    plan !== null &&
    plan.today !== null &&
    plan.today.kind !== "REST";

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-8 pb-6">
        <div>
          <h1 className="heading">Workouts</h1>
          <p className="subheading mt-1">{workouts.length} logged</p>
        </div>
        <Link to="/workout/log">
          <Button>
            <Plus size={16} /> Log
          </Button>
        </Link>
      </header>

      <div className="px-6">
        {prs.length > 0 && (
          <Card className="mb-4 border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-300">
              🎉 {prs.length} new PR{prs.length === 1 ? "" : "s"}!
            </p>
            <ul className="mt-2 space-y-1 text-xs text-emerald-200/80">
              {prs.map((pr, i) => (
                <li key={i}>
                  {pr.exerciseName}: {pr.weightKg}kg × {pr.reps}
                  {pr.previousBestKg !== undefined &&
                    ` (was ${pr.previousBestKg}kg)`}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setPRs([])}
              className="mt-3 text-xs font-medium text-emerald-300/70"
            >
              Dismiss
            </button>
          </Card>
        )}

        {justQueued && (
          <Card className="mb-4 flex items-center gap-3 border-amber-500/30 bg-amber-500/10 p-4">
            <CloudOff size={20} className="text-amber-300" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-200">
                Saved offline
              </p>
              <p className="mt-0.5 text-xs text-amber-200/70">
                Your workout will sync when you're back online.
              </p>
            </div>
            <button
              onClick={() => setJustQueued(false)}
              className="text-xs font-medium text-amber-300/70"
            >
              Dismiss
            </button>
          </Card>
        )}

        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}

        {hasPlanToday && plan?.today && (
          <Link
            to={`/workout/log?planDay=${plan.today.id}`}
            className="mb-4 block"
          >
            <Card className="relative overflow-hidden border-none p-5 transition active:scale-[0.99]">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                  {plan.plan.name} · Week {plan.currentWeek}
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {plan.today.label}
                </p>
                {plan.today.exercises.length > 0 && (
                  <p className="mt-1 text-xs text-white/60">
                    {plan.today.exercises
                      .slice(0, 3)
                      .map((e) => e.name)
                      .join(" · ")}
                    {plan.today.exercises.length > 3 && " …"}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white">
                  Start today's workout <ArrowRight size={16} />
                </div>
              </div>
            </Card>
          </Link>
        )}

        {workouts.length > 0 && !hasPlanToday && (
          <Link
            to={`/workout/log?repeat=${workouts[0].id}`}
            className="mb-4 block"
          >
            <Card className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <RotateCcw size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Repeat last workout</p>
                <p className="mt-0.5 text-xs text-white/50">
                  {workouts[0].exercises.length} exercise
                  {workouts[0].exercises.length === 1 ? "" : "s"} from{" "}
                  {formatDate(workouts[0].date)}
                </p>
              </div>
              <ChevronRight size={18} className="text-white/30" />
            </Card>
          </Link>
        )}

        {visibleTemplates.length > 0 && (
          <div className="mb-5">
            <p className="label mb-3">Your templates</p>
            <div className="space-y-2">
              {visibleTemplates.map((t) => (
                <Card
                  key={t.id}
                  className="flex items-center gap-3 p-4 transition"
                >
                  <Link
                    to={`/workout/log?template=${t.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
                      <Star size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {t.name}
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {t.exerciseIds.length} exercise
                        {t.exerciseIds.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeTemplate(t.id, t.name)}
                    aria-label={`Delete template ${t.name}`}
                    className="rounded-lg p-2 text-white/30 transition hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {workouts.length === 0 ? (
          <Card className="py-12 text-center">
            <Dumbbell size={36} className="mx-auto text-white/20" />
            <p className="mt-3 text-sm font-medium text-white">
              No workouts yet
            </p>
            <p className="mt-1 text-xs text-white/50">
              Log your first workout and start your streak.
            </p>
            <Link to="/workout/log" className="mt-5 inline-block">
              <Button>
                <Plus size={16} /> Log workout
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {workouts.map((w) => (
              <Link key={w.id} to={`/workouts/${w.id}`} className="block">
                <Card className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                    <Dumbbell size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      {w.exercises.length} exercise
                      {w.exercises.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {formatDate(w.date)} · {formatTime(w.date)}
                      {w.durationMin > 0 && ` · ${w.durationMin} min`}
                    </p>
                    {w.exercises.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {w.exercises.slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70"
                          >
                            {e.name}
                          </span>
                        ))}
                        {w.exercises.length > 3 && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                            +{w.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}