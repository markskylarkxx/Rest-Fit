import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useBilling } from "../lib/billing";
import { formatDate } from "../lib/format";

// Shown above every page when the trial or subscription is ending or has ended.
export function TrialBanner() {
  const { billing } = useBilling();
  if (!billing) return null;

  const { state, daysLeft, graceEndsAt } = billing;
  const action = (
    <Link to="/billing" className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
      {state === "ACTIVE" ? "Renew" : "Choose a plan"}
    </Link>
  );

  if (state === "GRACE" || state === "LOCKED") {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle size={18} className="shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            {billing.paidUntil ? "Your RestFit subscription has ended." : "Your free trial has ended."}
          </p>
          <p className="mt-0.5 text-xs text-red-700">
            {state === "GRACE"
              ? `Your dashboard keeps working until ${formatDate(graceEndsAt)}. Choose a plan to avoid interruption.`
              : "Check-in and member renewals still work, so your members can keep training. The rest of your dashboard is paused until you choose a plan. Your data is safe."}
          </p>
        </div>
        {action}
      </div>
    );
  }

  if (daysLeft > 7) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle size={18} className="shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          {daysLeft} day{daysLeft === 1 ? "" : "s"} left in your {state === "TRIAL" ? "free trial" : "subscription"}.
        </p>
        <p className="mt-0.5 text-xs text-amber-700">Choose a plan now and keep every day you have left.</p>
      </div>
      {action}
    </div>
  );
}
