import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Field, Input, Loading } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { AuthShell } from "./AuthPages";

interface SetupInfo {
  name: string;
  email: string;
  gymName: string;
  purpose: "SETUP" | "RESET";
}

// Landing page for the one-time link a newly approved gym owner receives.
export function SetupPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { completeSetup } = useAuth();
  const navigate = useNavigate();

  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLinkError("This link is incomplete. Open the link from your message again.");
      return;
    }
    api
      .get<SetupInfo>(`/auth/setup/${encodeURIComponent(token)}`)
      .then((r) => setInfo(r.data))
      .catch((err) => setLinkError(errorMessage(err)));
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setFormError("Use at least 8 characters");
    if (password !== confirm) return setFormError("The passwords don't match");
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await completeSetup({ token, password });
      if (result === "sign-in") {
        toast.success("Password changed. Sign in with your new password.");
        navigate("/login", { replace: true });
      } else if (info?.purpose === "RESET") {
        toast.success("Password changed.");
        navigate("/", { replace: true });
      } else {
        toast.success("You're all set. Add your membership plans next.");
        navigate("/plans", { replace: true });
      }
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  if (linkError) {
    return (
      <AuthShell title="Link not valid" subtitle={linkError} footer={<a href="/login" className="font-medium text-brand-700">Go to sign in</a>}>
        <p className="text-sm text-slate-600">
          Links work once. Setup links expire after 48 hours (reply to RestFit on WhatsApp for a new one); reset links after 1
          hour (use "Forgot password?" again).
        </p>
      </AuthShell>
    );
  }
  if (!info) return <Loading />;

  return (
    <AuthShell
      title={info.purpose === "RESET" ? "Choose a new password" : `Welcome, ${info.name.split(" ")[0]}`}
      subtitle={
        info.purpose === "RESET"
          ? `For ${info.gymName}. This signs you out everywhere else.`
          : `${info.gymName} is approved. Choose a password to open your dashboard.`
      }
      footer={<>You'll sign in with {info.email}</>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={info.email} autoComplete="username" readOnly />
        </Field>
        <Field label="New password">
          <Input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password" error={formError ?? undefined}>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Set password and continue"}
        </button>
      </form>
    </AuthShell>
  );
}
