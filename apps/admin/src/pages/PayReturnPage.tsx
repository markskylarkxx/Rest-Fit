import { CheckCircle2 } from "lucide-react";

// Where Orch-Pay sends a member after they pay. The membership itself is
// activated by the payment webhook, not by this page.
export function PayReturnPage() {
  return (
    <div className="grid min-h-screen place-items-center p-4 text-center">
      <div className="card max-w-sm p-8">
        <CheckCircle2 size={48} className="mx-auto text-brand-600" />
        <h1 className="mt-4 text-xl font-semibold">Thanks for your payment</h1>
        <p className="mt-2 text-sm text-slate-500">
          We're confirming it now. You'll get a message as soon as your membership is active. You can close this page.
        </p>
      </div>
    </div>
  );
}
