import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, MessageCircle, RefreshCw, X } from "lucide-react";
import { api, errorMessage } from "../lib/api";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface Application {
  id: string;
  gymName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  status: Status;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  gym: { id: string; joinCode: string; ownerActivated: boolean } | null;
}

interface ApplicationsResponse {
  counts: Record<Status, number>;
  applications: Application[];
}

// Gyms created by the old self-serve signup, before applications existed.
interface LegacyPendingGym {
  id: string;
  name: string;
  joinCode: string;
  phone: string | null;
  createdAt: string;
  staff: { name: string; email: string }[];
}

interface IssuedLink {
  gymName: string;
  ownerName: string;
  phone: string;
  setupUrl: string;
}

const TABS: { key: Status; label: string; tone: string }[] = [
  { key: "PENDING", label: "To review", tone: "border-amber-600 text-amber-700" },
  { key: "APPROVED", label: "Approved", tone: "border-emerald-600 text-emerald-700" },
  { key: "REJECTED", label: "Rejected", tone: "border-slate-400 text-slate-500" },
];

const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

const setupMessage = (link: IssuedLink) =>
  `Hi ${link.ownerName.split(" ")[0]}, ${link.gymName} is approved on RestFit! Set your password here to open your dashboard: ${link.setupUrl}\n\nThe link works once and expires in 48 hours.`;

export function ApplicationsPage() {
  const [tab, setTab] = useState<Status>("PENDING");
  const [data, setData] = useState<ApplicationsResponse | null>(null);
  const [legacy, setLegacy] = useState<LegacyPendingGym[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [apps, pendingGyms] = await Promise.all([
        api.get<ApplicationsResponse>("/platform/applications", { params: { status: tab } }),
        api.get<LegacyPendingGym[]>("/platform/pending-gyms"),
      ]);
      setData(apps.data);
      setLegacy(pendingGyms.data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(id: string, action: () => Promise<void>) {
    setBusy(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const approve = (a: Application) => {
    if (!confirm(`Approve ${a.gymName}? This creates the gym, starts its 30-day trial and sends ${a.ownerName} a setup link.`)) return;
    void run(a.id, async () => {
      const res = await api.post<{ setupUrl: string }>(`/platform/applications/${a.id}/approve`);
      setCopied(false);
      setIssued({ gymName: a.gymName, ownerName: a.ownerName, phone: a.phone, setupUrl: res.data.setupUrl });
    });
  };

  const reject = (a: Application) => {
    const reason = prompt(`Reject ${a.gymName}? Optionally note why (only you see this):`);
    if (reason === null) return;
    void run(a.id, async () => {
      await api.post(`/platform/applications/${a.id}/reject`, { reason });
    });
  };

  const resend = (a: Application) =>
    void run(a.id, async () => {
      const res = await api.post<{ setupUrl: string }>(`/platform/applications/${a.id}/resend-link`);
      setCopied(false);
      setIssued({ gymName: a.gymName, ownerName: a.ownerName, phone: a.phone, setupUrl: res.data.setupUrl });
    });

  const decideLegacy = (gym: LegacyPendingGym, action: "approve" | "reject") => {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} ${gym.name}?`)) return;
    void run(gym.id, async () => {
      await api.post(`/platform/pending-gyms/${gym.id}/${action}`);
    });
  };

  const copyLink = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.setupUrl);
    setCopied(true);
  };

  if (error && !data)
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gym owners who applied on the landing page. Nothing is created until you approve.
        </p>
      </header>

      {issued && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900">Setup link for {issued.gymName}</p>
              <p className="mt-1 text-sm text-emerald-800">
                We've also sent it by SMS. To be safe, send it on WhatsApp yourself too. It works once and expires in 48 hours.
              </p>
              <p className="mt-2 break-all rounded bg-white px-2 py-1 font-mono text-xs text-slate-700">{issued.setupUrl}</p>
            </div>
            <button onClick={() => setIssued(null)} className="shrink-0 text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={waLink(issued.phone, setupMessage(issued))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle size={14} />
              Send on WhatsApp
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.key ? t.tone : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label} <span className="ml-1 text-xs opacity-70">{data.counts[t.key] ?? 0}</span>
          </button>
        ))}
      </nav>

      {data.applications.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {tab === "PENDING" ? "No applications to review. You're all caught up." : "Nothing here yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {data.applications.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {a.gymName} <span className="font-normal text-slate-500">· {a.city}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {a.ownerName} · {a.phone} · {a.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Applied {new Date(a.createdAt).toLocaleString()}
                    {a.reviewedAt &&
                      ` · ${a.status === "APPROVED" ? "Approved" : "Rejected"} ${new Date(a.reviewedAt).toLocaleDateString()}${a.reviewedBy ? ` by ${a.reviewedBy}` : ""}`}
                  </p>
                  {a.rejectionReason && <p className="mt-1 text-xs text-slate-500">Reason: {a.rejectionReason}</p>}
                  {a.gym && (
                    <p className="mt-1 text-xs text-slate-500">
                      Join code <span className="font-mono">{a.gym.joinCode}</span> ·{" "}
                      {a.gym.ownerActivated ? (
                        <span className="text-emerald-700">Owner has set their password</span>
                      ) : (
                        <span className="text-amber-700">Waiting for owner to set password</span>
                      )}{" "}
                      · <Link to={`/gyms/${a.gym.id}`} className="text-slate-700 underline">View gym</Link>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={waLink(a.phone, `Hi ${a.ownerName.split(" ")[0]}, this is RestFit. Thanks for applying with ${a.gymName}! I'd like to confirm a few details before we set up your dashboard.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                  {a.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => reject(a)}
                        disabled={busy === a.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                      <button
                        onClick={() => approve(a)}
                        disabled={busy === a.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                    </>
                  )}
                  {a.status === "APPROVED" && a.gym && !a.gym.ownerActivated && (
                    <button
                      onClick={() => resend(a)}
                      disabled={busy === a.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw size={14} />
                      New setup link
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "PENDING" && legacy.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-slate-700">Older signups waiting for approval</h2>
          <p className="mb-3 mt-1 text-xs text-slate-500">
            These gyms were created by the old self-serve signup. They can't sign in until you approve them.
          </p>
          <div className="space-y-3">
            {legacy.map((gym) => (
              <div key={gym.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{gym.name}</p>
                  <p className="text-sm text-slate-600">
                    {gym.staff[0] ? `${gym.staff[0].name} · ${gym.staff[0].email}` : "No owner account"}
                    {gym.phone && ` · ${gym.phone}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => decideLegacy(gym, "reject")}
                    disabled={busy === gym.id}
                    className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decideLegacy(gym, "approve")}
                    disabled={busy === gym.id}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
