import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from "react";
import type { Colorway, Product } from "../data/products";
import { GarmentArt } from "../garment/GarmentArt";
import { usePendulum } from "../hooks/usePendulum";
import type { RackLayout } from "../lib/layout";
import { clamp, EASE_OUT, formatPrice } from "../lib/util";
import { FOCUS } from "./ui";

/** Lets the rack brush the cursor across garments without re-rendering them. */
export interface Brush {
  centerX(): number;
  nudge(deg: number): void;
}

interface Props {
  product: Product;
  color: Colorway;
  index: number;
  count: number;
  layout: RackLayout;
  rackX: MotionValue<number>;
  activeIndex: number;
  isCentered: boolean;
  openIndex: number | null;
  brushes: Map<number, Brush>;
  buttonRef(el: HTMLButtonElement | null): void;
  onHoverStart(i: number, e: RPointerEvent): void;
  onHoverEnd(): void;
  onClick(i: number, e: RMouseEvent): void;
  onAvailability(i: number): void;
}

export function HangingGarment({
  product, color, index, count, layout: L, rackX, activeIndex, isCentered, openIndex,
  brushes, buttonRef, onHoverStart, onHoverEnd, onClick, onAvailability,
}: Props) {
  const d = index - activeIndex;
  const isActive = d === 0;
  const inspecting = openIndex !== null;
  const wt = product.weight;

  // Neighbours part around the active garment; while the camera pushes in they clear out further.
  const spreadTarget = isActive ? 0 : Math.sign(d) * L.G * (inspecting ? 2.6 : 1);
  const spread = useSpring(spreadTarget, { stiffness: 210, damping: 26 });
  useEffect(() => {
    spread.set(spreadTarget);
  }, [spread, spreadTarget]);

  const left = useTransform([rackX, spread], ([r, s]: number[]) => L.w / 2 - L.gw / 2 + index * L.S + r + s);

  // Sliding the hanger along the rail drags the cloth behind it; heavier fleece leans less and settles sooner.
  const { angle, velocity, nudge } = usePendulum({
    stiffness: 30,
    damping: 1.6 + 1.7 * wt,
    max: 18 - 5 * wt,
    idle: 0.45 / wt,
    phase: index * 1.7,
    drive: () => clamp(((rackX.getVelocity() + spread.getVelocity()) * 0.0085) / Math.sqrt(wt), -13, 13),
  });
  const skew = useTransform(velocity, (v) => clamp(v * 0.05, -7, 7)); // hem trails the swing
  const shadowX = useTransform(angle, (a) => -Math.sin((a * Math.PI) / 180) * L.gh * 0.85);

  useEffect(() => {
    brushes.set(index, { centerX: () => left.get() + L.gw / 2, nudge: (deg) => nudge(deg / wt) });
    return () => {
      brushes.delete(index);
    };
  }, [brushes, index, left, L.gw, nudge, wt]);

  const captionW = Math.max(L.gw, 320);
  const showCaption = isActive && !inspecting;

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ x: left, width: L.gw, zIndex: 100 - Math.abs(d) * 2 }}
      initial={false}
      animate={{ opacity: inspecting && !isActive ? 0 : 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* contact shadow on the floor, drifting with the hem */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: L.gw * 0.15,
          width: L.gw * 0.7,
          top: L.floorY - 14,
          height: 28,
          x: shadowX,
          background: "radial-gradient(closest-side, rgb(0 0 0 / 0.09), rgb(0 0 0 / 0))",
        }}
      />

      {/* pendulum: pivots on the hook, which sits on the rail centre (y = 14 of 400) */}
      <motion.div
        className="pointer-events-none absolute left-0"
        style={{
          top: L.garmentTop, width: L.gw, height: L.gh,
          rotate: angle, originX: 0.5, originY: 0.035, willChange: "transform",
        }}
      >
        <motion.div className="size-full" style={{ skewX: skew, originX: 0.5, originY: 0.035 }}>
          <GarmentArt product={product} color={color} shadow className="block size-full" />
        </motion.div>
        <button
          ref={buttonRef}
          type="button"
          tabIndex={isCentered ? 0 : -1}
          aria-label={`${product.title}, ${color.name}, ${formatPrice(product.price)}. ${index + 1} of ${count}. Open`}
          className="pointer-events-auto absolute left-[18%] top-[16%] h-[82%] w-[64%] cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ink"
          onPointerEnter={(e) => onHoverStart(index, e)}
          onPointerLeave={onHoverEnd}
          onClick={(e) => onClick(index, e)}
        />
      </motion.div>

      {/* caption under the active garment */}
      <motion.div
        inert={!showCaption}
        className="absolute text-center"
        style={{ top: L.captionTop, left: (L.gw - captionW) / 2, width: captionW }}
        initial={false}
        animate={showCaption ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        onPointerEnter={(e) => onHoverStart(index, e)}
        onPointerLeave={onHoverEnd}
      >
        <p className="text-[11px] font-medium tabular-nums tracking-[0.2em] text-black/60">{formatPrice(product.price)}</p>
        <h2 className="mt-1.5 text-[13px] font-semibold uppercase leading-snug tracking-[0.14em] md:text-sm">{product.title}</h2>
        <button
          type="button"
          onClick={() => onAvailability(index)}
          className={`mt-3 inline-flex h-11 cursor-pointer items-center rounded-full border border-ink px-6 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-white ${FOCUS}`}
        >
          See availability
        </button>
      </motion.div>
    </motion.div>
  );
}
