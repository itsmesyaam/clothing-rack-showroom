import { motion } from "framer-motion";
import { useRef, type KeyboardEvent as RKeyboardEvent } from "react";
import { FOCUS } from "./ui";

export type Side = "front" | "back";
const SIDES: Side[] = ["front", "back"];

/** Segmented control with radio semantics: arrow keys switch sides, the ink pill slides between them. */
export function FrontBackToggle({ side, onChange }: { side: Side; onChange(side: Side): void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: RKeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation(); // keep arrows from also paging garments
    const next: Side = side === "front" ? "back" : "front";
    onChange(next);
    refs.current[SIDES.indexOf(next)]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Garment view"
      onKeyDown={onKeyDown}
      className="inline-flex h-11 rounded-full border border-black/15 bg-white/50"
    >
      {SIDES.map((s, i) => {
        const on = side === s;
        return (
          <button
            key={s}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(s)}
            className={`relative h-full min-w-24 cursor-pointer rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.2em] ${FOCUS}`}
          >
            {on && (
              <motion.span
                layoutId="front-back-pill"
                className="absolute inset-1 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span className={`relative transition-colors duration-200 ${on ? "text-white" : "text-ink/70 hover:text-ink"}`}>{s}</span>
          </button>
        );
      })}
    </div>
  );
}
