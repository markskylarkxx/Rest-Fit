import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";

type State = "idle" | "submitting" | "success" | "error";

export function SignupForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api"}/public/gyms/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gymName, ownerName, phone, email }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }

      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <section
      id="signup"
      className="border-t border-white/[0.06] px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Get started</p>
          <h2 className="h2 mt-4">Ready to stop losing members?</h2>
          <p className="body-lg mx-auto mt-4 max-w-xl">
            Sign up today. We'll reach out within 24 hours to set up your
            account and get your gym running.
          </p>
        </div>

        {state === "success" ? (
          <div className="mt-12 rounded-card border border-lime/30 bg-lime/[0.06] p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-lime text-canvas">
              <Check size={24} strokeWidth={3} />
            </div>
            <h3 className="mt-5 text-xl font-bold">You're on the list.</h3>
            <p className="mt-3 text-sm text-white/60">
              We'll WhatsApp you within 24 hours to get your gym set up.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-12 rounded-card border border-white/[0.08] bg-surface/40 p-8 sm:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Gym name</label>
                <input
                  className="input"
                  placeholder="Iron Gym"
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
              {state === "submitting" ? "Submitting…" : "Sign up your gym"}
              {state !== "submitting" && <ArrowRight size={16} />}
            </button>

            <p className="mt-4 text-center text-xs text-white/40">
              We'll reach out on WhatsApp within 24 hours. No spam.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}