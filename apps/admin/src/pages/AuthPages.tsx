import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { loginSchema, registerGymSchema, type LoginInput, type RegisterGymInput } from "@restfit/shared";
import { Field, Input } from "../components/ui";
import { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
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

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your gym"
      footer={
        <>
          New gym? <Link to="/register" className="font-medium text-brand-700">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" autoFocus {...register("email")} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <button className="btn-primary w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const { register, handleSubmit, formState } = useForm<RegisterGymInput>({ resolver: zodResolver(registerGymSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      toast.success("Your gym is set up. Add your membership plans next.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <AuthShell
      title="Set up your gym"
      subtitle="Takes under a minute"
      footer={
        <>
          Already have an account? <Link to="/login" className="font-medium text-brand-700">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Gym name" error={formState.errors.gymName?.message}>
          <Input autoFocus {...register("gymName")} />
        </Field>
        <Field label="Your name" error={formState.errors.ownerName?.message}>
          <Input autoComplete="name" {...register("ownerName")} />
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <button className="btn-primary w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Creating…" : "Create gym"}
        </button>
      </form>
    </AuthShell>
  );
}