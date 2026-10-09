import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell, Save, Trash2 } from "lucide-react";
import { formatDate, formatTime } from "../lib/format";
import {
  deleteWorkout,
  getWorkout,
  saveTemplate,
  type Workout,
} from "../lib/workouts";
import { Button, Card, Spinner } from "../components/ui";

export function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (!id) return;
    getWorkout(id).then((w) => setWorkout(w));
  }, [id]);

  if (workout === undefined) return <Spinner />;

  if (workout === null) {
    return (
      <div className="min-h-screen px-6 pt-6 pb-20">
        <button
          onClick={() => navigate("/workout")}
          aria-label="Back to workouts"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Workouts
        </button>
        <Card className="p-6 text-center">
          <p className="text-sm text-white/50">Workout not found.</p>
        </Card>
      </div>
    );
  }

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (n, e) => n + e.sets.reduce((s, x) => s + x.reps * x.weight, 0),
    0
  );

  // A movement session (Walk, Run, etc.) is logged with an exerciseId
  // beginning with "move_". Those shouldn't be saved as templates —
  // templates are for strength routines.
  const isMovement = workout.exercises.some((e) =>
    e.exerciseId.startsWith("move_")
  );

  const remove = async () => {
    if (!confirm("Delete this workout?")) return;
    setDeleting(true);
    try {
      await deleteWorkout(workout.id);
      navigate("/workout");
    } catch {
      setDeleting(false);
    }
  };

  const saveAsTemplate = async () => {
    const name = prompt("Template name (e.g. Push Day):")?.trim();
    if (!name) return;
    setSavingTemplate(true);
    try {
      await saveTemplate(
        name,
        workout.exercises.map((e) => e.exerciseId)
      );
      alert(`Saved "${name}" as a template.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-20">
      <button
        onClick={() => navigate("/workout")}
        aria-label="Back to workouts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-white/40"
      >
        <ArrowLeft size={16} /> Workouts
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="heading">Workout</h1>
          <p className="subheading mt-1">
            {formatDate(workout.date)} · {formatTime(workout.date)}
            {workout.durationMin > 0 && ` · ${workout.durationMin} min`}
          </p>
        </div>
        <button
          onClick={remove}
          disabled={deleting}
          aria-label="Delete workout"
          className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-red-400 disabled:opacity-40"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {workout.exercises.length}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {isMovement ? "Activity" : "Exercises"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalSets}</p>
          <p className="mt-1 text-xs text-white/50">Sets</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {isMovement ? workout.durationMin : Math.round(totalVolume / 1000)}
            {isMovement ? "m" : "k"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {isMovement ? "Minutes" : "kg lifted"}
          </p>
        </Card>
      </div>

      {!isMovement && (
        <Button
          onClick={saveAsTemplate}
          disabled={savingTemplate || workout.exercises.length === 0}
          variant="secondary"
          className="mt-4 w-full"
        >
          <Save size={16} /> {savingTemplate ? "Saving…" : "Save as template"}
        </Button>
      )}

      <div className="mt-6 space-y-3">
        {workout.exercises.map((ex, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                <Dumbbell size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{ex.name}</p>
                <p className="text-xs text-white/50">
                  {isMovement
                    ? `${workout.durationMin} min`
                    : `${ex.sets.length} set${ex.sets.length === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>

            {!isMovement && (
              <div className="mt-3 space-y-1.5">
                {ex.sets.map((s, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-white/40">Set {j + 1}</span>
                    <span className="text-white">
                      {s.reps} reps
                      {s.weight > 0 && ` × ${s.weight}kg`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}