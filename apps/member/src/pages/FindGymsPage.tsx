import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Search, Sparkles, Loader2 } from "lucide-react";
import { InviteGymModal } from "../components/InviteGymModal";
import { Button, Card } from "../components/ui";
import { api, errorMessage } from "../lib/api";

interface GymResult {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  joinCode: string;
}

export function FindGymsPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [inviting, setInviting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<GymResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get<GymResult>(`/gyms/${code.trim().toUpperCase()}`);
      setResult(res.data);
    } catch (err) {
      setError("We couldn't find a gym with that code. Check it and try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Home
        </button>
      </header>

      <div className="px-6">
        <h1 className="heading">Join a gym</h1>
        <p className="subheading mt-1">
          Enter your gym's code to unlock membership features
        </p>

        <div className="relative mt-6">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            size={18}
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="IRON7KQ"
            className="input pl-10 font-mono text-lg tracking-widest"
          />
        </div>

        <Button
          onClick={search}
          disabled={!code.trim() || searching}
          className="mt-3 w-full"
        >
          {searching ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Looking up…
            </>
          ) : (
            "Look up gym"
          )}
        </Button>

        <p className="mt-3 text-center text-xs text-white/40">
          Ask your gym's front desk for their join code
        </p>

        {/* Show the found gym */}
        {result && (
          <Card className="mt-6 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
              Gym found
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {result.name}
            </h2>
            {result.address && (
              <p className="mt-1 text-sm text-white/50">{result.address}</p>
            )}
            <Button
              onClick={() => navigate("/join", { state: { code: result.joinCode } })}
              className="mt-4 w-full"
            >
              Join {result.name}
            </Button>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8">
          <Card className="p-6 text-center">
            <Sparkles size={28} className="mx-auto text-brand-400" />
            <p className="mt-3 font-semibold text-white">
              Your gym isn't on RestFit?
            </p>
            <p className="mt-1 text-sm text-white/50">
              Invite them to join. Once they sign up, you'll be able to check
              in, renew, and manage your membership right here.
            </p>
            <Button onClick={() => setInviting(true)} className="mt-4">
              Invite my gym
            </Button>
          </Card>
        </div>

        <div className="mt-4">
          <Card className="p-6 text-center">
            <MapPin size={28} className="mx-auto text-white/30" />
            <p className="mt-3 text-sm font-medium text-white">
              Gym directory coming soon
            </p>
            <p className="mt-1 text-xs text-white/50">
              We're building a directory of gyms across Nigeria. For now, ask
              your gym for their join code.
            </p>
          </Card>
        </div>
      </div>

      <InviteGymModal open={inviting} onClose={() => setInviting(false)} />
    </div>
  );
}