import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

export function RestTimerPill({
  seconds,
  onClose,
}: {
  seconds: number;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      if (paused) {
        lastTickRef.current = Date.now();
        return;
      }
      const now = Date.now();
      elapsedRef.current += Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      const left = Math.max(0, seconds - elapsedRef.current);
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onClose();
      }
    }, 500);
    return () => clearInterval(id);
  }, [seconds, paused, onClose]);

  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/85 px-4 py-2 backdrop-blur">
        <span className="font-mono text-sm font-semibold text-white">
          {mm}:{ss}
        </span>
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Resume rest" : "Pause rest"}
          className="text-white/60 transition hover:text-white"
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <button
          onClick={onClose}
          aria-label="Skip rest"
          className="text-white/40 transition hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}