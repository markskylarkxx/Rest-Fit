import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { api, errorMessage } from "../lib/api";
import { formatNaira } from "../lib/format";
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
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Paystack config — set once we know which plan the user is paying for
  const [paystackConfig, setPaystackConfig] = useState<{
    reference: string;
    email: string;
    amount: number;
    publicKey: string;
  } | null>(null);

  // This must be called unconditionally at the top level (hooks rule)
  const initializePayment = usePaystackPayment(
    paystackConfig
      ? {
          reference: paystackConfig.reference,
          email: paystackConfig.email,
          amount: paystackConfig.amount,
          publicKey: paystackConfig.publicKey,
        }
      : {
          reference: "",
          email: "",
          amount: 0,
          publicKey: "",
        }
  );

  useEffect(() => {
    api
      .get<{
        gym: { name: string; joinCode?: string };
        email?: string | null;
        plans?: Plan[];
      }>(`/app/memberships/${id}`)
      .then(async (res) => {
        setGymName(res.data.gym.name);
        setMemberEmail(res.data.email ?? "");
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
    if (!memberEmail) {
      setError("Add an email address before paying online.");
      return;
    }
    setBusy(plan.id);
    setError(null);
    try {
      const { data } = await api.post<{
        paymentId: string;
        authorization_url: string;
        reference: string;
      }>(`/app/memberships/${id}/renew`, { planId: plan.id });

      // Set config, then trigger Paystack modal
      setPaystackConfig({
        reference: data.reference,
        email: memberEmail,
        amount: plan.priceKobo,
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  // When config is set, open Paystack
  useEffect(() => {
    if (!paystackConfig) return;

    initializePayment({
      onSuccess: async (ref: { reference: string }) => {
        try {
          await api.get(`/member/payments/verify/${ref.reference}`);
        } catch {
          // webhook will handle it if verify fails
        }
        setPaystackConfig(null);
        setBusy(null);
        navigate(`/memberships/${id}`, { replace: true });
      },
      onClose: () => {
        setPaystackConfig(null);
        setBusy(null);
        setError("Payment cancelled.");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paystackConfig]);

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