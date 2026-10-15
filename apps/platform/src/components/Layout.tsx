import clsx from "clsx";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  icons,
  Inbox,
  LogOut,
  Mail,
  UserCheck,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const nav = [
  { to: "/", label: "Overview", icon: BarChart3, end: true },
  { to: "/gyms", label: "All gyms", icon: Building2 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/applications", label: "Applications", icon: Inbox },
  { to: "/leads", label: "Leads", icon: Mail },
  { to: "/at-risk", label: "At-risk", icon: AlertTriangle },
  { to: "/waitlist", label: "Waitlist", icon: UserCheck },
];

export function Layout() {
  const { staff, logout } = useAuth();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <span className="text-sm font-bold">RF</span>
            </div>
            <div>
              <p className="text-sm font-semibold">RestFit</p>
              <p className="text-xs text-slate-500">Platform admin</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
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
            <p className="truncate text-xs text-slate-500">{staff?.email}</p>
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}