import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { api, errorMessage } from "../lib/api";

interface BillingData {
  mrrKobo: number;
  arrKobo: number;
  counts: {
    totalGyms: number;
    trialing: number;
    monthly: number;
    annual: number;
  };
  expiredTrials: {
    id: string;
    name: string;
    trialEndsAt: string | null;
    createdAt: string;
  }[];
  upcomingRenewals: {
    id: string;
    name: string;
    trialEndsAt: string | null;
    createdAt: string;
  }[];
  totalGymRevenueKobo: number;
}

export function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<BillingData>("/platform/billing")
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Subscriptions, revenue, and renewals across all gyms
        </p>
      </header>

      {/* Top-line metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          label="MRR"
          value={formatNaira(data.mrrKobo)}
          hint="Monthly recurring revenue"
        />
        <MetricCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          label="ARR"
          value={formatNaira(data.arrKobo)}
          hint="Annual recurring revenue"
        />
        <MetricCard
          icon={<Calendar size={18} className="text-blue-600" />}
          label="Trialing"
          value={data.counts.trialing.toString()}
          hint="On a 30-day free trial"
        />
        <MetricCard
          icon={<Calendar size={18} className="text-slate-600" />}
          label="Paying"
          value={(data.counts.monthly + data.counts.annual).toString()}
          hint={`${data.counts.monthly} monthly · ${data.counts.annual} annual`}
        />
      </div>

      {/* Two columns: expired trials + upcoming renewals */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Expired trials */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Access ended
            </h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {data.expiredTrials.length}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Trial or subscription has ended. They get 3 days' grace, then their dashboard pauses until they pay.
          </p>

          {data.expiredTrials.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nothing to do.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.expiredTrials.map((gym) => (
                <li key={gym.id}>
                  <Link
                    to={`/gyms/${gym.id}`}
                    className="flex items-center justify-between py-2.5 transition hover:bg-slate-50 -mx-2 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {gym.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Ended{" "}
                        {gym.trialEndsAt
                          ? relativeDate(gym.trialEndsAt)
                          : "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-amber-700">
                      Expired
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming renewals */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Upcoming renewals
            </h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {data.upcomingRenewals.length}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Trials or subscriptions ending in the next 14 days.
          </p>

          {data.upcomingRenewals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No renewals in the next 2 weeks.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.upcomingRenewals.map((gym) => (
                <li key={gym.id}>
                  <Link
                    to={`/gyms/${gym.id}`}
                    className="flex items-center justify-between py-2.5 transition hover:bg-slate-50 -mx-2 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {gym.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Ends{" "}
                        {gym.trialEndsAt
                          ? relativeDate(gym.trialEndsAt)
                          : "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-blue-700">
                      Soon
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Plan breakdown */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Plan breakdown
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Trialing
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {data.counts.trialing}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              30-day free trial
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Monthly
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {data.counts.monthly}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              ₦25,000 / month
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Annual
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {data.counts.annual}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              ₦250,000 / year
            </p>
          </div>
        </div>
      </section>

      {/* Note about payment automation */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          <span className="font-medium">Coming next:</span> automated gym
          subscription billing via Paystack. For now, gyms are billed
          manually — you set the plan in the gym detail page once payment
          is received.
        </p>
      </div>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / 86_400_000
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
}