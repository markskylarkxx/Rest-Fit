import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loading } from "../components/ui";
import { api } from "../lib/api";
import { useBilling } from "../lib/billing";
import { formatDate } from "../lib/format";

interface Result {
  status: "PENDING" | "SUCCESS" | "FAILED";
  periodEnd: string | null;
}

// Where Orch-Pay sends the gym after paying for RestFit. The webhook is what
// actually extends access; this page checks a few times and reports back.
export function BillingReturnPage() {
  const [params] = useSearchParams();
  const paymentId = params.get("payment");
  const { reload } = useBilling();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    let tries = 0;
    let timer: number | undefined;
    const check = async () => {
      try {
        const { data } = await api.post<Result>(`/billing/payments/${paymentId}/refresh`);
        setResult(data);
        if (data.status !== "PENDING") {
          void reload();
          return;
        }
      } catch {
        // keep polling a little
      }
      if (++tries < 10) timer = window.setTimeout(check, 3000);
      else setResult((r) => r ?? { status: "PENDING", periodEnd: null });
    };
    void check();
    return () => window.clearTimeout(timer);
  }, [paymentId, reload]);

  if (!result) return <Loading />;

  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      {result.status === "SUCCESS" && <CheckCircle2 size={48} className="mx-auto text-emerald-600" />}
      {result.status === "FAILED" && <XCircle size={48} className="mx-auto text-red-600" />}
      {result.status === "PENDING" && <Clock size={48} className="mx-auto text-amber-500" />}
      <h1 className="mt-4 text-xl font-semibold">
        {result.status === "SUCCESS" ? "Payment received" : result.status === "FAILED" ? "Payment didn't go through" : "Confirming your payment"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {result.status === "SUCCESS" && `Thanks! Your subscription now runs until ${formatDate(result.periodEnd)}.`}
        {result.status === "FAILED" && "You haven't been charged. You can try again from the Billing page."}
        {result.status === "PENDING" && "This can take a minute. We'll update your account as soon as it's confirmed."}
      </p>
      <Link to={result.status === "SUCCESS" ? "/" : "/billing"} className="btn-primary mt-6 inline-flex">
        {result.status === "SUCCESS" ? "Go to dashboard" : "Back to billing"}
      </Link>
    </div>
  );
}
