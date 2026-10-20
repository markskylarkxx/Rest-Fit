import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

type Step = "form" | "verify" | "success";
type State = "idle" | "submitting" | "error";

export function SignupForm() {
  const [step, setStep] = useState<Step>("form");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

  const startSignup = async (e: FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setError(null);
    try {
      const res = await fetch(`${apiBase}/public/gyms/applications/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymName, ownerName, email, phone, city, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode);
      setStep("verify");
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setError(null);
    try {
      const res = await fetch(`${apiBase}/public/gyms/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymName,
          ownerName,
          email,
          phone,
          city,
          website,
          code,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Invalid code");
      }
      setStep("success");
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  return (
    <section
      id="signup"
      className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Get started free</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Apply for your 30-day free trial.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg">
            Tell us about your gym. We'll WhatsApp you within 24 hours to
            verify it, then send you a link to set up your dashboard. Your
            free trial starts the day you're approved.
          </p>
        </div>

        {step === "success" && (
          <div className="mt-12 rounded-2xl border border-lime/30 bg-lime/[0.06] p-6 text-center sm:rounded-card sm:p-10">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-lime text-canvas">
              <Check size={24} strokeWidth={3} />
            </div>
            <h3 className="mt-5 text-xl font-bold">Application received.</h3>
            <p className="mt-3 text-sm text-white/60">
              We'll WhatsApp you on {phone} within 24 hours to verify your gym.
              Once you're approved, you'll get a link to set your password and
              open your dashboard.
            </p>
          </div>
        )}

        {step === "form" && (
          <form
            onSubmit={startSignup}
            className="mt-12 rounded-2xl border border-white/[0.08] bg-surface/40 p-6 sm:rounded-card sm:p-10"
          >
            <div className="mb-6 flex flex-col items-center gap-2 rounded-button bg-lime/[0.06] px-4 py-3 text-center sm:flex-row sm:text-left">
              <Sparkles size={16} className="shrink-0 text-lime" />
              <p className="text-xs text-lime">
                30 days free · No card required · Cancel anytime
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Gym name</label>
                <input
                  className="input"
                  placeholder="Iron Gym Lekki"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Your name</label>
                <input
                  className="input"
                  placeholder="Chidi Okeke"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">WhatsApp number</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="0803 111 2222"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">City</label>
                <input
                  className="input"
                  placeholder="Lagos"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-button bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "submitting"}
              className="btn-primary mt-8 w-full justify-center disabled:opacity-50"
            >
              {state === "submitting" ? "Sending code…" : "Continue"}
              {state !== "submitting" && <ArrowRight size={16} />}
            </button>

            <p className="mt-6 text-center text-xs text-white/40">
              Have a bigger gym or a special setup?{" "}
              <a
                href="mailto:hello@restfit.com"
                className="text-lime underline-offset-2 hover:underline"
              >
                Talk to us
              </a>
            </p>
          </form>
        )}

        {step === "verify" && (
          <form
            onSubmit={verify}
            className="mt-12 rounded-2xl border border-white/[0.08] bg-surface/40 p-6 sm:rounded-card sm:p-10"
          >
            <h3 className="text-lg font-bold">Check your WhatsApp</h3>
            <p className="mt-2 text-sm text-white/60">
              We sent a 6-digit code to {phone}
            </p>

            {devCode && (
              <div className="mt-4 rounded-button bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                Dev mode: your code is{" "}
                <span className="font-mono font-bold">{devCode}</span>
              </div>
            )}

            <div className="mt-6">
              <label className="label">Verification code</label>
              <input
                className="input text-center font-mono text-2xl tracking-[0.4em]"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            {error && (
              <p className="mt-6 rounded-button bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "submitting" || code.length !== 6}
              className="btn-primary mt-6 w-full justify-center disabled:opacity-50"
            >
              {state === "submitting"
                ? "Verifying…"
                : "Verify and submit application"}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-4 w-full text-center text-xs text-white/40 hover:text-white/60"
            >
              ← Change details
            </button>
          </form>
        )}
      </div>
    </section>
  );
}