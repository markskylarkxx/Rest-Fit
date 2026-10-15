import { useState } from "react";
import toast from "react-hot-toast";
import { Badge, Loading, PageHeader } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { RESTFIT_WHATSAPP, useBilling, type BillingStatus } from "../lib/billing";
import { formatDate, formatNaira } from "../lib/format";

const STATE_BADGE: Record<BillingStatus["state"], { tone: "green" | "amber" | "red" | "blue"; label: string }> = {
  TRIAL: { tone: "blue", label: "Free trial" },
  ACTIVE: { tone: "green", label: "Active" },
  GRACE: { tone: "amber", label: "Ended, grace period" },
  LOCKED: { tone: "red", label: "Paused" },
};

export function BillingPage() {
  const { staff } = useAuth();
  const { billing } = useBilling();
  const [busy, setBusy] = useState<string | null>(null);

  if (!billing) return <Loading />;

  const canPay = staff?.role === "OWNER" || staff?.role === "ADMIN";
  const badge = STATE_BADGE[billing.state];

  const checkout = async (plan: string) => {
    setBusy(plan);
    try {
      const { data } = await api.post<{ paymentId: string; paymentLink: string | null }>("/billing/checkout", { plan });
      window.location.assign(data.paymentLink ?? `/billing/return?payment=${data.paymentId}`);
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(null);
    }
  };

  const transferLink = `https://wa.me/${RESTFIT_WHATSAPP}?text=${encodeURIComponent(
    `Hi RestFit, I'd like to pay for ${staff?.gym.name ?? "my gym"}'s subscription by bank transfer. Please send the account details.`
  )}`;

  return (
    <>
      <PageHeader title="Billing" subtitle="Your RestFit subscription" />

      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <p className="text-sm text-slate-600">
            {billing.state === "TRIAL" && `Your free trial ends on ${formatDate(billing.accessEndsAt)}.`}
            {billing.state === "ACTIVE" && `Paid until ${formatDate(billing.accessEndsAt)}.`}
            {billing.state === "GRACE" && `Access ended on ${formatDate(billing.accessEndsAt)}. The dashboard pauses on ${formatDate(billing.graceEndsAt)}.`}
            {billing.state === "LOCKED" &&
              "Check-in and member renewals still work. The rest of your dashboard is paused until you choose a plan. Your data is safe."}
          </p>
        </div>
        {(billing.state === "TRIAL" || billing.state === "ACTIVE") && (
          <p className="mt-2 text-xs text-slate-500">Paying now adds the new period after your current one, so you don't lose any days.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {billing.plans.map((p) => {
          const monthly = p.amountKobo / p.months;
          return (
            <div key={p.key} className="card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.label}</h2>
                {p.months === 12 && <Badge tone="green">2 months free</Badge>}
              </div>
              <p className="mt-3 text-3xl font-semibold">{formatNaira(p.amountKobo)}</p>
              <p className="text-sm text-slate-500">
                {p.months === 1 ? "per month" : `per year · ${formatNaira(Math.round(monthly))} a month`}
              </p>
              <button
                className="btn-primary mt-5 w-full"
                disabled={!canPay || !billing.onlinePayments || busy !== null}
                onClick={() => void checkout(p.key)}
              >
                {busy === p.key ? "Opening payment…" : `Pay ${formatNaira(p.amountKobo)} by card`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {!canPay && "Only the gym owner or an admin can pay. "}
        {!billing.onlinePayments && "Card payments aren't available yet. "}
        Prefer bank transfer?{" "}
        <a href={transferLink} target="_blank" rel="noreferrer" className="font-medium text-brand-700">
          Message us on WhatsApp
        </a>{" "}
        and we'll add the time to your account once it arrives.
      </p>

      {billing.payments.length > 0 && (
        <div className="card mt-8 overflow-hidden">
          <h2 className="border-b border-slate-200 px-5 py-3 font-semibold">Payment history</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Plan</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Covers until</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billing.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2">{formatDate(p.paidAt ?? p.createdAt)}</td>
                  <td className="px-5 py-2 capitalize">{p.plan.toLowerCase()}</td>
                  <td className="px-5 py-2">{formatNaira(p.amountKobo)}</td>
                  <td className="px-5 py-2">{formatDate(p.periodEnd)}</td>
                  <td className="px-5 py-2">
                    <Badge tone={p.status === "SUCCESS" ? "green" : "red"}>{p.status === "SUCCESS" ? "Paid" : "Failed"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
