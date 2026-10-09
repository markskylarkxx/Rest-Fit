import clsx from "clsx";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/* ---------- Card ---------- */
export function Card({
  children,
  className,
  elevated = false,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div className={clsx(elevated ? "card-elevated" : "card", "p-5", className)}>
      {children}
    </div>
  );
}

/* ---------- Field ---------- */
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}

/* ---------- Input ---------- */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  return <input ref={ref} {...props} className={clsx("input", props.className)} />;
});

/* ---------- Button ---------- */
export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      {...props}
      className={clsx(
        variant === "primary"
          ? "btn-primary"
          : variant === "secondary"
            ? "btn-secondary"
            : "btn-ghost",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Badge ---------- */
const badgeTones = {
  green: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  red: "bg-red-500/15 text-red-400 ring-red-500/30",
  slate: "bg-white/10 text-white/60 ring-white/20",
  blue: "bg-brand-500/15 text-brand-400 ring-brand-500/30",
};

export function Badge({
  tone,
  children,
  className,
}: {
  tone: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Spinner ---------- */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-brand-500" />
    </div>
  );
}

/* ---------- ErrorNote ---------- */
export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </p>
  );
}

/* ---------- Logo circle (gym initials) ---------- */
export function LogoCircle({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-14 w-14 text-lg",
  };

  // Deterministic hue from the gym name
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      className={clsx(
        "grid shrink-0 place-items-center rounded-2xl font-bold text-white shadow-lg",
        sizes[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${
          (hue + 30) % 360
        }, 75%, 40%))`,
        boxShadow: `0 8px 24px -8px hsl(${hue}, 70%, 50%, 0.5)`,
      }}
    >
      {initials || "G"}
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function ProgressBar({
  value,
  className,
}: {
  value: number; // 0-100
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={clsx(
        "h-2 w-full overflow-hidden rounded-full bg-white/10",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
