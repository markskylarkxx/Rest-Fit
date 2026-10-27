import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Dumbbell, Eye, EyeOff } from "lucide-react"; // Added Eye icons
import { useState, type FormEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { loginSchema, type LoginInput } from "@restfit/shared";
import { Field, Input } from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const LANDING_SIGNUP_URL = `${import.meta.env.VITE_LANDING_URL ?? "https://myrestfit.com"}/#signup`;

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
            <Dumbbell size={20} />
          </div>
          <span className="text-lg font-semibold">RestFit</span>
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="card p-6">{children}</div>
        <p className="mt-4 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Added state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: LoginInput) => {
    setLoginError(null);
    try {
      await login(values);
    } catch (err: any) {
      const message = err.message || err.response?.data?.error || "Login failed";
      setLoginError(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your gym"
      footer={
        <>
          New gym?{" "}
          <a href={LANDING_SIGNUP_URL} className="font-medium text-brand-700">
            Apply for a free trial
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {loginError}
          </div>
        )}
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" autoFocus {...register("email")} />
        </Field>
        
        <Field label="Password" error={formState.errors.password?.message}>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              autoComplete="current-password" 
              {...register("password")} 
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-brand-700">
            Forgot password?
          </Link>
        </div>
        <button className="btn-primary w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      const message = err.message || err.response?.data?.error || "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={sent ? "Check your phone" : "We'll text a reset link to your gym's phone number"}
      footer={
        <Link to="/login" className="font-medium text-brand-700">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-slate-600">
          If {email} belongs to a gym owner account, we've sent a reset link to the gym's phone number. It expires in 1 hour.
          Staff accounts: ask your gym owner to reset your password.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50 w-full">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}