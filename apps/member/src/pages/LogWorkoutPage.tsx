import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Plus, Search, X } from "lucide-react";
import { EXERCISES, MUSCLES, type Exercise } from "../lib/exercises";
import { api } from "../lib/api";
import {
  addWorkout,
  getAllTemplates,
  getLastPerformance,
  type ExerciseLog,
  type PRHit,
  type SetLog,
} from "../lib/workouts";
import {
  completeCurrentDay,
  getCurrentPlan,
} from "../lib/trainingPlans";
import {
  fetchExperience,
  getCachedExperience,
  type ExperienceLevel,
} from "../lib/experience";
import { RestTimerPill } from "../components/RestTimerPill";
import {  Card, ErrorNote } from "../components/ui";

interface WorkoutApiShape {
  id: string;
  date: string;
  exercises: {
    exerciseId: string;
    name: string;
    sets: { reps: number; weightKg: number }[];
  }[];
}

export function LogWorkoutPage() {
  const [params] = useSearchParams();
  const hasTemplateOrRepeat =
    params.has("template") || params.has("repeat");
  const hasPlanDay = params.has("planDay");

  const [experience, setExperience] = useState<ExperienceLevel | null>(
    getCachedExperience()
  );

  useEffect(() => {
    if (experience) return;
    fetchExperience().then((l) => l && setExperience(l));
  }, [experience]);

  // Templates, repeats, and plan days always open the strength logger,
  // regardless of experience level. The user explicitly chose a workout.
  if (hasTemplateOrRepeat || hasPlanDay) return <StrengthWorkoutPage />;

  if (experience === "BEGINNER") return <MovePage />;
  return <StrengthWorkoutPage />;
}

// ── Beginner: Move ──────────────────────────────────

const MOVES = [
  { id: "walk", name: "Walk", emoji: "🚶" },
  { id: "run", name: "Run", emoji: "🏃" },
  { id: "cycle", name: "Cycle", emoji: "🚴" },
  { id: "swim", name: "Swim", emoji: "🏊" },
  { id: "home", name: "Home workout", emoji: "🏠" },
  { id: "dance", name: "Dance", emoji: "💃" },
  { id: "yoga", name: "Yoga / stretch", emoji: "🧘" },
  { id: "other", name: "Something else", emoji: "✨" },
];

const MINUTE_PRESETS = [10, 15, 20, 30, 45, 60];

type WhenOption =
  | "just-now"
  | "1h-ago"
  | "3h-ago"
  | "this-morning"
  | "yesterday";

const WHEN_LABELS: Record<WhenOption, string> = {
  "just-now": "Just now",
  "1h-ago": "1 hour ago",
  "3h-ago": "3 hours ago",
  "this-morning": "This morning",
  yesterday: "Yesterday",
};

function resolveWhen(option: WhenOption): Date {
  const now = new Date();
  switch (option) {
    case "just-now":
      return now;
    case "1h-ago": {
      const d = new Date(now);
      d.setHours(d.getHours() - 1);
      return d;
    }
    case "3h-ago": {
      const d = new Date(now);
      d.setHours(d.getHours() - 3);
      return d;
    }
    case "this-morning": {
      const d = new Date(now);
      d.setHours(8, 0, 0, 0);
      if (d.getTime() > now.getTime()) return now;
      return d;
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(18, 0, 0, 0);
      return d;
    }
  }
}

