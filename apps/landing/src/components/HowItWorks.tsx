const STEPS = [
  {
    n: "01",
    title: "Sign up your gym",
    body: "Create your account in 30 seconds. Add your plans and prices. Nothing else required.",
  },
  {
    n: "02",
    title: "Add your members",
    body: "Import from your notebook, or add them one by one. Each member gets a unique check-in code.",
  },
  {
    n: "03",
    title: "Run your gym",
    body: "Check-ins, payments, reminders, retention — all in one place. Your members get a fitness coach in their pocket.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
          <p className="eyebrow">How it works</p>
          <h2 className="h2 mt-4">Three steps.</h2>
          <p className="body-lg mt-4">
            From sign-up to running your first member in under 10 minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-card border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8"
            >
              <p className="text-3xl font-extrabold tracking-tight text-lime">
                {s.n}
              </p>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}