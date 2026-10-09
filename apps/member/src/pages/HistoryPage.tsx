import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatDate, formatNaira, formatTime } from "../lib/format";
import { Card, ErrorNote, LogoCircle, Spinner } from "../components/ui";

interface Row {
  kind: "checkin" | "payment";
  id: string;
  at: string;
  gymName: string;
  amount?: number;
  method?: string;
  status?: string;
  allowed?: boolean;
}

export function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO(api): replace with a single GET /app/history call once the
    // backend returns merged rows. Right now we still fan out per
    // membership, which is N+1 requests.
    api
      .get<{
        memberships: {
          id: string;
          gym: { id: string; name: string };
        }[];
      }>("/app/me")
      .then(async (res) => {
        const details = await Promise.all(
          res.data.memberships.map((m) =>
            api
              .get<{
                gym: { name: string };
                payments?: {
                  id: string;
                  amountKobo: number;
                  method: string;
                  status: string;
                  paidAt: string | null;
                  createdAt: string;
                }[];
                checkIns?: {
                  id: string;
                  createdAt: string;
                  allowed?: boolean;
                }[];
              }>(`/app/memberships/${m.id}`)
              .then((r) => r.data)
          )
        );

        const all: Row[] = [];
        for (const d of details) {
          for (const p of d.payments ?? []) {
            all.push({
              kind: "payment",
              id: p.id,
              at: p.paidAt ?? p.createdAt,
              gymName: d.gym.name,
              amount: p.amountKobo,
              method: p.method,
              status: p.status,
            });
          }
          for (const c of d.checkIns ?? []) {
            all.push({
              kind: "checkin",
              id: c.id,
              at: c.createdAt,
              gymName: d.gym.name,
              // Use the real value when the API returns it.
              allowed: c.allowed ?? true,
            });
          }
        }
        all.sort((a, b) => (a.at < b.at ? 1 : -1));
        setRows(all);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error)
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  if (!rows) return <Spinner />;

  return (
    <div className="min-h-screen pb-28">
      <header className="px-6 pt-8 pb-4">
        <h1 className="heading">History</h1>
        <p className="subheading mt-1">
          Check-ins and payments across your gyms
        </p>
      </header>

      <div className="px-6">
        {rows.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-sm text-white/50">Nothing yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card
                key={`${r.kind}-${r.id}`}
                className="flex items-center gap-3 p-3.5"
              >
                <LogoCircle name={r.gymName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {r.kind === "checkin" ? "Checked in" : "Payment"}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {r.gymName} · {formatDate(r.at)} · {formatTime(r.at)}
                  </p>
                </div>
                {r.kind === "payment" ? (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatNaira(r.amount ?? 0)}
                    </p>
                    <p className="text-xs capitalize text-white/40">
                      {r.status?.toLowerCase()}
                    </p>
                  </div>
                ) : r.allowed ? (
                  <CheckCircle2
                    size={20}
                    className="text-emerald-400"
                    aria-label="Allowed"
                  />
                ) : (
                  <XCircle
                    size={20}
                    className="text-red-400"
                    aria-label="Refused"
                  />
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}