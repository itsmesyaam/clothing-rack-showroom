import {
  AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion, useTransform,
  type MotionValue, type Variants,
} from "framer-motion";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import type { Colorway, Product } from "../data/products";
import { GarmentArt } from "../garment/GarmentArt";
import { usePendulum } from "../hooks/usePendulum";
import { detailLayout, type DetailLayout } from "../lib/layout";
import { clamp, EASE_IN_OUT, EASE_OUT, formatPrice, pad2 } from "../lib/util";
import { FrontBackToggle, type Side } from "./FrontBackToggle";
import { SwatchTagGroup, TagLoops } from "./SwatchTag";
import { FOCUS, RoundButton } from "./ui";

export interface DetailViewProps {
  products: Product[];
  index: number;
  color: Colorway;
  viewport: { w: number; h: number };
  /** A drawer or the menu is open on top: Escape and arrow keys belong to it. */
  covered: boolean;
  onSelectColor(colorId: string): void;
  onNavigate(index: number): void;
  onClose(): void;
  onAvailability(): void;
}

export function DetailView({
  products, index, color, viewport: { w, h }, covered, onSelectColor, onNavigate, onClose, onAvailability,
}: DetailViewProps) {
  const product = products[index];
  const n = products.length;
  const D = detailLayout(w, h, product.colors.length);
  const reduced = useReducedMotion() ?? false;
  const present = useIsPresent();
  const heading = useRef<HTMLHeadingElement>(null);
  const [side, setSide] = useState<Side>("front");
  const [nav, setNav] = useState({ index, dir: 0 });
  if (nav.index !== index) setNav({ index, dir: Math.sign(index - nav.index) });

  // The first reveal waits for the rack's camera push-in to land; later swaps are immediate.
  const reveal = nav.dir === 0 ? (reduced ? 0.1 : 0.7) : 0;
  const slide: SlideCustom = { dir: nav.dir, gw: D.gw, delay: reveal, reduced };

  const railH = 14 * D.u;
  const sideRoom = D.centerX - D.gw / 2 - 48;
  const wide = !D.compact && sideRoom >= 240;
  const infoW = D.compact ? w - 32 : 420;
  const infoLeft = D.compact ? 16 : clamp(D.centerX - infoW / 2, 16, w - infoW - 16);
  const prev = () => index > 0 && onNavigate(index - 1);
  const next = () => index < n - 1 && onNavigate(index + 1);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (covered || !present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      else if (e.key === "ArrowRight" && index < n - 1) onNavigate(index + 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [covered, present, index, n, onClose, onNavigate]);

  return (
    <motion.section
      aria-labelledby="detail-title"
      inert={!present}
      className="fixed inset-0 z-10"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <AnimatePresence custom={slide}>
        <InspectGarment key={product.id} product={product} color={color} side={side} D={D} custom={slide} />
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          key={product.id}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 15 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <SwatchTagGroup product={product} colorId={color.id} D={D} delay={reveal + 0.15} onSelect={onSelectColor} />
        </motion.div>
      </AnimatePresence>

      {/* Same position and thickness as the zoomed rack rail, so the crossfade is seamless. */}
      <motion.div
        aria-hidden
        className="chrome-bar pointer-events-none absolute rounded-full"
        style={{ left: -24, right: -24, top: D.barY - railH / 2, height: railH, zIndex: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reveal, duration: 0.25 }}
      />

      <AnimatePresence>
        <motion.div
          key={product.id}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 25 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: reveal + 0.15, duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <TagLoops D={D} count={product.colors.length} />
        </motion.div>
      </AnimatePresence>

      {wide && (
        <motion.aside
          aria-label="Garment details"
          className="absolute"
          style={{ left: 40, top: D.barY + 36, width: Math.min(260, sideRoom), zIndex: 30 }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reveal + 0.15, duration: 0.45, ease: EASE_OUT }}
        >
          <BackButton onClick={onClose} />
          <Swap as="div" k={product.id} className="mt-10">
            <ul className="space-y-2 text-[13px] leading-snug text-black/75">
              {product.details.map((d) => (
                <li key={d}>— {d}</li>
              ))}
            </ul>
          </Swap>
          <div className="mt-8">
            <Pager index={index} n={n} onPrev={prev} onNext={next} />
          </div>
        </motion.aside>
      )}

      <motion.div
        className="absolute flex flex-col items-center text-center"
        style={{ top: D.infoTop, left: infoLeft, width: infoW, zIndex: 30 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reveal + 0.1, duration: 0.45, ease: EASE_OUT }}
      >
        <p className="text-[11px] font-medium tabular-nums tracking-[0.2em] text-black/60">
          <Swap k={product.id}>{formatPrice(product.price)}</Swap>
        </p>
        <h2
          id="detail-title"
          ref={heading}
          tabIndex={-1}
          className="mt-1.5 text-[15px] font-semibold uppercase leading-snug tracking-[0.14em] outline-none md:text-base"
        >
          <Swap k={product.id}>{product.title}</Swap>
        </h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-black/60">
          <Swap k={`${product.id}:${color.id}`}>Colour — {color.name}</Swap>
        </p>
        <div className="mt-3">
          <FrontBackToggle side={side} onChange={setSide} />
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onAvailability}
          className={`mt-1 inline-flex h-11 cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] underline decoration-1 underline-offset-[6px] hover:decoration-2 ${FOCUS}`}
        >
          See availability
          <ArrowUpRight aria-hidden size={14} strokeWidth={2.2} />
        </button>
        {!wide && (
          <div className="mt-1 flex w-full items-center justify-between">
            <BackButton onClick={onClose} />
            <Pager index={index} n={n} onPrev={prev} onNext={next} />
          </div>
        )}
      </motion.div>

      <p className="sr-only" aria-live="polite">{`${product.title}, ${index + 1} of ${n}`}</p>
    </motion.section>
  );
}

