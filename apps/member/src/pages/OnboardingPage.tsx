import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Flame, Sparkles, HelpCircle } from "lucide-react";
import { setExperience, type ExperienceLevel } from "../lib/experience";
import { useAuth } from "../lib/auth";
import { Button, Card } from "../components/ui";

const OPTIONS: {
  value: ExperienceLevel;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}[] = [
  {
    value: "BEGINNER",
    icon: <Sparkles size={26} />,
    title: "Just getting started",
    subtitle:
      "New to fitness, or it's been a long time. I want to move more, gently.",
  },
  {
    value: "INTERMEDIATE",
    icon: <Dumbbell size={26} />,
    title: "I train sometimes",
    subtitle: "I know the basics. I want to build a consistent habit.",
  },
  {
    value: "EXPERIENCED",
    icon: <Flame size={26} />,
    title: "I train regularly",
    subtitle: "I know what I'm doing. I want to track and progress.",
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [busy, setBusy] = useState<ExperienceLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (level: ExperienceLevel) => {
    setBusy(level);
    setError(null);
    try {
      await setExperience(level);
      // Update the cached session so the app knows we're onboarded.
      updateUser({ experienceLevel: level });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your choice"
      );
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-white/50">
          One quick question. It changes how the app treats you — no pressure,
          no judgement.
        </p>

        <div className="mt-10 w-full max-w-sm space-y-3">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              disabled={busy !== null}
              className="w-full text-left transition active:scale-[0.99] disabled:opacity-60"
            >
              <Card className="flex items-start gap-4 p-4 hover:bg-white/[0.06]">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                  {o.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{o.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{o.subtitle}</p>
                </div>
                {busy === o.value && (
                  <span className="mt-1 text-xs text-white/40">…</span>
                )}
              </Card>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-center text-xs text-red-400">{error}</p>
        )}

        <p className="mt-8 max-w-xs text-center text-xs text-white/30">
          You can change this any time from your profile.
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={() => pick("INTERMEDIATE")}
        disabled={busy !== null}
        className="mt-8 w-full max-w-sm self-center"
      >
        <HelpCircle size={16} /> Not sure — use the standard app
      </Button>
    </div>
  );
}