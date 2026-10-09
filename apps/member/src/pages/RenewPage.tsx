import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatNaira, daysUntil } from "../lib/format";
import {
  openPaymentLink,
  closePaymentBrowser,
  onReturnFromBrowser,
} from "../lib/pay";
import { Button, Card, ErrorNote, Spinner } from "../components/ui";

interface Plan {
  id: string;
  name: string;
  priceKobo: number;
  durationDays: number;
}

export function RenewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [gymName, setGymName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{
        gym: { name: string; joinCode?: string };
        plans?: Plan[];
      }>(`/app/memberships/${id}`)
      .then(async (res) => {
        setGymName(res.data.gym.name);
        // If backend returns plans inline, use them. Otherwise look up by join code.
        if (res.data.plans && res.data.plans.length > 0) {
          setPlans(res.data.plans);
          return;
        }
        const code = res.data.gym.joinCode;
        if (code) {
          const g = await api.get<{ plans: Plan[] }>(`/app/gyms/${code}`);
          setPlans(g.data.plans);
        } else {
          setPlans([]);
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  const renew = async (plan: Plan) => {
    setBusy(plan.id);
    setError(null);
    try {
      const { data } = await api.post<{ paymentLink?: string }>(
        `/app/memberships/${id}/renew`,
        { planId: plan.id }
      );

      if (!data.paymentLink) {
        navigate(`/memberships/${id}`, { replace: true });
        return;
      }

      await openPaymentLink(data.paymentLink);

      // When the user comes back to the app, close the browser and refresh.
      onReturnFromBrowser(async () => {
        await closePaymentBrowser();
        try {
          const me = await api.get<{ activeUntil: string | null }>(
            `/app/memberships/${id}`
          );
          // Give the webhook a moment if still pending
          if (!me.data.activeUntil || daysUntil(me.data.activeUntil) <= 0) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        } catch {
          /* ignore */
        }
        navigate(`/memberships/${id}`, { replace: true });
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-6 pb-20">
      <Link
        to={`/memberships/${id}`}
        className="mb-8 inline-flex items-center gap-1 text-sm text-white/40"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-white">Renew</h1>
      <p className="mt-2 text-sm text-white/50">{gymName}</p>

      {error && (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {!plans ? (
          <Spinner />
        ) : plans.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-white/50">
              No plans available. Ask the front desk.
            </p>
          </Card>
        ) : (
          plans.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-white">{p.name}</p>
                <p className="mt-0.5 text-sm text-white/50">
                  {formatNaira(p.priceKobo)} · {p.durationDays} day
                  {p.durationDays === 1 ? "" : "s"}
                </p>
              </div>
              <Button onClick={() => renew(p)} disabled={!!busy}>
                {busy === p.id ? "…" : "Pay"}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}