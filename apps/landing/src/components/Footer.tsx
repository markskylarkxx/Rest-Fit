export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center gap-8 sm:flex-row sm:items-start sm:text-left sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-lime">
                <span className="text-base font-extrabold leading-none text-canvas">
                  R
                </span>
              </div>
              <span className="text-base font-bold tracking-tight">
                RestFit
              </span>
            </div>
            <p className="mt-4 text-sm text-white/50">
              The gym platform that tells you who's about to quit — and gives
              your members a fitness app they'll actually open.
            </p>
            <p className="mt-4 text-xs text-white/30">
              Made in Lagos 🇳🇬
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-8 sm:w-auto sm:grid-cols-3 sm:gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Product
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="#solution" className="text-white/60 transition hover:text-ink">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-white/60 transition hover:text-ink">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-white/60 transition hover:text-ink">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Company
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="mailto:hello@restfit.com" className="text-white/60 transition hover:text-ink">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#signup" className="text-white/60 transition hover:text-ink">
                    Sign up
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Reach us
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="https://wa.me/2348000000000"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/60 transition hover:text-lime"
                  >
                    WhatsApp →
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@restfit.com"
                    className="text-white/60 transition hover:text-lime"
                  >
                    hello@restfit.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} RestFit. All rights reserved.</p>
          <p>Lagos, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}