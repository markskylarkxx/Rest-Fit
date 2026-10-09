export function AppScreenshots() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="eyebrow">See it in action</p>
          <h2 className="h2 mt-4">The app your members will actually use.</h2>
          <p className="body-lg mx-auto mt-4 max-w-2xl">
            No clutter. No ads. Just a fitness coach that remembers what they
            did last time and tells them what to do next.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <PhoneFrame label="Home" fileName="home.png" />
          <PhoneFrame label="Log workout" fileName="log.png" />
          <PhoneFrame label="Progress" fileName="progress.png" />
          <PhoneFrame label="Check in" fileName="qr.png" />
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          Screenshots from the actual RestFit app. Android · iOS coming soon.
        </p>
      </div>
    </section>
  );
}

function PhoneFrame({
  label,
  fileName,
}: {
  label: string;
  fileName: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[240px]">
        {/* phone body */}
        <div className="relative aspect-[9/19] w-full rounded-[2rem] border-[6px] border-white/[0.08] bg-[#1a1a1a] p-1.5 shadow-2xl shadow-black/60">
          {/* notch */}
          <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
          {/* screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-canvas">
            <img
              src={`/screens/${fileName}`}
              alt={`RestFit ${label} screen`}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-white/50">{label}</p>
    </div>
  );
}