import { motion, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import type { Colorway, Product } from "../data/products";
import { usePendulum } from "../hooks/usePendulum";
import type { DetailLayout } from "../lib/layout";
import { clamp, GRAIN_URL, WASH_URL } from "../lib/util";

/* Tag artboard in px at scale 1 (the detail layout scales it down on phones). */
const TAG_W = 80;
const TAG_H = 136;
const HOLE_Y = 14;
const CUT = "polygon(16% 0, 84% 0, 100% 8%, 100% 100%, 0 100%, 0 8%)";
const HOLE = `radial-gradient(circle at 50% ${HOLE_Y}px, transparent 3.6px, #000 4.3px)`;
const PINKED = (() => {
  const teeth = 14;
  const pts = ["0% 0%", "100% 0%"];
  for (let i = 0; i <= teeth * 2; i++) pts.push(`${(100 - (50 * i) / teeth).toFixed(2)}% ${i % 2 ? "92%" : "100%"}`);
  return `polygon(${pts.join(", ")})`;
})();
const barsFor = (code: string) =>
  Array.from({ length: 16 }, (_, i) => 1 + ((code.charCodeAt(i % code.length) * (i + 7)) % 3));

export const tagX = (D: DetailLayout, i: number) => D.tagX0 + i * D.tagGap;
const tagLength = (D: DetailLayout, i: number) => D.tagLengths[i % D.tagLengths.length];

interface GroupProps {
  product: Product;
  colorId: string;
  D: DetailLayout;
  delay: number;
  onSelect(colorId: string): void;
}

/** Colourway tags as a radio group: arrow keys move the selection, and selection follows focus. */
export function SwatchTagGroup({ product, colorId, D, delay, onSelect }: GroupProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const colors = product.colors;
  const sel = Math.max(0, colors.findIndex((c) => c.id === colorId));

  const onKeyDown = (e: RKeyboardEvent) => {
    const last = colors.length - 1;
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    const to =
      e.key === "Home" ? 0 : e.key === "End" ? last : step === undefined ? -1 : (sel + step + colors.length) % colors.length;
    if (to < 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(colors[to].id);
    refs.current[to]?.focus({ preventScroll: true });
  };

  return (
    <div role="radiogroup" aria-label={`Colour for ${product.title}`} onKeyDown={onKeyDown}>
      {colors.map((c, i) => (
        <SwatchTag
          key={c.id}
          color={c}
          index={i}
          selected={i === sel}
          x={tagX(D, i)}
          top={D.barY}
          length={tagLength(D, i)}
          scale={D.tagScale}
          delay={delay + i * 0.09}
          onSelect={() => onSelect(c.id)}
          buttonRef={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

/** The cord's loop around the rail, drawn above the rail so each tag reads as tied on. */
export function TagLoops({ D, count }: { D: DetailLayout; count: number }) {
  const railH = 14 * D.u;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute rounded-full border-[1.5px] border-ink"
          style={{ left: tagX(D, i) - 4, top: D.barY - railH / 2 - 2.5, width: 8, height: railH + 5 }}
        />
      ))}
    </>
  );
}

interface TagProps {
  color: Colorway;
  index: number;
  selected: boolean;
  x: number;
  top: number;
  length: number;
  scale: number;
  delay: number;
  onSelect(): void;
  buttonRef(el: HTMLButtonElement | null): void;
}

function SwatchTag({ color, index, selected, x, top, length, scale: s, delay, onSelect, buttonRef }: TagProps) {
  // Each tag is its own pendulum. A shorter cord swings faster (ω² ∝ g / L) and settles slowly, like card on string.
  const { angle, velocity, kick, nudge } = usePendulum({
    stiffness: 1900 / length,
    damping: 0.9,
    max: 32,
    idle: 1.1,
    phase: index * 2.1,
  });
  const hinge = useTransform(velocity, (v) => clamp(-v * 0.07, -12, 12)); // the card lags the cord at the eyelet
  const poke = useRef(0);
  const was = useRef(selected);
  const alt = index % 2 ? 1 : -1;

  // Swing in when the tags first appear.
  useEffect(() => {
    const t = window.setTimeout(() => kick(110 * alt), delay * 1000);
    return () => window.clearTimeout(t);
  }, [kick, delay, alt]);

  // Selecting (click, tap or arrow key) swings the tag away from the side it was poked.
  useEffect(() => {
    if (selected && !was.current) kick(poke.current || 90 * alt);
    was.current = selected;
    poke.current = 0;
  }, [selected, kick, alt]);

  const onPointerDown = (e: RPointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    poke.current = e.clientX < r.left + r.width / 2 ? -90 : 90; // pushed from the left, swings right
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (e.pointerType === "mouse") nudge(-clamp(e.movementX, -30, 30) * 0.35);
  };
  const onClick = () => {
    if (!selected) return onSelect();
    kick(poke.current || 90 * alt);
    poke.current = 0;
  };

  const w = TAG_W * s;
  const h = TAG_H * s;
  const eyelet = length + HOLE_Y * s;

  return (
    <motion.div
      className="absolute"
      style={{ left: x, top, zIndex: selected ? 3 : 1 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {/* zero-size pivot on the rail */}
      <motion.div className="absolute left-0 top-0" style={{ rotate: angle, originX: 0, originY: 0 }}>
        <motion.div
          className="absolute"
          style={{
            left: -w / 2,
            top: length,
            width: w,
            height: h,
            rotate: hinge,
            originX: 0.5,
            originY: HOLE_Y / TAG_H,
            filter: "drop-shadow(0 8px 8px rgb(30 30 25 / 0.14)) drop-shadow(0 1px 1px rgb(30 30 25 / 0.16))",
          }}
          initial={false}
          animate={{ scale: selected ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <button
            ref={buttonRef}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.name}
            tabIndex={selected ? 0 : -1}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onClick={onClick}
            className="pointer-events-auto relative block size-full cursor-pointer rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <TagFace color={color} selected={selected} scale={s} />
          </button>
        </motion.div>
        {/* waxed cord threaded through the eyelet, with its knot */}
        <span aria-hidden className="absolute bg-ink" style={{ left: -0.6, top: 0, width: 1.2, height: eyelet }} />
        <span aria-hidden className="absolute size-[5px] rounded-full bg-ink" style={{ left: -2.5, top: eyelet - 2.5 }} />
      </motion.div>
    </motion.div>
  );
}

function TagFace({ color, selected, scale }: { color: Colorway; selected: boolean; scale: number }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 block"
      style={{ width: TAG_W, height: TAG_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
    >
      <span className="absolute inset-0 block bg-[#f6f4ee]" style={{ clipPath: CUT, maskImage: HOLE, WebkitMaskImage: HOLE }}>
        <span className="absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: GRAIN_URL }} />
        {/* metal eyelet */}
        <span
          className="absolute size-3 rounded-full"
          style={{
            left: TAG_W / 2 - 6,
            top: HOLE_Y - 6,
            background: "radial-gradient(circle, transparent 3.5px, #7b7e83 3.6px, #eceef0 4.6px, #a6a9ad 6px)",
          }}
        />
        {/* fabric swatch with a pinked edge */}
        <span className="absolute inset-x-3 top-6 block h-12 overflow-hidden" style={{ background: color.hex, clipPath: PINKED }}>
          {color.wash && (
            <span
              className="absolute inset-0 opacity-40 mix-blend-screen"
              style={{ backgroundImage: WASH_URL, backgroundSize: "90px 90px" }}
            />
          )}
          <span
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{ backgroundImage: GRAIN_URL, backgroundSize: "60px 60px" }}
          />
          <span
            className="absolute inset-0"
            style={{ boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08), inset 0 -6px 10px rgb(0 0 0 / 0.12)" }}
          />
        </span>
        <span className="absolute inset-x-3 top-[80px] block text-[8.5px] font-bold uppercase leading-[10px] tracking-[0.08em] text-ink">
          {color.name}
        </span>
        <span className="absolute inset-x-3 top-[102px] block text-[7.5px] font-medium tabular-nums tracking-[0.12em] text-black/60">
          {color.code}
        </span>
        <span className="absolute left-3 top-[112px] flex h-[6px] items-stretch gap-px">
          {barsFor(color.code).map((b, i) => (
            <span key={i} className="bg-ink" style={{ width: b }} />
          ))}
        </span>
        <span
          className={`absolute inset-x-0 bottom-0 flex h-[15px] items-center justify-center gap-1 text-[7px] font-bold uppercase tracking-[0.2em] transition-colors ${
            selected ? "bg-ink text-white" : "border-t border-black/10 text-black/50"
          }`}
        >
          {selected && <Check size={8} strokeWidth={3} />}
          {selected ? "Selected" : "Select"}
        </span>
      </span>
    </span>
  );
}
