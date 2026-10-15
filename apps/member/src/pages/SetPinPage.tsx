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

// Same rules as the server (services/memberAuth.ts), checked here for quick feedback.
function pinProblem(pin: string): string | null {
  if (/^(\d)\1{3}$/.test(pin)) return "Don't use the same digit four times";
  const d = pin.split("").map(Number);
  const steps = d.slice(1).map((x, i) => x - d[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return "Don't use digits in order, like 1234";
  return null;
}

// After the phone is verified: new members choose a PIN, others reset theirs.
export function SetPinPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const state = location.state as { pinSetupToken: string; isReset: boolean } | null;

  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state?.pinSetupToken) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === "choose") {
      const problem = pinProblem(pin);
      if (problem) return setError(problem);
      setStep("confirm");
      return;
    }
    if (confirm !== pin) {
      setError("The PINs don't match. Choose your PIN again");
      setPin("");
      setConfirm("");
      setStep("choose");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<SessionResponse>("/app/auth/set-pin", { pinSetupToken: state.pinSetupToken, pin });
      setSession(data);
      navigate(data.user.experienceLevel ? "/home" : "/onboarding", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setPin("");
      setConfirm("");
      setStep("choose");
      // The 15-minute window ran out: start again from the phone number.
      if ((err as { response?: { status?: number } }).response?.status === 401) navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const value = step === "choose" ? pin : confirm;
  const setValue = step === "choose" ? setPin : setConfirm;

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        {step === "choose" ? (state.isReset ? "Choose a new PIN" : "Create your PIN") : "Confirm your PIN"}
      </h1>
      <p className="mt-2 text-sm text-white/50">
        {step === "choose"
          ? "4 digits. You'll use it to sign in on a new phone, instead of waiting for a code."
          : "Enter the same 4 digits again."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label={step === "choose" ? "New PIN" : "Confirm PIN"} error={error ?? undefined}>
          <Input
            key={step}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            placeholder="••••"
            autoFocus
            className="text-center text-3xl font-mono tracking-[0.75em]"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button type="submit" disabled={busy || value.length !== 4} className="w-full">
          {busy ? "Saving…" : step === "choose" ? "Continue" : state.isReset ? "Save new PIN" : "Create PIN"}
        </Button>
      </form>

      {state.isReset && (
        <p className="mt-6 text-center text-xs text-white/30">Saving a new PIN signs you out on your other devices.</p>
      )}
    </div>
  );
}
