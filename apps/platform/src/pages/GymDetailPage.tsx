import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Phone, Mail } from "lucide-react";
import { api, errorMessage } from "../lib/api";

interface GymDetail {
  gym: {
    id: string;
    name: string;
    joinCode: string;
    phone: string | null;
    address: string | null;
    status: string;
    plan: string;
    trialStartedAt: string;
    trialEndsAt: string | null;
    paidUntil: string | null;
    accessEndsAt: string;
    createdAt: string;
    counts: {
      members: number;
      plans: number;
      payments: number;
      checkIns: number;
    };
  };
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null;
  activeMembers: number;
  totalRevenueKobo: number;
  recentCheckIns: {
    id: string;
    at: string;
    memberName: string;
  }[];
  recentPayments: {
    id: string;
    amountKobo: number;
    method: string;
    paidAt: string | null;
    memberName: string;
  }[];
  subscriptionPayments: {
    id: string;
    plan: string;
    amountKobo: number;
    method: string;
    note: string | null;
    periodEnd: string | null;
    paidAt: string | null;
    recordedBy: string | null;
  }[];
}

export function GymDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<GymDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<GymDetail>(`/platform/gyms/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(load, [load]);

  if (error)
    return (
      <div className="p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  if (!data) return <p className="p-6 text-slate-500">Loading…</p>;

  const { gym, owner } = data;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/gyms")}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} /> All gyms
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={gym.status} />
            <PlanBadge plan={gym.plan} />
            <span className="font-mono text-xs text-slate-500">
              {gym.joinCode}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{gym.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed up {new Date(gym.createdAt).toLocaleDateString()}
          </p>
        </div>
        {owner && (
          <div className="flex shrink-0 gap-2">
            <a
              href={`https://wa.me/${(gym.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hi ${owner.name.split(" ")[0]}! This is RestFit. How's everything going with ${gym.name}?`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={14} />
              WhatsApp owner
            </a>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total members" value={gym.counts.members.toString()} />
        <Stat
          label="Active members"
          value={data.activeMembers.toString()}
          tone="green"
        />
        <Stat
          label="Total check-ins"
          value={gym.counts.checkIns.toString()}
        />
        <Stat
          label="Lifetime revenue"
          value={formatNaira(data.totalRevenueKobo)}
        />
      </div>

      <SubscriptionCard gymId={gym.id} gym={gym} payments={data.subscriptionPayments} onChange={load} />

      {/* Owner */}
      {owner && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Owner</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <p className="font-medium">{owner.name}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" /> {owner.email}
              </span>
              {gym.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" /> {gym.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two columns: check-ins and payments */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent check-ins
          </h2>
          {data.recentCheckIns.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No check-ins yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.recentCheckIns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="truncate">{c.memberName}</span>
                  <span className="ml-2 shrink-0 text-xs text-slate-500">
                    {new Date(c.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent payments
          </h2>
          {data.recentPayments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.recentPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="truncate">{p.memberName}</span>
                  <div className="ml-2 shrink-0 text-right">
                    <p className="font-medium">{formatNaira(p.amountKobo)}</p>
                    <p className="text-xs capitalize text-slate-500">
                      {p.method.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PENDING"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const tone =
    plan === "TRIAL"
      ? "bg-blue-50 text-blue-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {plan}
    </span>
  );
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

// The gym's own RestFit subscription, plus recording bank transfers.
function SubscriptionCard({
  gymId,
  gym,
  payments,
  onChange,
}: {
  gymId: string;
  gym: GymDetail["gym"];
  payments: GymDetail["subscriptionPayments"];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [method, setMethod] = useState<"TRANSFER" | "CASH">("TRANSFER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ended = new Date(gym.accessEndsAt) < new Date();
  const paying = gym.paidUntil && !ended && gym.plan !== "TRIAL";

  const record = async () => {
    if (!confirm(`Record a ${plan.toLowerCase()} ${method.toLowerCase()} payment for ${gym.name}? This extends their access.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/platform/gyms/${gymId}/payments`, { plan, method, note });
      setOpen(false);
      setNote("");
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mt-4 rounded-lg border p-4 ${ended ? "border-red-200 bg-red-50" : paying ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {paying ? `Paying · ${gym.plan.toLowerCase()}` : gym.paidUntil ? "Subscription" : "Free trial"}
            {" · "}
            {ended ? "ended" : "runs until"} {new Date(gym.accessEndsAt).toLocaleDateString()}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">Trial started {new Date(gym.trialStartedAt).toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Record payment
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 rounded-lg bg-white p-4 sm:grid-cols-3">
          <label className="text-xs text-slate-600">
            Plan
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={plan} onChange={(e) => setPlan(e.target.value as "MONTHLY" | "ANNUAL")}>
              <option value="MONTHLY">Monthly · ₦25,000</option>
              <option value="ANNUAL">Annual · ₦250,000</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Method
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value as "TRANSFER" | "CASH")}>
              <option value="TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Note (e.g. bank reference)
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
          <button
            onClick={() => void record()}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 sm:col-span-3"
          >
            {busy ? "Saving…" : "Save payment and extend access"}
          </button>
        </div>
      )}

      {payments.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {payments.map((p) => (
            <li key={p.id}>
              {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"} · {formatNaira(p.amountKobo)} · {p.plan.toLowerCase()} ·{" "}
              {p.method.toLowerCase()}
              {p.periodEnd && ` · until ${new Date(p.periodEnd).toLocaleDateString()}`}
              {p.recordedBy && ` · recorded by ${p.recordedBy}`}
              {p.note && ` · ${p.note}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
