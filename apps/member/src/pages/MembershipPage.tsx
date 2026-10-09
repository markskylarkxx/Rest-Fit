import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, QrCode } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { daysUntil, formatDate, formatNaira, formatTime } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  LogoCircle,
  Spinner,
} from "../components/ui";

interface MembershipDetail {
  id: string;
  firstName: string;
  lastName: string;
  activeUntil: string | null;
  checkInCode: string;
  gym: { id: string; name: string; address: string | null };
  subscriptions: {
    id: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    plan: { name: string; durationDays: number };
  }[];
  payments: {
    id: string;
    amountKobo: number;
    method: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  checkIns: { id: string; createdAt: string }[];
}

export function MembershipPage() {
  const { id } = useParams();
  const [data, setData] = useState<MembershipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MembershipDetail>(`/app/memberships/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error)
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  if (!data) return <Spinner />;

  const days = daysUntil(data.activeUntil);
  const tone = !data.activeUntil ? "slate" : days <= 7 ? "amber" : "green";
  const label = !data.activeUntil
    ? "No active plan"
    : days <= 0
      ? "Expired"
      : days <= 7
        ? `${days} days left`
        : "Active";
  const activePlan = data.subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <div className="min-h-screen pb-28">
      <header className="px-6 pt-6 pb-4">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-white/40"
        >
          <ArrowLeft size={16} /> Home
        </Link>
      </header>

      <div className="space-y-5 px-6">
        <div className="flex items-center gap-4">
          <LogoCircle name={data.gym.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-white">
              {data.gym.name}
            </h1>
            {data.gym.address && (
              <p className="truncate text-sm text-white/50">
                {data.gym.address}
              </p>
            )}
          </div>
        </div>

        <Card elevated className="relative overflow-hidden border-none p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="label">Membership</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {activePlan?.plan.name ?? "No plan"}
              </p>
              {data.activeUntil && (
                <p className="mt-1 text-sm text-white/50">
                  Until {formatDate(data.activeUntil)}
                </p>
              )}
            </div>
            <Badge tone={tone}>{label}</Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to={`/memberships/${id}/qr`}>
              <Button variant="secondary" className="w-full">
                <QrCode size={16} /> QR
              </Button>
            </Link>
            <Link to={`/memberships/${id}/renew`}>
              <Button className="w-full">Renew</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white">
            Recent visits
          </h2>
          {data.checkIns.length === 0 ? (
            <p className="text-sm text-white/40">No visits yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.checkIns.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-white/70"
                >
                  <span>{formatDate(c.createdAt)}</span>
                  <span className="text-white/40">
                    {formatTime(c.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-white">Payments</h2>
          {data.payments.length === 0 ? (
            <p className="text-sm text-white/40">No payments yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.payments.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {formatNaira(p.amountKobo)}
                    </p>
                    <p className="text-xs capitalize text-white/40">
                      {p.method.toLowerCase()} ·{" "}
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      p.status === "SUCCESS"
                        ? "green"
                        : p.status === "PENDING"
                          ? "blue"
                          : "red"
                    }
                  >
                    {p.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
