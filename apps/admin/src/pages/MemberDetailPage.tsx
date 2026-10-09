import { ArrowLeft, Copy, Pencil, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { PAYMENT_METHODS, type PaymentMethod } from "@restfit/shared";
import { MembershipBadge } from "../components/MembershipBadge";
import { PaymentStatusBadge } from "./PaymentsPage";
import { Badge, Empty, ErrorNote, Field, Loading } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { formatDate, formatDateTime, formatNaira, formatPhone, fullName } from "../lib/format";
import type { MemberDetail, Payment, Plan, Subscription } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { MemberFormModal } from "./MembersPage";

const methodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  TRANSFER: "Bank transfer",
  POS: "POS",
  ONLINE: "Online (send payment link)",
};

const subTone = { ACTIVE: "green", PENDING: "blue", EXPIRED: "slate", CANCELLED: "red" } as const;

export function MemberDetailPage() {
  const { id } = useParams();
  const { data: member, error, loading, reload } = useFetch<MemberDetail>(`/members/${id}`);
  const [editing, setEditing] = useState(false);

  if (loading && !member) return <Loading />;
  if (error || !member) return <ErrorNote message={error ?? "Member not found"} />;

  return (
    <>
      <Link to="/members" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Members
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{fullName(member)}</h1>
            <MembershipBadge activeUntil={member.activeUntil} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatPhone(member.phone)}
            {member.email && ` · ${member.email}`} · joined {formatDate(member.createdAt)}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          <Pencil size={16} /> Edit
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NewMembership member={member} onDone={reload} />
          <SubscriptionHistory subscriptions={member.subscriptions} />
          <PaymentHistory payments={member.payments} onChange={reload} />
        </div>

        <div className="space-y-6">
          <MemberCard member={member} />
          {(member.emergencyContact || member.notes) && (
            <section className="card space-y-3 p-4 text-sm">
              {member.emergencyContact && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Emergency contact</p>
                  <p>{member.emergencyContact}</p>
                </div>
              )}
              {member.notes && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Notes</p>
                  <p className="whitespace-pre-line">{member.notes}</p>
                </div>
              )}
            </section>
          )}
          <section className="card">
            <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Recent visits</h2>
            {member.checkIns.length === 0 ? (
              <Empty>No visits yet.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {member.checkIns.map((c) => (
                  <li key={c.id} className="flex justify-between px-4 py-2">
                    <span>{formatDateTime(c.createdAt)}</span>
                    {!c.allowed && <Badge tone="red">Refused</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <MemberFormModal open={editing} onClose={() => setEditing(false)} member={member} onSaved={reload} />
    </>
  );
}

function MemberCard({ member }: { member: MemberDetail }) {
  return (
    <section className="card p-4 text-center">
      <h2 className="mb-3 text-left font-semibold">Check-in QR code</h2>
      <div id="member-card" className="inline-block rounded-lg border border-slate-200 p-4">
        <QRCodeSVG value={member.checkInCode} size={168} />
        <p className="mt-2 font-mono text-lg tracking-widest">{member.checkInCode}</p>
        <p className="text-sm text-slate-500">{fullName(member)}</p>
      </div>
      <button className="btn-secondary mt-3 w-full" onClick={() => window.print()}>
        <Printer size={16} /> Print card
      </button>
    </section>
  );
}

function NewMembership({ member, onDone }: { member: MemberDetail; onDone: () => void }) {
  const { data: plans } = useFetch<Plan[]>("/plans");
  const [planId, setPlanId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const activePlans = plans?.filter((p) => p.active) ?? [];
  const plan = activePlans.find((p) => p.id === planId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLink(null);
    try {
      const { data } = await api.post<{ payment: Payment }>(`/members/${member.id}/subscriptions`, { planId, method });
      if (method === "ONLINE") {
        setLink(data.payment.paymentLink);
        toast.success("Payment link created. Send it to the member.");
      } else {
        toast.success("Payment recorded and membership started");
      }
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (plans && activePlans.length === 0) {
    return (
      <section className="card p-4 text-sm">
        You have no membership plans yet.{" "}
        <Link to="/plans" className="font-medium text-brand-700">
          Create a plan
        </Link>{" "}
        first.
      </section>
    );
  }

  return (
    <section className="card p-4">
      <h2 className="mb-1 font-semibold">{member.activeUntil ? "Renew membership" : "Start membership"}</h2>
      {member.activeUntil && (
        <p className="mb-3 text-sm text-slate-500">The new plan starts when the current one ends ({formatDate(member.activeUntil)}).</p>
      )}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Plan">
          <select className="input" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
            <option value="">Choose a plan</option>
            {activePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatNaira(p.priceKobo)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment">
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {methodLabels[m]}
              </option>
            ))}
          </select>
        </Field>
        <button className="btn-primary" disabled={busy || !planId}>
          {method === "ONLINE" ? "Create link" : plan ? `Record ${formatNaira(plan.priceKobo)}` : "Record payment"}
        </button>
      </form>
      {link && <PaymentLinkBox link={link} />}
    </section>
  );
}

function PaymentLinkBox({ link }: { link: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm">
      <span className="flex-1 truncate text-blue-800">{link}</span>
      <button
        type="button"
        className="btn-secondary py-1"
        onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}
      >
        <Copy size={14} /> Copy
      </button>
    </div>
  );
}

function SubscriptionHistory({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <section className="card">
      <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Membership history</h2>
      {subscriptions.length === 0 ? (
        <Empty>No memberships yet.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {subscriptions.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{s.plan.name}</p>
                <p className="text-xs text-slate-500">
                  {s.startDate ? `${formatDate(s.startDate)} → ${formatDate(s.endDate)}` : `Created ${formatDate(s.createdAt)}, awaiting payment`}
                </p>
              </div>
              <Badge tone={subTone[s.status]}>{s.status.toLowerCase()}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentHistory({ payments, onChange }: { payments: Payment[]; onChange: () => void }) {
  const refresh = async (id: string) => {
    try {
      const { data } = await api.post<Payment>(`/payments/${id}/refresh`);
      toast(data.status === "PENDING" ? "Still waiting for the member to pay" : `Payment ${data.status.toLowerCase()}`);
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section className="card">
      <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Payments</h2>
      {payments.length === 0 ? (
        <Empty>No payments yet.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{formatNaira(p.amountKobo)}</p>
                <p className="text-xs text-slate-500">
                  {p.method.toLowerCase()} · {formatDateTime(p.paidAt ?? p.createdAt)}
                  {p.failureReason && ` · ${p.failureReason}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.status === "PENDING" && p.paymentLink && (
                  <>
                    <button className="text-xs font-medium text-brand-700" onClick={() => navigator.clipboard.writeText(p.paymentLink!).then(() => toast.success("Link copied"))}>
                      Copy link
                    </button>
                    <button className="text-xs font-medium text-brand-700" onClick={() => refresh(p.id)}>
                      Check status
                    </button>
                  </>
                )}
                <PaymentStatusBadge status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
