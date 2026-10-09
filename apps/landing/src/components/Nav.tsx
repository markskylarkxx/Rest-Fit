import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#problem", label: "Why it matters" },
  { href: "#solution", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 z-50 w-full transition-all duration-200 " +
        (scrolled
          ? "border-b border-white/[0.06] bg-canvas/90 backdrop-blur-xl"
          : "bg-transparent")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-lime">
            <span className="text-base font-extrabold leading-none text-canvas">
              R
            </span>
          </div>
          <span className="text-base font-bold tracking-tight">RestFit</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/60 transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a href="#signup" className="btn-primary">
            Sign up your gym
          </a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-white/70 md:hidden"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-canvas/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2 px-6 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-white/70 transition hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#signup"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2"
            >
              Sign up your gym
            </a>
          </div>
        </div>
      )}
    </header>
  );
}