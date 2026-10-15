import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { useAuth, type AuthUser } from "../lib/auth";
import { Button, Field, Input } from "../components/ui";

interface SessionResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

// Returning member signing in on this device: phone + PIN, no SMS.
export function PinPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const state = location.state as { phone: string; locked?: boolean } | null;

  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    state?.locked ? "Your PIN is locked after too many wrong tries. Reset it with a code below." : null
  );
  const [locked, setLocked] = useState(Boolean(state?.locked));

  if (!state?.phone) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post<SessionResponse>("/app/auth/pin", { phone: state.phone, pin });
      setSession(data);
      navigate(data.user.experienceLevel ? "/home" : "/onboarding", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setPin("");
      if ((err as { response?: { status?: number } }).response?.status === 423) setLocked(true);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post<{ devCode?: string }>("/app/auth/forgot-pin", { phone: state.phone });
      navigate("/verify", { state: { phone: state.phone, devCode: data.devCode, reset: true } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <button onClick={() => navigate("/", { replace: true })} className="mb-8 self-start text-sm text-white/40">
        ← Back
      </button>

      <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-white/50">Enter the 4-digit PIN for {state.phone}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="PIN" error={error ?? undefined}>
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={4}
            placeholder="••••"
            autoFocus
            disabled={locked}
            className="text-center text-3xl font-mono tracking-[0.75em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button type="submit" disabled={busy || locked || pin.length !== 4} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <button onClick={() => void forgot()} disabled={busy} className="mt-6 text-center text-sm text-brand-400 disabled:opacity-50">
        Forgot PIN? Reset it with a code
      </button>
    </div>
  );
}
