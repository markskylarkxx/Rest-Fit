import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Bucket = "active" | "at_risk" | "dormant" | "pending";

type AtRiskGym = {
  id: string;
  name: string;
  status: string;
  plan: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  memberCount: number;
  checkInCount: number;
  paymentCount: number;
  lastCheckInAt: string | null;
  lastPaymentAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  reasons: string[];
  riskScore: number;
};

type Response = {
  counts: Record<Bucket | "total", number>;
} & Record<Bucket, AtRiskGym[]>;

export function AtRiskGymsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [tab, setTab] = useState<Bucket>("at_risk");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Response>("/platform/at-risk-gyms")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6 text-neutral-500">Loading…</div>;

  const tabs: { key: Bucket; label: string; tone: string }[] = [
    { key: "at_risk", label: "At risk",  tone: "text-amber-700" },
    { key: "dormant", label: "Dormant",  tone: "text-red-700"   },
    { key: "pending", label: "Pending",  tone: "text-blue-700"  },
    { key: "active",  label: "Active",   tone: "text-green-700" },
  ];

  const rows = data[tab];

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">At-risk gyms</h1>
        <p className="text-sm text-neutral-500">
          {data.counts.total} gyms · {data.counts.at_risk} at risk ·{" "}
          {data.counts.dormant} dormant · {data.counts.pending} pending
        </p>
      </header>

      <nav className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? `border-current ${t.tone}` : "border-transparent text-neutral-500"
            }`}
          >
            {t.label} <span className="text-neutral-400">({data.counts[t.key]})</span>
          </button>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 py-8 text-center">Nothing here.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((g) => (
            <li key={g.id} className="py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/gyms/${g.id}`} className="font-medium hover:underline">
                    {g.name}
                  </Link>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {g.ownerName ?? "No owner"} · {g.memberCount} members ·{" "}
                    {g.plan} · joined {new Date(g.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {g.reasons.map((r) => (
                      <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-neutral-400">risk</div>
                  <div className="text-lg font-semibold tabular-nums">{g.riskScore}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}