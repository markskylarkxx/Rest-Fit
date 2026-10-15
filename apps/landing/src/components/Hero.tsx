import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { whatsappLink } from "../lib/whatsapp";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-lime/[0.08] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Gym management for Nigeria</p>

            <h1 className="h1 mt-4">
              Your members are leaving.
              <br />
              <span className="text-lime">
                RestFit tells you before they do.
              </span>
            </h1>

            <p className="body-lg mt-6 max-w-xl">
              The gym platform that shows you who's about to quit, automates
              WhatsApp reminders, and gives your members a fitness app they'll
              actually open.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#signup" className="btn-primary">
                Sign up your gym
                <ArrowRight size={16} />
              </a>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <MessageCircle size={16} />
                I'm interested
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/50">
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="text-lime" />
                Built in Lagos
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="text-lime" />
                Works on any phone
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="text-lime" />
                No setup fee
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="text-lime" />
                30-day free trial
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-white/[0.08] bg-surface p-5 shadow-2xl shadow-black/50">
              <div className="mb-4 flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="ml-3 rounded-md bg-white/[0.04] px-3 py-1 text-[10px] font-medium text-white/40">
                  restfit.com/dashboard
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Active members
                    </p>
                    <p className="mt-1 text-2xl font-extrabold">371</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Revenue this month
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-lime">
                      ₦4.2M
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-lime/20 bg-lime/[0.06] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-lime">
                      ⚠ At-risk members
                    </p>
                    <p className="text-xs font-bold text-lime">8</p>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium">Chidi Okeke</span>
                      <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[9px] font-semibold text-lime">
                        Training elsewhere
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium">Amara Eze</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
                        Lapsed
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium">Tunde Bello</span>
                      <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[9px] font-semibold text-lime">
                        Training elsewhere
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Ending this week
                    </p>
                    <p className="mt-1 text-lg font-bold">23</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Check-ins today
                    </p>
                    <p className="mt-1 text-lg font-bold">47</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-lime/[0.06] blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}