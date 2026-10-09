import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, MessageCircle, RefreshCw, UserX } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatDate } from "../lib/format";
import { Badge, Empty, ErrorNote, Loading, PageHeader, StatCard } from "../components/ui";

interface AtRiskMember {
  memberId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  lastCheckIn: string | null;
  daysSinceCheckIn: number | null;
  lastWorkout: string | null;
  daysSinceWorkout: number | null;
  workoutsLast7Days: number;
  activeUntil: string | null;
  planName: string | null;
  suggestedMessage: string;
  category: "TRAINING_ELSEWHERE" | "LAPSED" | "NEVER_STARTED";
}

const CATEGORY_META: Record<
  AtRiskMember["category"],
  {
    label: string;
    tone: "green" | "amber" | "slate";
    icon: React.ReactNode;
    accent: string;
  }
> = {
  TRAINING_ELSEWHERE: {
    label: "Training elsewhere",
    tone: "green",
    icon: <RefreshCw size={14} />,
    accent: "border-l-emerald-500",
  },
  LAPSED: {
    label: "Lapsed",
    tone: "amber",
    icon: <AlertTriangle size={14} />,
    accent: "border-l-amber-500",
  },
  NEVER_STARTED: {
    label: "Never started",
    tone: "slate",
    icon: <UserX size={14} />,
    accent: "border-l-slate-400",
  },
};

export function AtRiskPage() {
  const [members, setMembers] = useState<AtRiskMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AtRiskMember[]>(
        "/dashboard/at-risk?minDays=10"
      );
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const whatsappLink = (m: AtRiskMember) => {
    const digits = m.phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(
      m.suggestedMessage
    )}`;
  };

  if (error && members === null) {
    return (
      <div>
        <PageHeader title="At-risk members" />
        <ErrorNote message={error} />
      </div>
    );
  }

  if (members === null) return <Loading />;

  const trainingElsewhere = members.filter(
    (m) => m.category === "TRAINING_ELSEWHERE"
  );
  const lapsed = members.filter((m) => m.category === "LAPSED");
  const neverStarted = members.filter((m) => m.category === "NEVER_STARTED");

  return (
    <div>
      <PageHeader
        title="At-risk members"
        subtitle="Members who haven't checked in for 10+ days. Those still training on the app get a different message."
        action={
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Training elsewhere"
          value={trainingElsewhere.length}
          hint="Still on the app, not at the gym"
        />
        <StatCard
          label="Lapsed"
          value={lapsed.length}
          hint="Gone quiet everywhere"
          tone="warn"
        />
        <StatCard
          label="Never started"
          value={neverStarted.length}
          hint="Joined but never checked in"
        />
      </div>

      <div className="mt-6">
        {members.length === 0 ? (
          <div className="card">
            <Empty>
              🎉 No at-risk members right now. Everyone's showing up.
            </Empty>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const meta = CATEGORY_META[m.category];
              return (
                <div
                  key={m.memberId}
                  className={`card border-l-4 p-5 ${meta.accent}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={meta.tone}>
                          <span className="mr-1 inline-flex">{meta.icon}</span>
                          {meta.label}
                        </Badge>
                      </div>

                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {m.name}
                      </p>
                      <p className="text-xs text-slate-500">{m.phone}</p>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <p className="text-slate-500">Last check-in</p>
                          <p className="mt-0.5 font-medium text-slate-900">
                            {m.lastCheckIn
                              ? `${m.daysSinceCheckIn}d ago`
                              : "Never"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Last workout</p>
                          <p className="mt-0.5 font-medium text-slate-900">
                            {m.lastWorkout
                              ? `${m.daysSinceWorkout}d ago`
                              : "Never"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Workouts this week</p>
                          <p className="mt-0.5 font-medium text-slate-900">
                            {m.workoutsLast7Days}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Plan</p>
                          <p className="mt-0.5 font-medium text-slate-900">
                            {m.planName ?? "—"}
                            {m.activeUntil && (
                              <span className="ml-1 font-normal text-slate-500">
                                until {formatDate(m.activeUntil)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">
                          Suggested message:
                        </span>{" "}
                        {m.suggestedMessage}
                      </div>
                    </div>

                    <a
                      href={whatsappLink(m)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}