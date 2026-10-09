import { Link } from "react-router-dom";
import { MembershipBadge } from "../components/MembershipBadge";
import { Badge, Empty, ErrorNote, Loading, PageHeader, StatCard } from "../components/ui";
import { formatDate, formatNaira, formatPhone, formatTime, fullName } from "../lib/format";
import type { Dashboard } from "../lib/types";
import { useAuth } from "../lib/auth";
import { useFetch } from "../lib/useFetch";

export function DashboardPage() {
  const { staff } = useAuth();
  const { data, error, loading } = useFetch<Dashboard>("/dashboard");
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load the dashboard"} />;

  const change = data.revenueLastMonthKobo
    ? Math.round(((data.revenueThisMonthKobo - data.revenueLastMonthKobo) / data.revenueLastMonthKobo) * 100)
    : null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active members" value={data.activeMembers} hint={`${data.totalMembers} members in total`} />
        <StatCard
          label="Revenue this month"
          value={formatNaira(data.revenueThisMonthKobo)}
          hint={change === null ? "No revenue last month" : `${change >= 0 ? "+" : ""}${change}% vs last month`}
        />
        <StatCard
          label="Ending this week"
          value={data.expiringThisWeek.length}
          tone={data.expiringThisWeek.length ? "warn" : "default"}
          hint="Members to remind about renewing"
        />
        <StatCard
          label="Check-ins today"
          value={data.checkInsToday}
          hint={data.pendingPaymentsCount ? `${formatNaira(data.pendingPaymentsKobo)} waiting on ${data.pendingPaymentsCount} online payment(s)` : undefined}
        />
      </div>

      {staff?.gym.joinCode && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 bg-brand-50/50 p-4">
          <p className="text-sm text-slate-600">
            Members can join, renew and pay in the RestFit app with your gym code
          </p>
          <span className="rounded-lg bg-white px-3 py-1.5 font-mono text-lg font-semibold tracking-widest text-brand-700 ring-1 ring-brand-100">
            {staff.gym.joinCode}
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Memberships ending this week</h2>
          {data.expiringThisWeek.length === 0 ? (
            <Empty>No memberships end in the next 7 days.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.expiringThisWeek.map((s) => (
                <li key={s.subscriptionId}>
                  <Link to={`/members/${s.member.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium">{fullName(s.member)}</p>
                      <p className="text-xs text-slate-500">
                        {s.plan} · ends {formatDate(s.endDate)} · {formatPhone(s.member.phone)}
                      </p>
                    </div>
                    <MembershipBadge activeUntil={s.endDate} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Recent check-ins</h2>
          {data.recentCheckIns.length === 0 ? (
            <Empty>No check-ins yet.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentCheckIns.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link to={`/members/${c.member.id}`} className="text-sm font-medium hover:underline">
                      {fullName(c.member)}
                    </Link>
                    <p className="text-xs text-slate-500">{formatTime(c.createdAt)}</p>
                  </div>
                  {c.allowed ? <Badge tone="green">Allowed</Badge> : <Badge tone="red">Refused</Badge>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}