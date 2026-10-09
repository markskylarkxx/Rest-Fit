import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatDate } from "../lib/format";
import {
  addWeight,
  deleteWeight,
  listWeights,
  type WeightEntry,
} from "../lib/weights";
import {
  getBestSetSeries,
  getExerciseNamesLogged,
  getVolumeByWeek,
} from "../lib/workouts";
import { Button, Card, ErrorNote } from "../components/ui";

export function ProgressPage() {
  const [entries, setEntries] = useState<WeightEntry[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [volume, setVolume] = useState<
    { weekStart: string; volumeKg: number }[]
  >([]);
  const [lifts, setLifts] = useState<string[]>([]);
  const [activeLift, setActiveLift] = useState<string | null>(null);
  const [liftSeries, setLiftSeries] = useState<
    { date: string; weight: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const loadWeights = useCallback(async () => {
    try {
      const data = await listWeights();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load weights");
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [v, l] = await Promise.all([
        getVolumeByWeek(),
        getExerciseNamesLogged(),
      ]);
      setVolume(v);
      setLifts(l);
    } catch {
      /* silent — chart sections just show empty */
    }
  }, []);

  useEffect(() => {
    loadWeights();
    loadStats();
  }, [loadWeights, loadStats]);

  useEffect(() => {
    if (!activeLift) {
      setLiftSeries([]);
      return;
    }
    getBestSetSeries(activeLift)
      .then(setLiftSeries)
      .catch(() => setLiftSeries([]));
  }, [activeLift]);

  const add = async () => {
    const kg = parseFloat(input);
    if (!kg || kg <= 0) return;
    try {
      const created = await addWeight(kg);
      setEntries((prev) => (prev ? [created, ...prev] : [created]));
      setInput("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save weight");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this weight entry?")) return;
    try {
      await deleteWeight(id);
      setEntries((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  const latest = entries?.[0]?.kg;
  const previous = entries?.[1]?.kg;
  const diff = latest && previous ? latest - previous : 0;

  const weightChart = useMemo(
    () =>
      entries
        ? [...entries]
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .map((e) => ({
              label: new Date(e.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
              kg: e.kg,
            }))
        : [],
    [entries]
  );

  const volumeChart = useMemo(
    () =>
      volume.map((w) => ({
        label: new Date(w.weekStart).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        volume: w.volumeKg,
      })),
    [volume]
  );

  const liftChart = useMemo(
    () =>
      liftSeries.map((p) => ({
        label: new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        kg: p.weight,
      })),
    [liftSeries]
  );

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-8 pb-6">
        <div>
          <h1 className="heading">Progress</h1>
          <p className="subheading mt-1">Weight and strength</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} /> Log
        </Button>
      </header>

      <div className="px-6">
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}

        <Card className="relative overflow-hidden border-none p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="relative">
            <p className="label">Current weight</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-4xl font-bold text-white">
                {latest?.toFixed(1) ?? "—"}
              </p>
              <span className="mb-1 text-sm text-white/50">kg</span>
            </div>
            {latest && previous && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {diff < 0 ? (
                  <>
                    <TrendingDown size={16} className="text-emerald-400" />
                    <span className="text-emerald-400">
                      {Math.abs(diff).toFixed(1)} kg down
                    </span>
                  </>
                ) : diff > 0 ? (
                  <>
                    <TrendingUp size={16} className="text-amber-400" />
                    <span className="text-amber-400">
                      {diff.toFixed(1)} kg up
                    </span>
                  </>
                ) : (
                  <span className="text-white/50">No change</span>
                )}
              </div>
            )}
          </div>
        </Card>

        {adding && (
          <Card className="mt-4 p-4">
            <p className="mb-2 text-sm font-medium text-white">
              Today's weight
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter kg"
                className="input flex-1"
              />
              <Button onClick={add}>Save</Button>
            </div>
          </Card>
        )}

        {weightChart.length >= 2 && (
          <Card className="mt-4 p-4">
            <p className="label mb-3">Weight over time</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChart}>
                  <CartesianGrid
                    stroke="#ffffff10"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#999" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kg"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {volumeChart.some((v) => v.volume > 0) && (
          <Card className="mt-4 p-4">
            <p className="label mb-3">Weekly volume (kg lifted)</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChart}>
                  <CartesianGrid
                    stroke="#ffffff10"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#666"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#999" }}
                    formatter={(value: unknown) => [
                      `${Number(value ?? 0)} kg`,
                      "Volume",
                    ]}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {lifts.length > 0 && (
          <Card className="mt-4 p-4">
            <p className="label mb-3">Strength progression</p>
            <div className="-mx-1 mb-3 overflow-x-auto">
              <div className="flex gap-2 px-1">
                {lifts.map((l) => (
                  <button
                    key={l}
                    onClick={() => setActiveLift(l)}
                    className={
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                      (activeLift === l
                        ? "bg-brand-500/20 text-brand-300"
                        : "bg-white/5 text-white/50")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {activeLift && liftChart.length >= 2 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liftChart}>
                    <CartesianGrid
                      stroke="#ffffff10"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#666"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #333",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#999" }}
                      formatter={(value: unknown) => [
                        `${Number(value ?? 0)} kg`,
                        "Best set",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="kg"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-white/40">
                {activeLift
                  ? "Log this lift at least twice to see a chart."
                  : "Pick a lift to see your progression."}
              </p>
            )}
          </Card>
        )}

        {entries && entries.length > 0 && (
          <div className="mt-6">
            <p className="label mb-3">History</p>
            <Card className="divide-y divide-white/5 p-0">
              {entries.slice(0, 20).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-white/50">
                    {formatDate(e.date)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      {e.kg.toFixed(1)} kg
                    </span>
                    <button
                      onClick={() => remove(e.id)}
                      aria-label="Delete entry"
                      className="text-white/20 transition hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {entries && entries.length === 0 && !adding && (
          <Card className="mt-6 py-12 text-center">
            <p className="text-sm text-white/50">
              Log your weight to start tracking progress.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}