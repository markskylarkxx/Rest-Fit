import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const ITEMS = [
  {
    q: "Do my members need to download an app?",
    a: "No. They can — and they'll get more value from it. But check-ins, payments, and reminders work whether they use the app or not.",
  },
  {
    q: "What if my members don't have smartphones?",
    a: "Every member gets a unique check-in code. Staff can enter it manually at the front desk. The app is optional.",
  },
  {
    q: "Does it work with my existing WhatsApp?",
    a: "Yes. Reminders send from your gym's WhatsApp number. Your members see your name, not RestFit.",
  },
  {
    q: "How long does setup take?",
    a: "Under 10 minutes. Add your plans, add your members, you're running. We'll help you get started.",
  },
  {
    q: "Can I try it before paying?",
    a: "30 days free. No card required. Cancel anytime. No hidden charges.",
  },
  {
    q: "What if I have 2 gym locations?",
    a: "Each location gets its own account with its own member list. You can manage both from the same email. Multi-branch support is on the roadmap.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/[0.06] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Questions</p>
          <h2 className="h2 mt-4">What gym owners ask us.</h2>
        </div>

        <div className="mt-12 divide-y divide-white/[0.06] rounded-card border border-white/[0.06] bg-white/[0.02]">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 p-6 text-left transition hover:bg-white/[0.02]"
                >
                  <p className="text-sm font-semibold sm:text-base">{item.q}</p>
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white/60">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-sm leading-relaxed text-white/60">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      
      </div>
    </section>
  );
}