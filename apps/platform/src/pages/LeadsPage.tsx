import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { api, errorMessage } from "../lib/api";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CONVERTED"
  | "LOST";

interface GymLead {
  id: string;
  gymName: string;
  ownerName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  notes: string | null;
  contactedAt: string | null;
  onboardedAt: string | null;
  createdAt: string;
}

type Counts = Record<LeadStatus | "ALL", number>;

const STATUS_TABS: { key: LeadStatus | "ALL"; label: string; tone: string }[] = [
  { key: "ALL", label: "All", tone: "border-slate-900 text-slate-900" },
  { key: "NEW", label: "New", tone: "border-blue-600 text-blue-700" },
  { key: "CONTACTED", label: "Contacted", tone: "border-amber-600 text-amber-700" },
  { key: "QUALIFIED", label: "Qualified", tone: "border-purple-600 text-purple-700" },
  { key: "CONVERTED", label: "Converted", tone: "border-emerald-600 text-emerald-700" },
  { key: "LOST", label: "Lost", tone: "border-slate-400 text-slate-500" },
];

const STATUS_PILL: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  QUALIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-slate-100 text-slate-500 border-slate-200",
};

export function LeadsPage() {
  const [leads, setLeads] = useState<GymLead[] | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [tab, setTab] = useState<LeadStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    try {
      const [leadsRes, countsRes] = await Promise.all([
        api.get<GymLead[]>("/platform/leads"),
        api.get<Counts>("/platform/leads/counts"),
      ]);
      setLeads(leadsRes.data);
      setCounts({ ...countsRes.data, ALL: leadsRes.data.length });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: LeadStatus) {
    setUpdatingId(id);
    try {
      const res = await api.patch<GymLead>(`/platform/leads/${id}`, { status });
      setLeads((prev) =>
        prev ? prev.map((l) => (l.id === id ? res.data : l)) : prev,
      );
      // Refresh counts cheaply.
      const countsRes = await api.get<Counts>("/platform/leads/counts");
      setCounts((prev) =>
        prev
          ? { ...countsRes.data, ALL: prev.ALL }
          : { ...countsRes.data, ALL: leads?.length ?? 0 },
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!leads || !counts) return <p className="text-slate-500">Loading…</p>;

  const visible =
    tab === "ALL" ? leads : leads.filter((l) => l.status === tab);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gym owners who filled the landing page form
        </p>
      </header>

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {STATUS_TABS.map((t) => {
          const count = counts[t.key] ?? 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? t.tone
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}{" "}
              <span className="text-slate-400">({count})</span>
            </button>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {tab === "ALL" ? "No leads yet." : `No leads in ${tab.toLowerCase()}.`}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <div
              key={lead.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{lead.gymName}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        STATUS_PILL[lead.status] ?? STATUS_PILL.NEW
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {lead.ownerName} · {lead.role}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {lead.phone} · {lead.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Applied {new Date(lead.createdAt).toLocaleDateString()}
                    {lead.contactedAt && (
                      <> · Contacted {new Date(lead.contactedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Phone size={14} />
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hi ${lead.ownerName.split(" ")[0]}! This is RestFit. Thanks for your interest in ${lead.gymName}. When can I show you the dashboard?`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  </div>

                  <select
                    value={lead.status}
                    disabled={updatingId === lead.id}
                    onChange={(e) =>
                      setStatus(lead.id, e.target.value as LeadStatus)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}