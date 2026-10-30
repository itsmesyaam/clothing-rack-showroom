import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

/** Infinite neon ticker. Pauses on hover and has a pause control; it starts paused when reduced motion is on. */
export function Marquee({ items }: { items: readonly string[] }) {
  const reduced = useReducedMotion() ?? false;
  const [paused, setPaused] = useState(reduced);
  const run = Array.from({ length: 6 }, () => items).flat();

  const copy = (
    <div className="flex shrink-0 items-center">
      {run.map((t, i) => (
        <span key={i} className="flex shrink-0 items-center gap-6 pr-6 text-[13px] font-black uppercase italic leading-none tracking-[0.06em]">
          {t}
          <span className="size-1.5 rounded-full bg-ink" />
        </span>
      ))}
    </div>
  );

  return (
    <footer className="group fixed inset-x-0 bottom-0 z-30 flex h-9 items-center overflow-hidden border-t border-ink bg-neon text-ink">
      <p className="sr-only">{items.join(". ")}</p>
      <div
        aria-hidden
        className={`marquee-track flex w-max ${paused ? "[animation-play-state:paused]" : ""} group-hover:[animation-play-state:paused]`}
      >
        {copy}
        {copy}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play ticker" : "Pause ticker"}
        className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center border-l border-ink bg-neon transition-colors hover:bg-ink hover:text-neon focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink"
      >
        {paused ? <Play aria-hidden size={14} fill="currentColor" /> : <Pause aria-hidden size={14} fill="currentColor" />}
      </button>
    </footer>
  );
}
