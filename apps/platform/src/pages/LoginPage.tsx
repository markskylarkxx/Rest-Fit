import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { errorMessage } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, verifyMfa } = useAuth();
  const [step, setStep] = useState<"password" | "code">("password");
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if ((await login({ email, password })) === "mfa") {
        setStep("code");
        setPassword("");
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error && !("isAxiosError" in err) ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyMfa(code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
      // The 5-minute sign-in window ran out: start again from the password.
      if ((err as { response?: { status?: number } }).response?.status === 401) setStep("password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white">
            <span className="text-sm font-bold">RF</span>
          </div>
          <div>
            <p className="text-lg font-semibold">RestFit</p>
            <p className="text-xs text-slate-500">Platform admin</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">
          {step === "password" ? "Sign in" : "Two-step login"}
        </h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          {step === "password"
            ? "Internal tool. Authorised access only."
            : useRecovery
              ? "Enter one of the recovery codes you saved. Each code works once."
              : "Enter the 6-digit code from your authenticator app."}
        </p>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {step === "code" ? (
            <form onSubmit={submitCode} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {useRecovery ? "Recovery code" : "Code"}
                </label>
                {useRecovery ? (
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase tracking-widest focus:border-slate-900 focus:outline-none"
                    placeholder="XXXXX-XXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:border-slate-900 focus:outline-none"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    required
                  />
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || (!useRecovery && code.length !== 6)}
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? "Checking…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRecovery(!useRecovery);
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
              >
                {useRecovery ? "Use the authenticator app instead" : "Lost your phone? Use a recovery code"}
              </button>
            </form>
          ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}