import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  Plus,
  QrCode,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { daysUntil, formatDate } from "../lib/format";
import {
  computeStreak,
  computeWorkoutsThisWeek,
  getAllWorkouts,
  subscribeWorkouts,
  type Workout,
} from "../lib/workouts";
import {
  fetchExperience,
  getCachedExperience,
  type ExperienceLevel,
} from "../lib/experience";
import {
  getCurrentPlan,
  quitCurrentPlan,
  type CurrentPlan,
} from "../lib/trainingPlans";
import { InviteGymModal } from "../components/InviteGymModal";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  LogoCircle,
  Spinner,
} from "../components/ui";

interface Membership {
  id: string;
  firstName: string;
  lastName: string;
  activeUntil: string | null;
  planName: string | null;
  gym: { id: string; name: string; address: string | null };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekStrip(workouts: Workout[]) {
  const days: { label: string; active: boolean }[] = [];
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = startOfDay(new Date());
  const activeDays = new Set(
    workouts.map((w) => startOfDay(new Date(w.date)).toDateString())
  );
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      label: labels[d.getDay()],
      active: activeDays.has(d.toDateString()),
    });
  }
  return days;
}

function relativeDay(iso: string): string {
  const d = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function heroCopy(level: ExperienceLevel, streak: number) {
  if (level === "BEGINNER") {
    return {
      headline:
        streak === 0
          ? "Welcome"
          : `${streak} day${streak === 1 ? "" : "s"} of movement`,
      sub:
        streak === 0
          ? "You showed up. That's the hardest part."
          : "Every session counts. Even short ones.",
      cta: "Move today",
      ctaLink: "/workout/log",
      accent: "emerald" as const,
    };
  }
  if (level === "INTERMEDIATE") {
    return {
      headline: `${streak} day${streak === 1 ? "" : "s"}`,
      sub:
        streak === 0
          ? "Start today — consistency beats intensity."
          : "Keep the streak alive.",
      cta: "Start workout",
      ctaLink: "/workout/log",
      accent: "orange" as const,
    };
  }
  return {
    headline: `${streak} day${streak === 1 ? "" : "s"}`,
    sub:
      streak === 0
        ? "Log your first session and the streak begins."
        : "Another day in the books. Let's go.",
    cta: "Start workout",
    ctaLink: "/workout/log",
    accent: "orange" as const,
  };
}

export function HomePage() {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    getCachedExperience()
  );
  const [plan, setPlan] = useState<CurrentPlan | null | undefined>(undefined);
  const [quitting, setQuitting] = useState(false);

  useEffect(() => {
    api
      .get<{ memberships: Membership[] }>("/app/me")
      .then((res) => setMemberships(res.data.memberships))
      .catch((err) => setError(errorMessage(err)));
    fetchExperience().then((level) => {
      if (level) setExperience(level);
    });
    getCurrentPlan()
      .then(setPlan)
      .catch(() => setPlan(null));
  }, []);

  useEffect(() => {
    const refresh = () => {
      getAllWorkouts()
        .then(setWorkouts)
        .catch(() => {
          /* keep previous list */
        });
    };
    refresh();
    return subscribeWorkouts(refresh);
  }, []);

  const confirmQuit = async () => {
    setQuitting(true);
    setError(null);
    try {
      await quitCurrentPlan();
      setPlan(null);
      setQuitting(false);
    } catch (err) {
      setError(errorMessage(err));
      setQuitting(false);
    }
  };

  if (error && !memberships)
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  if (!memberships) return <Spinner />;

  const firstName = memberships.find((m) => m.firstName)?.firstName ?? "";
  const streak = computeStreak(workouts);
  const thisWeek = computeWorkoutsThisWeek(workouts);
  const week = weekStrip(workouts);
  const activeMembership = memberships.find(
    (m) => m.activeUntil && daysUntil(m.activeUntil) > 0
  );

  const lastWorkout =
    workouts.length === 0
      ? null
      : [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  const level: ExperienceLevel = experience ?? "INTERMEDIATE";
  const hero = heroCopy(level, streak);

  const hasPlan = plan !== undefined && plan !== null;
  const isRestDay = hasPlan && plan.today.kind === "REST";

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-start justify-between px-6 pt-8 pb-4">
        <div>
          <p className="text-sm text-white/50">{greeting()},</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {firstName || "friend"}
          </h1>
        </div>
        {activeMembership && (
          <Link
            to={`/memberships/${activeMembership.id}`}
            aria-label="Your membership"
          >
            <LogoCircle name={activeMembership.gym.name} size="md" />
          </Link>
        )}
      </header>

      {/* Hero streak banner */}
      <div className="px-6">
        <Card className="relative overflow-hidden border-none p-5">
          <div
            className={
              "absolute inset-0 bg-gradient-to-br " +
              (hero.accent === "emerald"
                ? "from-emerald-500/40 via-teal-600/25 to-transparent"
                : "from-orange-500/40 via-red-600/25 to-transparent")
            }
          />
          <div
            className={
              "absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl " +
              (hero.accent === "emerald"
                ? "bg-emerald-500/40"
                : "bg-orange-500/40")
            }
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {level === "BEGINNER" ? "Movement streak" : "Current streak"}
            </p>
            <p className="mt-1 text-4xl font-bold leading-none text-white">
              {hero.headline}
            </p>
            <p className="mt-2 text-sm text-white/80">{hero.sub}</p>
            <Link to={hero.ctaLink}>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition active:scale-95">
                {hero.cta} <span aria-hidden>→</span>
              </button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Plan card */}
      {hasPlan ? (
        <div className="mt-6 px-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="label">
              {plan.plan.name} · Week {plan.currentWeek} of {plan.plan.weeks}
            </p>
            <Link
              to="/plans"
              className="text-xs font-medium text-white/40 transition hover:text-white/70"
            >
              Change
            </Link>
          </div>

          {isRestDay ? (
            <RestDayCard plan={plan} lastWorkout={lastWorkout} />
          ) : (
            <WorkoutDayCard plan={plan} />
          )}

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-white/40">
              {plan.completedDays} workout
              {plan.completedDays === 1 ? "" : "s"} completed ·{" "}
              {plan.totalDays} days total
            </p>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Quit "${plan.plan.name}"?\n\nYour workout history stays. You can pick a new plan anytime.`
                  )
                ) {
                  confirmQuit();
                }
              }}
              disabled={quitting}
              className="text-xs font-medium text-white/40 transition hover:text-red-400 disabled:opacity-40"
            >
              {quitting ? "Quitting…" : "Quit plan"}
            </button>
          </div>
        </div>
      ) : plan === null ? (
        <div className="mt-6 px-6">
          <p className="label mb-3">Your plan</p>
          <Link to="/plans" className="block">
            <Card className="flex items-center gap-4 p-5 transition active:scale-[0.99]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
                <Sparkles size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  Choose a training plan
                </p>
                <p className="mt-0.5 text-xs text-white/50">
                  Pick a preset, or build one for you. 5 to choose from.
                </p>
              </div>
              <ChevronRight size={18} className="text-white/30" />
            </Card>
          </Link>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mt-6 px-6">
        <p className="label mb-3">Quick actions</p>
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction
            to="/qr"
            icon={<QrCode size={20} />}
            label="QR"
            tone="brand"
          />
          <QuickAction
            to="/workout/log"
            icon={<Plus size={20} />}
            label={level === "BEGINNER" ? "Move" : "Log"}
            tone="emerald"
          />
          <QuickAction
            to="/progress"
            icon={<TrendingUp size={20} />}
            label="Progress"
            tone="purple"
          />
          <QuickAction
            to="/find-gyms"
            icon={<MapPin size={20} />}
            label="Gyms"
            tone="amber"
          />
        </div>
      </div>

      {/* Week at a glance */}
      {workouts.length > 0 && (
        <div className="mt-6 px-6">
          <p className="label mb-3">This week</p>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              {week.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase text-white/40">
                    {d.label}
                  </span>
                  <span
                    className={
                      "grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold " +
                      (d.active
                        ? "bg-brand-500 text-white"
                        : "bg-white/5 text-white/30")
                    }
                  >
                    {d.active ? "✓" : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/40">
              {thisWeek} {level === "BEGINNER" ? "session" : "workout"}
              {thisWeek === 1 ? "" : "s"} this week
            </p>
          </Card>
        </div>
      )}

      {/* Active membership */}
      {activeMembership && (
        <div className="mt-6 px-6">
          <p className="label mb-3">Your gym</p>
          <Link to={`/memberships/${activeMembership.id}`} className="block">
            <Card className="relative overflow-hidden border-none p-5">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <LogoCircle name={activeMembership.gym.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {activeMembership.gym.name}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {activeMembership.planName}
                  </p>
                  <p className="mt-1 text-xs text-brand-300">
                    {daysUntil(activeMembership.activeUntil)} days left ·{" "}
                    {formatDate(activeMembership.activeUntil)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* All gyms */}
      {memberships.length > 1 && (
        <div className="mt-6 px-6">
          <p className="label mb-3">All your gyms</p>
          <div className="space-y-3">
            {memberships.map((m) => {
              const days = daysUntil(m.activeUntil);
              const tone = !m.activeUntil
                ? "slate"
                : days <= 7
                  ? "amber"
                  : "green";
              const label = !m.activeUntil
                ? "No plan"
                : days <= 0
                  ? "Expired"
                  : days <= 7
                    ? `${days}d left`
                    : "Active";
              return (
                <Link key={m.id} to={`/memberships/${m.id}`} className="block">
                  <Card className="flex items-center gap-4 p-4">
                    <LogoCircle name={m.gym.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.gym.name}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {m.planName ?? "No plan"}
                      </p>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No gym at all */}
      {memberships.length === 0 && (
        <div className="mt-6 px-6">
          <p className="label mb-3">Your gym</p>
          <Card className="p-5 text-center">
            <Sparkles size={28} className="mx-auto text-brand-400" />
            <p className="mt-3 text-sm font-medium text-white">
              Your gym isn't on RestFit yet
            </p>
            <p className="mt-1 text-xs text-white/50">
              Invite your gym to join and unlock membership, check-in, and
              renewal features.
            </p>
            <Button onClick={() => setInviting(true)} className="mt-4">
              Invite my gym
            </Button>
          </Card>
        </div>
      )}

      <InviteGymModal open={inviting} onClose={() => setInviting(false)} />
    </div>
  );
}

// ── Plan cards ───────────────────────────────────────

function WorkoutDayCard({ plan }: { plan: CurrentPlan }) {
  const today = plan.today;
  return (
    <Link to={`/workout/log?planDay=${today.id}`} className="block">
      <Card className="relative overflow-hidden border-none p-5 transition active:scale-[0.99]">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Today's workout
          </p>
          <p className="mt-1 text-lg font-bold text-white">{today.label}</p>
          {today.notes && (
            <p className="mt-1 text-xs text-white/60">{today.notes}</p>
          )}
          {today.exercises.length > 0 && (
            <p className="mt-2 text-xs text-white/60">
              {today.exercises
                .slice(0, 4)
                .map((e) => e.name)
                .join(" · ")}
              {today.exercises.length > 4 && " …"}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white">
            Start today's workout <ArrowRight size={16} />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function RestDayCard({
  plan,
  lastWorkout,
}: {
  plan: CurrentPlan;
  lastWorkout: Workout | null;
}) {
  const next = plan.nextNonRest;

  const lastLine =
    lastWorkout && lastWorkout.exercises.length > 0
      ? `${lastWorkout.exercises[0].name}${
          lastWorkout.exercises.length > 1
            ? ` + ${lastWorkout.exercises.length - 1} more`
            : ""
        } — done ${relativeDay(lastWorkout.date)}`
      : null;

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
        Rest day
      </p>
      <p className="mt-1 text-lg font-bold text-white">
        {lastLine ? "You've earned today off." : "Nothing scheduled today."}
      </p>

      {lastLine ? (
        <p className="mt-1 text-sm text-white/60">{lastLine}</p>
      ) : (
        <p className="mt-1 text-sm text-white/50">
          Your body gets stronger on rest days.
        </p>
      )}

      {next && (
        <div className="mt-5 rounded-xl bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Next workout
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {next.kind === "MOVEMENT"
              ? next.label
              : `${next.label} · ${next.exercises.length} exercise${
                  next.exercises.length === 1 ? "" : "s"
                }`}
          </p>
        </div>
      )}
    </Card>
  );
}

function QuickAction({
  to,
  icon,
  label,
  tone,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  tone: "brand" | "emerald" | "purple" | "amber";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-500/15 text-brand-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    purple: "bg-purple-500/15 text-purple-400",
    amber: "bg-amber-500/15 text-amber-400",
  };
  return (
    <Link to={to}>
      <button
        aria-label={label}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition active:scale-[0.97] hover:bg-white/[0.08]"
      >
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
        <span className="text-[11px] font-medium text-white/70">{label}</span>
      </button>
    </Link>
  );
}