function MovePage() {
  const navigate = useNavigate();
  const [move, setMove] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(20);
  const [customMinutes, setCustomMinutes] = useState("");
  const [when, setWhen] = useState<WhenOption>("just-now");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalMinutes = (() => {
    if (customMinutes.trim()) {
      const n = parseInt(customMinutes, 10);
      if (Number.isFinite(n) && n > 0 && n <= 600) return n;
    }
    return minutes;
  })();

  const save = async () => {
    if (!move) return;
    setSaving(true);
    setError(null);
    const picked = MOVES.find((m) => m.id === move);
    const date = resolveWhen(when).toISOString();

    try {
      await addWorkout({
        date,
        durationMin: finalMinutes,
        exercises: [
          {
            exerciseId: `move_${move}`,
            name: picked?.name ?? "Move",
            sets: [{ reps: 1, weight: 0 }],
          },
        ],
      });
      navigate("/workout", { state: { queued: false } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/workout")}
          aria-label="Cancel"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Cancel
        </button>
        <button
          onClick={save}
          disabled={!move || saving}
          aria-label="Save"
          className="inline-flex items-center gap-1 rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-400 transition active:scale-95 disabled:opacity-40"
        >
          <Check size={16} /> {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="px-6">
        <h1 className="heading">Log movement</h1>
        <p className="subheading mt-1">
          Anything counts. Even 10 minutes.
        </p>

        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        <div className="mt-6">
          <p className="label mb-3">What did you do?</p>
          <div className="grid grid-cols-2 gap-3">
            {MOVES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMove(m.id)}
                className={
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition active:scale-[0.98] " +
                  (move === m.id
                    ? "border-emerald-400/60 bg-emerald-500/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                }
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-sm font-medium text-white">
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {move && (
          <div className="mt-6">
            <p className="label mb-3">How long?</p>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {MINUTE_PRESETS.map((n) => {
                  const active = !customMinutes.trim() && minutes === n;
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        setMinutes(n);
                        setCustomMinutes("");
                      }}
                      className={
                        "rounded-xl py-2.5 text-sm font-medium transition " +
                        (active
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/5 text-white/60 hover:bg-white/10")
                      }
                    >
                      {n} min
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Custom minutes"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="input flex-1 text-center"
                  min={1}
                  max={600}
                />
                <span className="text-xs text-white/40">min</span>
              </div>

              <p className="mt-3 text-center text-xs text-white/40">
                Logging{" "}
                <span className="font-medium text-white/70">
                  {finalMinutes} min
                </span>
              </p>
            </Card>
          </div>
        )}

        {move && (
          <div className="mt-6">
            <p className="label mb-3">When?</p>
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WHEN_LABELS) as WhenOption[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWhen(w)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                      (when === w
                        ? "bg-brand-500/20 text-brand-300"
                        : "bg-white/5 text-white/60 hover:bg-white/10")
                    }
                  >
                    {WHEN_LABELS[w]}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Non-beginner: full workout logger ───────────────

function StrengthWorkoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const repeatId = params.get("repeat");
  const templateId = params.get("template");
  const planDay = params.get("planDay");

  const [startedAt] = useState(new Date().toISOString());
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [picking, setPicking] = useState(false);
  const [restFor, setRestFor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Source label shown at the top so the user knows where the exercises
  // came from: their plan, a template, or a repeat of an old workout.
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!repeatId && !templateId && !planDay) return;
    (async () => {
      try {
        if (planDay) {
          const plan = await getCurrentPlan();
          if (!plan || !plan.today) return;
          setSourceLabel(
            `From your plan · ${plan.plan.name} · Week ${plan.currentWeek} · ${plan.today.label}`
          );
          const fresh: ExerciseLog[] = await Promise.all(
            plan.today.exercises.map(async (e) => {
              const last = await getLastPerformance(e.exerciseId, e.name);
              return {
                exerciseId: e.exerciseId,
                name: e.name,
                sets:
                  last?.suggestion ??
                  Array.from({ length: e.targetSets }, () => ({
                    reps: e.targetReps,
                    weight: e.targetWeight ?? 0,
                  })),
              };
            })
          );
          setLogs(fresh);
          return;
        }
        if (repeatId) {
          const { data } = await api.get<WorkoutApiShape>(
            `/app/workouts/${repeatId}`
          );
          setSourceLabel("Repeating a previous workout");
          const fresh: ExerciseLog[] = await Promise.all(
            data.exercises.map(async (ex) => {
              const last = await getLastPerformance(ex.exerciseId, ex.name);
              return {
                exerciseId: ex.exerciseId,
                name: ex.name,
                sets:
                  last?.suggestion ??
                  ex.sets.map((s) => ({ reps: s.reps, weight: s.weightKg })),
              };
            })
          );
          setLogs(fresh);
          return;
        }
        if (templateId) {
          const templates = await getAllTemplates();
          const t = templates.find((x) => x.id === templateId);
          if (!t) return;
          setSourceLabel(`From template · ${t.name}`);
          const fresh: ExerciseLog[] = await Promise.all(
            t.exerciseIds.map(async (eid) => {
              const meta = EXERCISES.find((e) => e.id === eid);
              const name = meta?.name ?? eid;
              const last = await getLastPerformance(eid, name);
              return {
                exerciseId: eid,
                name,
                sets: last?.suggestion ?? [{ reps: 10, weight: 0 }],
              };
            })
          );
          setLogs(fresh);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [repeatId, templateId, planDay]);

  const finish = async () => {
    setSaving(true);
    setError(null);
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
    );
    try {
      const { queued, prs } = await addWorkout({
        date: startedAt,
        durationMin,
        exercises: logs,
      });

      if (planDay) {
        try {
          await completeCurrentDay();
        } catch {
          /* Non-fatal. Workout saved; plan advance can happen later. */
        }
      }

      const hits: PRHit[] = prs ?? [];
      navigate("/workout", { state: { queued, prs: hits } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save workout");
      setSaving(false);
    }
  };

  const addExercise = async (ex: Exercise) => {
    const last = await getLastPerformance(ex.id, ex.name);
    setLogs([
      ...logs,
      {
        exerciseId: ex.id,
        name: ex.name,
        sets: last ? last.suggestion : [{ reps: 10, weight: 0 }],
      },
    ]);
    setPicking(false);
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    patch: Partial<SetLog>
  ) => {
    setLogs((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, ...patch } : s
              ),
            }
          : ex
      )
    );
    const name = logs[exIdx]?.name ?? "";
    const isCompound =
      /squat|deadlift|bench|press|row|pull|chin|overhead/i.test(name);
    setRestFor(isCompound ? 180 : 90);
  };

  const addSet = (exIdx: number) => {
    setLogs((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [...ex.sets, { ...ex.sets[ex.sets.length - 1] }],
            }
          : ex
      )
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setLogs((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      )
    );
  };

  const removeExercise = (exIdx: number) => {
    setLogs((prev) => prev.filter((_, i) => i !== exIdx));
  };

  if (picking) {
    return (
      <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/workout")}
          aria-label="Cancel workout"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Cancel
        </button>
        <button
          onClick={finish}
          disabled={logs.length === 0 || saving}
          aria-label="Finish workout"
          className="inline-flex items-center gap-1 rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-400 transition active:scale-95 disabled:opacity-40"
        >
          <Check size={16} /> {saving ? "Saving…" : "Finish"}
        </button>
      </header>

      <div className="px-6">
        <h1 className="heading">Log workout</h1>
        {sourceLabel ? (
          <p className="subheading mt-1">{sourceLabel}</p>
        ) : (
          <p className="subheading mt-1">
            {logs.length} exercise{logs.length === 1 ? "" : "s"} added
          </p>
        )}

        {sourceLabel && (
          <p className="mt-2 text-xs text-white/40">
            Fill in what you actually did. Adjust anything.
          </p>
        )}

        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        <div className="mt-6 space-y-4">
          {logs.map((ex, exIdx) => (
            <Card key={exIdx} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{ex.name}</p>
                <button
                  onClick={() => removeExercise(exIdx)}
                  aria-label={`Remove ${ex.name}`}
                  className="rounded-lg p-1 text-white/30 transition hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight (kg)</span>
                  <span></span>
                </div>
                {ex.sets.map((s, setIdx) => (
                  <div
                    key={setIdx}
                    className="grid grid-cols-[30px_1fr_1fr_30px] items-center gap-2"
                  >
                    <span className="text-sm text-white/50">{setIdx + 1}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.reps}
                      aria-label={`Set ${setIdx + 1} reps`}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          reps: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input py-2 text-center text-sm"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={s.weight}
                      aria-label={`Set ${setIdx + 1} weight in kilograms`}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          weight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input py-2 text-center text-sm"
                    />
                    <button
                      onClick={() => removeSet(exIdx, setIdx)}
                      aria-label={`Remove set ${setIdx + 1}`}
                      className="grid h-7 w-7 place-items-center rounded-lg text-white/30 transition hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(exIdx)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400"
              >
                <Plus size={14} /> Add set
              </button>
            </Card>
          ))}

          <button
            onClick={() => setPicking(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] py-4 text-sm font-medium text-white/60 transition hover:bg-white/[0.05]"
          >
            <Plus size={18} /> Add exercise
          </button>
        </div>
      </div>

      {restFor !== null && (
        <RestTimerPill seconds={restFor} onClose={() => setRestFor(null)} />
      )}
    </div>
  );
}

function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  const filtered = EXERCISES.filter((ex) => {
    const matchesMuscle = !muscle || ex.muscle === muscle;
    const matchesQuery =
      !q || ex.name.toLowerCase().includes(q.toLowerCase());
    return matchesMuscle && matchesQuery;
  });

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={onClose}
          aria-label="Back"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </header>

      <div className="px-6">
        <h1 className="heading">Add exercise</h1>

        <div className="relative mt-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            size={18}
          />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises"
            aria-label="Search exercises"
            className="input pl-10"
          />
        </div>

        <div className="mt-4 -mx-6 overflow-x-auto px-6 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setMuscle(null)}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                (!muscle
                  ? "bg-brand-500/20 text-brand-300"
                  : "bg-white/5 text-white/50")
              }
            >
              All
            </button>
            {MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => setMuscle(m)}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                  (muscle === m
                    ? "bg-brand-500/20 text-brand-300"
                    : "bg-white/5 text-white/50")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <div>
                <p className="text-sm font-medium text-white">{ex.name}</p>
                <p className="text-xs text-white/40">
                  {ex.muscle} · {ex.equipment}
                </p>
              </div>
              <Plus size={18} className="text-white/30" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-white/40">
              No exercises match.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}