/* ── garment on its hanger ── */

interface SlideCustom {
  dir: number;
  gw: number;
  delay: number;
  reduced: boolean;
}

/** Paging slides garments along the rail; the first reveal is a fade timed to the camera push-in. */
const SLIDE: Variants = {
  enter: ({ dir, gw, reduced }: SlideCustom) => ({ x: reduced ? 0 : dir * gw * 1.15, opacity: 0 }),
  center: ({ dir, delay, reduced }: SlideCustom) => ({
    x: 0,
    opacity: 1,
    transition:
      dir === 0 || reduced
        ? { x: { duration: 0 }, opacity: { delay, duration: 0.25 } }
        : { x: { type: "spring" as const, stiffness: 120, damping: 20 }, opacity: { duration: 0.3 } },
  }),
  exit: ({ dir, gw, reduced }: SlideCustom) => ({
    x: reduced ? 0 : -dir * gw * 1.15,
    opacity: 0,
    transition: { x: { duration: 0.45, ease: EASE_IN_OUT }, opacity: { duration: 0.3 } },
  }),
};

const FLIP = { type: "spring", stiffness: 60, damping: 11 } as const;

interface InspectProps {
  product: Product;
  color: Colorway;
  side: Side;
  D: DetailLayout;
  custom: SlideCustom;
}

