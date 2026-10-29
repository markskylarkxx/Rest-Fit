import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatNaira } from "../lib/format";
import { Button, Card, ErrorNote, Field, Input, LogoCircle } from "../components/ui";

interface Plan {
  id: string;
  name: string;
  priceKobo: number;
  durationDays: number;
}

interface Gym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  joinCode: string;
  plans: Plan[];
}

export function JoinGymPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledCode = (location.state as { code?: string } | null)?.code ?? "";

  const [code, setCode] = useState(prefilledCode);
  const [gym, setGym] = useState<Gym | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledCode && !gym) {
      lookupGym(prefilledCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledCode]);

  const lookupGym = async (rawCode: string) => {
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.get<Gym>(
        `/app/gyms/${rawCode.trim().toUpperCase()}`
      );
      setGym(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    await lookupGym(code);
  };

  const join = async (_plan: Plan) => {
    if (!gym) return;
    setBusy(true);
    setError(null);
    try {
      const { data: joined } = await api.post<{ membershipId: string }>(
        `/app/gyms/${gym.joinCode}/join`,
        {}
      );

      const membershipId = joined.membershipId;
      if (!membershipId) throw new Error("Membership not returned by server");

      navigate(`/memberships/${membershipId}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (gym) {
    return (
      <div className="min-h-screen pb-20">
        <header className="px-6 pt-6 pb-4">
          <button
            onClick={() => setGym(null)}
            className="inline-flex items-center gap-1 text-sm text-white/40"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </header>

        <div className="space-y-6 px-6">
          <div className="flex items-center gap-4">
            <LogoCircle name={gym.name} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-white">{gym.name}</h1>
              {gym.address && (
                <p className="text-sm text-white/50">{gym.address}</p>
              )}
            </div>
          </div>

          {error && <ErrorNote message={error} />}

          <div>
            <p className="label mb-3">Choose a plan to join</p>
            <div className="space-y-3">
              {gym.plans.length === 0 && (
                <Card className="p-4">
                  <p className="text-sm text-white/50">
                    This gym hasn't set up any plans yet.
                  </p>
                </Card>
              )}
              {gym.plans.map((p) => (
                <Card
                  key={p.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="mt-0.5 text-sm text-white/50">
                      {formatNaira(p.priceKobo)} · {p.durationDays} day
                      {p.durationDays === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button onClick={() => join(p)} disabled={busy}>
                    {busy ? "…" : "Join"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-6 pb-20">
      <button
        onClick={() => navigate("/home")}
        className="mb-8 inline-flex items-center gap-1 text-sm text-white/40"
      >
        <ArrowLeft size={16} /> Home
      </button>

      <h1 className="text-3xl font-bold tracking-tight text-white">
        Join a gym
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Enter the join code from your gym. Ask the front desk if you don't
        have it.
      </p>

      <form onSubmit={lookup} className="mt-8 space-y-4">
        <Field label="Join code" error={error ?? undefined}>
          <Input
            autoFocus
            autoCapitalize="characters"
            className="text-center font-mono text-3xl tracking-[0.4em]"
            placeholder="IRON7KQ"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </Field>
        <Button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full"
        >
          {busy ? "Looking up…" : "Find gym"}
        </Button>
      </form>
    </div>
  );
}