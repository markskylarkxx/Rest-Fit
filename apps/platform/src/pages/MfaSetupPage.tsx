import { useEffect, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth, type Staff } from "../lib/auth";

interface Enrollment {
  secret: string;
  otpauthUrl: string;
}

interface EnableResponse {
  recoveryCodes: string[];
  token: string;
  staff: Staff;
}

// Shown to a platform admin who hasn't turned on two-step login yet. The
// platform API refuses every request until this is done.
export function MfaSetupPage() {
  const { staff, startSession, logout } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<EnableResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .post<Enrollment>("/auth/mfa/setup")
      .then((r) => setEnrollment(r.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const confirmCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<EnableResponse>("/auth/mfa/enable", { code });
      setDone(data);
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const codesText = done
    ? `RestFit platform admin recovery codes for ${staff?.email}\nEach code works once.\n\n${done.recoveryCodes.join("\n")}\n`
    : "";

  const copyCodes = async () => {
    await navigator.clipboard.writeText(codesText);
    setCopied(true);
  };

  const downloadCodes = () => {
    const url = URL.createObjectURL(new Blob([codesText], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "restfit-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-lg font-semibold">Turn on two-step login</p>
            <p className="text-xs text-slate-500">Required for the platform admin</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {done ? (
            <>
              <h1 className="font-semibold">Save your recovery codes</h1>
              <p className="mt-1 text-sm text-slate-600">
                If you lose your phone, each of these codes lets you sign in once. Keep them somewhere safe, like a password
                manager. You won't see them again.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 font-mono text-sm">
                {done.recoveryCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={copyCodes}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadCodes}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                I've saved my recovery codes
              </label>
              <button
                disabled={!saved}
                onClick={() => startSession({ token: done.token, staff: done.staff })}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Continue to the platform admin
              </button>
            </>
          ) : (
            <form onSubmit={confirmCode}>
              <ol className="space-y-4 text-sm text-slate-700">
                <li>
                  <span className="font-semibold">1.</span> Install an authenticator app on your phone, such as Google
                  Authenticator, Microsoft Authenticator, Authy or 1Password.
                </li>
                <li>
                  <span className="font-semibold">2.</span> In the app, add an account and scan this QR code.
                  {enrollment ? (
                    <div className="mt-3 flex flex-col items-center gap-3 rounded-lg bg-slate-50 p-4">
                      <div className="rounded bg-white p-2">
                        <QRCodeSVG value={enrollment.otpauthUrl} size={176} />
                      </div>
                      <p className="text-center text-xs text-slate-500">
                        Can't scan it? Enter this key instead:
                        <span className="mt-1 block break-all font-mono text-sm text-slate-800">
                          {enrollment.secret.match(/.{1,4}/g)?.join(" ")}
                        </span>
                      </p>
                    </div>
                  ) : (
                    !error && <p className="mt-3 text-slate-500">Loading…</p>
                  )}
                </li>
                <li>
                  <span className="font-semibold">3.</span> Enter the 6-digit code the app shows.
                  <input
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:border-slate-900 focus:outline-none"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </li>
              </ol>

              {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={busy || !enrollment || code.length !== 6}
                className="mt-5 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? "Checking…" : "Turn on two-step login"}
              </button>
            </form>
          )}
        </div>

        <button onClick={logout} className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-700">
          Sign out
        </button>
      </div>
    </div>
  );
}
