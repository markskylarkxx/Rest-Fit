import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api";

interface Metrics {
  totalGyms: number;
  approvedGyms: number;
  pendingGyms: number;
  totalMembers: number;
  activeMembers: number;
  totalLeads: number;
  totalWaitlist: number;
}

export function OverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Metrics>("/platform/metrics")
      .then((res) => setMetrics(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!metrics) return <p className="text-slate-500">Loading…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Platform overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything across all gyms on RestFit.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total gyms" value={metrics.totalGyms} />
        <Stat label="Approved" value={metrics.approvedGyms} tone="green" />
        <Stat label="To review" value={metrics.pendingGyms} tone="amber" />
        <Stat label="Total members" value={metrics.totalMembers} />
        <Stat label="Active members" value={metrics.activeMembers} tone="green" />
        <Stat label="Leads" value={metrics.totalLeads} />
        <Stat label="Waitlist" value={metrics.totalWaitlist} />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}