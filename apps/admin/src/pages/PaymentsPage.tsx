import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PaymentStatus } from "@restfit/shared";
import { Badge, Empty, ErrorNote, Loading, PageHeader } from "../components/ui";
import { formatDateTime, formatNaira, fullName } from "../lib/format";
import type { Payment } from "../lib/types";
import { useFetch } from "../lib/useFetch";

const tones = { SUCCESS: "green", PENDING: "blue", FAILED: "red" } as const;
const labels = { SUCCESS: "Paid", PENDING: "Pending", FAILED: "Failed" };

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => <Badge tone={tones[status]}>{labels[status]}</Badge>;

const filters = [
  { value: "", label: "All" },
  { value: "SUCCESS", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

export function PaymentsPage() {
  const [status, setStatus] = useState("");
  const { data, error, loading } = useFetch<Payment[]>(`/payments${status ? `?status=${status}` : ""}`);
  const total = data?.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amountKobo, 0) ?? 0;

  return (
    <>
      <PageHeader title="Payments" subtitle={data ? `${formatNaira(total)} received across the payments shown` : undefined} />
      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={clsx("rounded-md px-3 py-1.5 text-sm", status === f.value ? "bg-white font-medium shadow-sm" : "text-slate-600")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorNote message={error} />}
      <div className="card overflow-x-auto">
        {loading && !data ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>No payments yet.</Empty>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="table-head">Date</th>
                <th className="table-head">Member</th>
                <th className="table-head">Plan</th>
                <th className="table-head">Method</th>
                <th className="table-head">Recorded by</th>
                <th className="table-head text-right">Amount</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="table-cell text-slate-600">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  <td className="table-cell font-medium">
                    {p.member && (
                      <Link to={`/members/${p.member.id}`} className="hover:underline">
                        {fullName(p.member)}
                      </Link>
                    )}
                  </td>
                  <td className="table-cell text-slate-600">{p.subscription?.plan.name ?? "—"}</td>
                  <td className="table-cell capitalize text-slate-600">{p.method.toLowerCase()}</td>
                  <td className="table-cell text-slate-600">{p.recordedBy?.name ?? "—"}</td>
                  <td className="table-cell text-right font-medium">{formatNaira(p.amountKobo)}</td>
                  <td className="table-cell">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
