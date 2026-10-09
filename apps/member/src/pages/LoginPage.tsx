import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { normalisePhone } from "../lib/format";
import { Button, Card, Field, Input } from "../components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const normalised = normalisePhone(phone);
      const { data } = await api.post("/app/auth/request-code", {
        phone: normalised,
      });
      navigate("/verify", {
        state: { phone: normalised, devCode: data.devCode },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-600/40">
          <Dumbbell size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to RestFit
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-white/50">
          Rest. Train. Repeat. Sign in with your phone number.
        </p>

        <Card className="mt-10 w-full max-w-sm">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Phone number" error={error ?? undefined}>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0803 111 2222"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              disabled={busy || !phone.trim()}
              className="w-full"
            >
              {busy ? "Sending…" : "Send code"}
            </Button>
          </form>
        </Card>
      </div>

      <p className="text-center text-xs text-white/30">
        Powered by RestFit
      </p>
    </div>
  );
}