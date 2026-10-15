import { Link } from "react-router-dom";
import { MembershipBadge } from "../components/MembershipBadge";
import {
  Badge,
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  StatCard,
} from "../components/ui";
import { formatNaira, formatTime } from "../lib/format";
import type { Dashboard } from "../lib/types";
import { useAuth } from "../lib/auth";
import { useFetch } from "../lib/useFetch";

export function DashboardPage() {
  const { staff } = useAuth();
  const { data, error, loading } = useFetch<Dashboard>("/dashboard");

  if (loading && !data) return <Loading />;
  if (error || !data)
    return <ErrorNote message={error ?? "Could not load the dashboard"} />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-NG", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active members"
          value={data.activeMembers}
          hint="Members with an active membership"
        />
        <StatCard
          label="Revenue this month"
          value={formatNaira(data.revenueThisMonthKobo)}
          hint={
            data.revenueChangePct === null
              ? "No revenue last month"
              : `${data.revenueChangePct >= 0 ? "+" : ""}${data.revenueChangePct}% vs last month`
          }
        />
        <StatCard
          label="Ending this week"
          value={data.endingThisWeek}
          tone={data.endingThisWeek > 0 ? "warn" : "default"}
          hint="Members to remind about renewing"
        />
        <StatCard
          label="Check-ins today"
          value={data.checkInsToday}
          hint={
            data.pendingPayments > 0
              ? `${data.pendingPayments} online payment(s) pending`
              : undefined
          }
        />
      </div>

      {staff?.gym.joinCode && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 bg-brand-50/50 p-4">
          <p className="text-sm text-slate-600">
            Members can join, renew and pay in the RestFit app with your gym
            code
          </p>
          <span className="rounded-lg bg-white px-3 py-1.5 font-mono text-lg font-semibold tracking-widest text-brand-700 ring-1 ring-brand-100">
            {staff.gym.joinCode}
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">
            Recent check-ins
          </h2>
          {data.recentCheckIns.length === 0 ? (
            <Empty>No check-ins yet.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentCheckIns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.memberName}</p>
                    <p className="text-xs text-slate-500">
                      {formatTime(c.at)}
                    </p>
                  </div>
                  {c.allowed ? (
                    <Badge tone="green">Allowed</Badge>
                  ) : (
                    <Badge tone="red">Refused</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">
            Quick actions
          </h2>
          <div className="space-y-2 p-4">
            <Link
              to="/check-in"
              className="block rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
            >
              <p className="font-medium">Open check-in</p>
              <p className="text-xs text-slate-500">
                Scan a member's QR code
              </p>
            </Link>
            <Link
              to="/members"
              className="block rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
            >
              <p className="font-medium">Add a member</p>
              <p className="text-xs text-slate-500">
                Register someone at the front desk
              </p>
            </Link>
            <Link
              to="/payments"
              className="block rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
            >
              <p className="font-medium">Record a payment</p>
              <p className="text-xs text-slate-500">
                Cash, transfer, or POS
              </p>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}