import clsx from "clsx";
import {
  AlertTriangle,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { BillingProvider, useBilling } from "../lib/billing";
import { TrialBanner } from "../pages/TrialBanner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/at-risk", label: "At-risk", icon: AlertTriangle },
  { to: "/check-in", label: "Check-in", icon: ScanLine },
  { to: "/members", label: "Members", icon: Users },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/plans", label: "Plans", icon: Tags },
  { to: "/billing", label: "Billing", icon: Wallet },
];

// What still works while the gym's RestFit billing is paused: the front desk,
// so members can always check in and renew.
const FRONT_DESK_PATHS = ["/check-in", "/members", "/billing"];
const allowedWhenLocked = (path: string) => FRONT_DESK_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export function Layout() {
  return (
    <BillingProvider>
      <Shell />
    </BillingProvider>
  );
}

// Once the trial/subscription has lapsed past its grace period, only Billing works.
function PageArea() {
  const { billing } = useBilling();
  const { pathname } = useLocation();
  if (billing?.state === "LOCKED" && !allowedWhenLocked(pathname)) {
    return <Navigate to="/check-in" replace />;
  }
  return (
    <>
      <TrialBanner />
      <Outlet />
    </>
  );
}

function Shell() {
  const { staff, logout } = useAuth();
  const { billing } = useBilling();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Dumbbell size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{staff?.gym.name}</p>
          <p className="text-xs text-slate-500">RestFit</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.filter(({ to }) => billing?.state !== "LOCKED" || allowedWhenLocked(to)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100",
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-sm font-medium">{staff?.name}</p>
        <p className="text-xs capitalize text-slate-500">
          {staff?.role.toLowerCase().replace("_", " ")}
        </p>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-semibold">{staff?.gym.name}</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </button>
      </header>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-64 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
        <PageArea />
      </main>
    </div>
  );
}