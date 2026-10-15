import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Dumbbell,
  Flame,
  LogOut,
  Phone,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  fetchExperience,
  setExperience,
  type ExperienceLevel,
} from "../lib/experience";
import { getCurrentPlan, type CurrentPlan } from "../lib/trainingPlans";
import { Button, Card, Input, LogoCircle } from "../components/ui";

const LEVELS: {
  value: ExperienceLevel;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "BEGINNER", label: "Just starting", icon: <Activity size={16} /> },
  { value: "INTERMEDIATE", label: "Sometimes", icon: <Dumbbell size={16} /> },
  { value: "EXPERIENCED", label: "Regular", icon: <Flame size={16} /> },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [saving, setSaving] = useState<ExperienceLevel | null>(null);
  const [plan, setPlan] = useState<CurrentPlan | null | undefined>(undefined);

  useEffect(() => {
    fetchExperience().then((l) => setLevel(l));
    getCurrentPlan()
      .then(setPlan)
      .catch(() => setPlan(null));
  }, []);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameError(null);
    try {
      const { data } = await api.put<{ firstName: string }>("/app/me/name", { firstName: nameDraft });
      updateUser({ firstName: data.firstName });
      setEditingName(false);
    } catch (err) {
      setNameError(errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const change = async (l: ExperienceLevel) => {
    if (l === level) return;
    setSaving(l);
    try {
      await setExperience(l);
      setLevel(l);
    } catch {
      /* ignore */
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="px-6 pt-8 pb-6">
        <h1 className="heading">Profile</h1>
        <p className="subheading mt-1">Your account</p>
      </header>

      <div className="space-y-4 px-6">
        <Card className="flex items-center gap-4">
          <LogoCircle name={user?.firstName || user?.phone || "U"} size="lg" />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <form onSubmit={saveName} className="flex items-center gap-2">
                <Input
                  autoFocus
                  autoComplete="given-name"
                  autoCapitalize="words"
                  maxLength={40}
                  placeholder="First name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
                <Button type="submit" disabled={savingName || !nameDraft.trim()}>
                  {savingName ? "…" : "Save"}
                </Button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setNameDraft(user?.firstName ?? "");
                  setEditingName(true);
                }}
                className="text-left"
              >
                <p className="font-semibold text-white">{user?.firstName || "Add your name"}</p>
                <p className="mt-0.5 text-xs text-white/40">{user?.phone} · Tap to edit name</p>
              </button>
            )}
            {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
          </div>
        </Card>

        {/* Training plan */}
        <div>
          <p className="label mb-3">Training plan</p>
          <button
            onClick={() => navigate("/plans")}
            className="block w-full text-left transition active:scale-[0.99]"
          >
            <Card className="flex items-center gap-4 p-4 hover:bg-white/[0.06]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0 flex-1">
                {plan === undefined ? (
                  <p className="text-sm text-white/40">Loading…</p>
                ) : plan === null ? (
                  <>
                    <p className="text-sm font-semibold text-white">
                      Choose a training plan
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      Pick a preset, or build one for you
                    </p>
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-semibold text-white">
                      {plan.plan.name}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      Week {plan.currentWeek} of {plan.plan.weeks} ·{" "}
                      {plan.completedDays} workout
                      {plan.completedDays === 1 ? "" : "s"} done
                    </p>
                  </>
                )}
              </div>
              <ArrowRight size={16} className="text-white/30" />
            </Card>
          </button>
        </div>

        {/* Training experience */}
        <div>
          <p className="label mb-3">Training experience</p>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => change(l.value)}
                  disabled={saving !== null}
                  className={
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition disabled:opacity-60 " +
                    (level === l.value
                      ? "border-brand-400/60 bg-brand-500/15"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                  }
                >
                  <span
                    className={
                      level === l.value ? "text-brand-300" : "text-white/50"
                    }
                  >
                    {l.icon}
                  </span>
                  <span
                    className={
                      "text-[11px] font-medium " +
                      (level === l.value ? "text-brand-200" : "text-white/60")
                    }
                  >
                    {l.label}
                  </span>
                  {saving === l.value && (
                    <span className="text-[10px] text-white/40">…</span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/40">
              This changes how the app talks to you and what it suggests.
            </p>
          </Card>
        </div>

        <Card className="p-0">
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <Phone size={18} className="text-white/40" />
            <span className="flex-1 text-sm text-white/70">Phone</span>
            <span className="text-sm text-white/40">{user?.phone}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <UserIcon size={18} className="text-white/40" />
            <span className="flex-1 text-sm text-white/70">Account</span>
            <span className="text-xs text-white/40">
              {user?.id?.slice(0, 12) ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Shield size={18} className="text-white/40" />
            <span className="flex-1 text-sm text-white/70">Session</span>
            <span className="text-xs text-emerald-400">Active</span>
          </div>
        </Card>

        <Button
          variant="secondary"
          onClick={logout}
          className="w-full text-red-400"
        >
          <LogOut size={16} /> Sign out
        </Button>
      </div>
    </div>
  );
}


// 