function InspectGarment({ product, color, side, D, custom }: InspectProps) {
  const wt = product.weight;
  const x = useMotionValue(0);
  const hold = useRef(0);
  const grab = useRef<{ id: number; x0: number; moved: boolean } | null>(null);
  const maxPull = 18 - 4 * wt;

  // Sliding along the rail drags the hem behind; a held hem pulls toward the pointer.
  const { angle, velocity, kick, nudge } = usePendulum({
    stiffness: 22,
    damping: 1.3 + 1.5 * wt,
    max: 20 - 5 * wt,
    idle: 0.35 / wt,
    phase: 1.3,
    drive: () => hold.current + clamp((x.getVelocity() * 0.006) / Math.sqrt(wt), -14, 14),
  });
  const skew = useTransform(velocity, (v) => clamp(v * 0.045, -6, 6));

  // Front / back: a real 180° turn on the hook, with a spring that overshoots a touch.
  const rotY = useMotionValue(side === "back" ? 180 : 0);
  useEffect(() => {
    const target = side === "back" ? 180 : 0;
    if (rotY.get() === target) return;
    kick(side === "back" ? 40 : -40);
    const c = animate(rotY, target, custom.reduced ? { duration: 0 } : FLIP);
    return () => c.stop();
  }, [side]); // eslint-disable-line react-hooks/exhaustive-deps

  // The cloth dims as it turns edge-on. Faces also switch by opacity at 90°,
  // so the flip holds up where backface-visibility misbehaves with SVG filters.
  const light = useTransform(rotY, (r) => `brightness(${(1 - 0.3 * Math.abs(Math.sin((r * Math.PI) / 180))).toFixed(3)})`);
  const frontOn = useTransform<number, number>(rotY, (r) => (Math.cos((r * Math.PI) / 180) >= 0 ? 1 : 0));
  const backOn = useTransform(frontOn, (v) => 1 - v);

  // The garment answers a colourway change with a small swing.
  const lastColor = useRef(color.id);
  useEffect(() => {
    if (lastColor.current === color.id) return;
    lastColor.current = color.id;
    kick(22);
  }, [color.id, kick]);

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    grab.current = { id: e.pointerId, x0: e.clientX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: RPointerEvent) => {
    const g = grab.current;
    if (g && g.id === e.pointerId) {
      if (Math.abs(e.clientX - g.x0) > 4) g.moved = true;
      const lever = Math.max(80, e.clientY - D.barY); // distance from the hook
      hold.current = clamp((-Math.atan2(e.clientX - g.x0, lever) * 180) / Math.PI, -maxPull, maxPull);
    } else if (e.pointerType === "mouse") {
      const depth = clamp((e.clientY - D.barY) / (D.gh * 0.9), 0, 1); // brushing near the hem swings more
      nudge(-clamp(e.movementX, -40, 40) * 0.14 * (0.25 + 0.75 * depth));
    }
  };
  const release = (e: RPointerEvent) => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    grab.current = null;
    hold.current = 0; // let go of the hem
    if (!g.moved) kick(e.clientX < D.centerX ? -60 : 60);
  };

  return (
    <motion.div
      custom={custom}
      variants={SLIDE}
      initial="enter"
      animate="center"
      exit="exit"
      role="img"
      aria-label={`${product.title} in ${color.name}, ${side} view`}
      className="absolute"
      style={{ x, left: D.centerX - D.gw / 2, top: D.garmentTop, width: D.gw, height: D.gh, zIndex: 10 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ rotate: angle, originX: 0.5, originY: 0.035, willChange: "transform" }}
      >
        <motion.div className="size-full" style={{ skewX: skew, originX: 0.5, originY: 0.035 }}>
          <motion.div
            className="relative size-full"
            style={{ rotateY: rotY, transformPerspective: 1100, transformStyle: "preserve-3d" }}
          >
            <Face on={frontOn} light={light}>
              <Art product={product} color={color} side="front" />
            </Face>
            <Face on={backOn} light={light} back>
              <Art product={product} color={color} side="back" />
            </Face>
          </motion.div>
        </motion.div>
        <div
          aria-hidden
          className="pointer-events-auto absolute left-[16%] top-[15%] h-[82%] w-[68%] cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
        />
      </motion.div>
    </motion.div>
  );
}

function Face({ on, light, back, children }: { on: MotionValue<number>; light: MotionValue<string>; back?: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: on, rotateY: back ? 180 : 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      <motion.div className="size-full" style={{ filter: light }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Vector garments animate their own fills; photo cutouts crossfade between colourways. */
function Art({ product, color, side }: { product: Product; color: Colorway; side: Side }) {
  const key = product.images?.[color.id] ? color.id : "vector";
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={key}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
      >
        <GarmentArt product={product} color={color} side={side} shadow className="block size-full" />
      </motion.div>
    </AnimatePresence>
  );
}

/* ── small pieces ── */

function Swap({ k, as, className = "", children }: { k: string; as?: "div"; className?: string; children: ReactNode }) {
  const m = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.16 },
  };
  return (
    <AnimatePresence mode="wait" initial={false}>
      {as === "div" ? (
        <motion.div key={k} className={className} {...m}>
          {children}
        </motion.div>
      ) : (
        <motion.span key={k} className={`block ${className}`} {...m}>
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function BackButton({ onClick }: { onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-ml-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-60 ${FOCUS}`}
    >
      <ArrowLeft aria-hidden size={16} />
      Back to rack
    </button>
  );
}

function Pager({ index, n, onPrev, onNext }: { index: number; n: number; onPrev(): void; onNext(): void }) {
  return (
    <div className="flex items-center gap-1">
      <RoundButton label="Previous garment" disabled={index === 0} onClick={onPrev}>
        <ChevronLeft aria-hidden size={18} />
      </RoundButton>
      <span aria-hidden className="w-16 text-center text-[11px] font-medium tabular-nums tracking-[0.2em]">
        {pad2(index + 1)}/{pad2(n)}
      </span>
      <RoundButton label="Next garment" disabled={index === n - 1} onClick={onNext}>
        <ChevronRight aria-hidden size={18} />
      </RoundButton>
    </div>
  );
}
