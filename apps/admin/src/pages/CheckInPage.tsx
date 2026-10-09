import clsx from "clsx";
import { CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { formatDate, fullName } from "../lib/format";
import type { CheckInResult } from "../lib/types";

// USB/Bluetooth QR scanners act like a keyboard: they type the code and press
// Enter, so a focused text box is all the front desk needs.
export function CheckInPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResult((await api.post<CheckInResult>("/checkins", { code })).data);
    } catch (err) {
      setResult(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setCode("");
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <PageHeader title="Check-in" subtitle="Scan a member's QR code, or type the code on their card" />

      <form onSubmit={submit} className="card flex gap-3 p-4">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7KQ4MZ2P"
            className="input py-3 pl-11 font-mono text-lg tracking-widest"
            autoComplete="off"
          />
        </div>
        <button className="btn-primary px-6" disabled={busy}>
          Check in
        </button>
      </form>

      {error && <p className="mt-6 rounded-xl bg-red-50 p-6 text-center font-medium text-red-700">{error}</p>}

      {result && (
        <div
          className={clsx(
            "mt-6 flex flex-col items-center rounded-xl p-8 text-center",
            result.allowed ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900",
          )}
        >
          {result.allowed ? <CheckCircle2 size={56} className="text-emerald-600" /> : <XCircle size={56} className="text-red-600" />}
          <p className="mt-3 text-3xl font-semibold">{fullName(result.member)}</p>
          {result.allowed ? (
            <p className="mt-2">
              {result.plan} · active until {formatDate(result.activeUntil)}
              {result.daysLeft !== null && result.daysLeft <= 7 && (
                <span className="mt-2 block font-semibold text-amber-700">
                  Ends in {result.daysLeft} day{result.daysLeft === 1 ? "" : "s"}. Remind them to renew.
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2">
              {result.reason}.{" "}
              <Link to={`/members/${result.member.id}`} className="font-semibold underline">
                Renew membership
              </Link>
            </p>
          )}
        </div>
      )}
    </>
  );
}
