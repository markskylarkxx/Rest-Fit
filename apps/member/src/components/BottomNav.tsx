import clsx from "clsx";
import { BarChart3, Dumbbell, Home, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0e1a]/90 backdrop-blur-lg">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }: { isActive: boolean }) =>
              clsx(
                "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition",
                isActive ? "text-brand-400" : "text-white/40"
              )
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}