import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { Button, Card, Field, Input } from "../components/ui";

interface VerifyResponse {
  pinSetupToken: string;
  isReset: boolean;
}

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { phone: string; devCode?: string; reset?: boolean } | null;

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state?.phone) {
    navigate("/", { replace: true });
    return null;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post<VerifyResponse>("/app/auth/verify", {
        phone: state.phone,
        code,
      });

      // Phone verified: next, choose a PIN (new members and resets alike).
      navigate("/set-pin", {
        replace: true,
        state: { pinSetupToken: data.pinSetupToken, isReset: data.isReset },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <button
        onClick={() => navigate("/", { replace: true })}
        className="mb-8 self-start text-sm text-white/40"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold tracking-tight text-white">
        Check your phone
      </h1>
      <p className="mt-2 text-sm text-white/50">
        {state.reset
          ? `To reset your PIN, enter the 6-digit code we sent to ${state.phone}`
          : `We sent a 6-digit code to ${state.phone} to confirm it's your number. You'll only need this once.`}
      </p>

      {state.devCode && (
        <Card className="mt-6 border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs font-medium text-amber-300">
            Dev mode: your code is{" "}
            <span className="font-mono font-bold">{state.devCode}</span>
          </p>
        </Card>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Verification code" error={error ?? undefined}>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoFocus
            className="text-center text-3xl font-mono tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full"
        >
          {busy ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </div>
  );
}