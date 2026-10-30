import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect, useImperativeHandle, useLayoutEffect, useRef, useState,
  type KeyboardEvent as RKeyboardEvent, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type Ref,
} from "react";
import type { Colorway, Product } from "../data/products";
import { detailLayout, rackLayout } from "../lib/layout";
import { clamp, EASE_IN_OUT, pad2 } from "../lib/util";
import { HangingGarment, type Brush } from "./HangingGarment";
import { RoundButton } from "./ui";

export interface RackHandle {
  go(index: number): void;
}

interface Props {
  ref?: Ref<RackHandle>;
  products: Product[];
  colorOf(p: Product): Colorway;
  openIndex: number | null;
  viewport: { w: number; h: number };
  onOpen(index: number): void;
  onAvailability(index: number): void;
}

type Controls = ReturnType<typeof animate>;
const CAM_IN = { duration: 0.9, ease: EASE_IN_OUT };
const CAM_OUT = { duration: 0.85, ease: EASE_IN_OUT };

export function Rack({ ref, products, colorOf, openIndex, viewport: { w, h }, onOpen, onAvailability }: Props) {
  const L = rackLayout(w, h);
  const n = products.length;
  const minX = -(n - 1) * L.S;
  const open = openIndex !== null;
  const reduced = useReducedMotion() ?? false;

  // rackX = offset of the whole rail (0 → first garment centred). cam* = the camera that pushes into a garment.
  const rackX = useMotionValue(reduced ? 0 : w * 0.9);
  const camS = useMotionValue(1);
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const stageAlpha = useMotionValue(1);

  const [centered, setCentered] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [brushes] = useState(() => new Map<number, Brush>());
  const centeredRef = useRef(0);
  const anim = useRef<Controls | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimer = useRef(0);
  const drag = useRef({ id: -1, startX: 0, start: 0, active: false });
  const justDragged = useRef(false);
  const pointerType = useRef("mouse");
  const prevOpen = useRef<number | null>(null);
  const geo = useRef({ S: L.S, minX, open });
  useLayoutEffect(() => {
    geo.current = { S: L.S, minX, open };
  });

  const active = openIndex ?? hovered ?? centered;
  const rail = 14 * L.u;

  const go = (i: number, focus = false) => {
    const idx = clamp(i, 0, n - 1);
    anim.current?.stop();
    setHovered(null);
    anim.current = animate(rackX, -idx * L.S, reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 });
    if (focus) requestAnimationFrame(() => buttons.current[idx]?.focus({ preventScroll: true }));
  };
  useImperativeHandle(ref, () => ({ go: (i: number) => go(i) }));

  /** Release with momentum, then snap to the nearest hanger. */
  const settle = (velocity: number) => {
    const idx = clamp(Math.round(-(rackX.get() + velocity * 0.22) / L.S), 0, n - 1);
    anim.current?.stop();
    anim.current = animate(rackX, -idx * L.S, { type: "spring", stiffness: 160, damping: 26, velocity });
  };
  const rubber = (v: number) => (v > 0 ? v * 0.35 : v < minX ? minX + (v - minX) * 0.35 : v);

  useMotionValueEvent(rackX, "change", (v) => {
    const c = clamp(Math.round(-v / L.S), 0, n - 1);
    if (c !== centeredRef.current) {
      centeredRef.current = c;
      setCentered(c);
    }
  });

  // Intro: the rail slides in from the right, so every hanger swings into place.
  useEffect(() => {
    if (reduced) return;
    const c = animate(rackX, 0, { type: "spring", stiffness: 38, damping: 13, delay: 0.25 });
    anim.current = c;
    return () => c.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the centred garment centred when spacing changes on resize.
  const lastS = useRef(L.S);
  useEffect(() => {
    if (lastS.current === L.S) return;
    lastS.current = L.S;
    if (geo.current.open) return; // the camera effect re-parks it
    anim.current?.stop();
    rackX.jump(-centeredRef.current * L.S);
  }, [L.S, rackX]);

  // Wheel / trackpad: smooth follow, then snap once the gesture pauses.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let target = 0;
    let last = 0;
    let timer = 0;
    const onWheel = (e: WheelEvent) => {
      const g = geo.current;
      if (g.open) return;
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta = raw * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerWidth : 1);
      const now = performance.now();
      if (now - last > 220) target = rackX.get();
      last = now;
      target = clamp(target - delta, g.minX - g.S * 0.25, g.S * 0.25);
      anim.current?.stop();
      anim.current = animate(rackX, target, { type: "spring", stiffness: 260, damping: 34 });
      setHovered(null);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        target = clamp(Math.round(target / g.S) * g.S, g.minX, 0);
        anim.current?.stop();
        anim.current = animate(rackX, target, { type: "spring", stiffness: 150, damping: 24, velocity: rackX.getVelocity() });
      }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [rackX]);

  // Camera: push into the clicked garment so it lands exactly where the detail view draws it.
  useEffect(() => {
    const prev = prevOpen.current;
    prevOpen.current = openIndex;
    const runs: Controls[] = [];
    let live = true;

    const frame = (i: number, cx: number) => {
      const D = detailLayout(w, h, products[i].colors.length);
      const k = D.gh / L.gh;
      return { k, x: D.centerX - k * cx, y: D.barY - k * L.barY };
    };
    // While hidden, re-centre the rail on garment i so zooming back out starts from the middle.
    const park = (i: number) => {
      rackX.jump(-i * L.S);
      const f = frame(i, w / 2);
      camS.jump(f.k);
      camX.jump(f.x);
      camY.jump(f.y);
      stageAlpha.jump(0);
    };

    if (openIndex !== null && prev === null) {
      anim.current?.stop();
      setHovered(null);
      const cx = brushes.get(openIndex)?.centerX() ?? w / 2 + openIndex * L.S + rackX.get();
      const f = frame(openIndex, cx);
      if (reduced) {
        runs.push(animate(stageAlpha, 0, { duration: 0.25 }));
      } else {
        runs.push(
          animate(camS, f.k, CAM_IN),
          animate(camX, f.x, CAM_IN),
          animate(camY, f.y, CAM_IN),
          animate(stageAlpha, 0, { duration: 0.3, delay: 0.6 }),
        );
      }
      runs[runs.length - 1].then(() => {
        if (live) park(openIndex);
      });
    } else if (openIndex !== null) {
      park(openIndex); // navigated or resized while inspecting
    } else if (prev !== null) {
      runs.push(animate(stageAlpha, 1, { duration: 0.35 }));
      if (reduced) {
        camS.jump(1);
        camX.jump(0);
        camY.jump(0);
      } else {
        runs.push(animate(camS, 1, CAM_OUT), animate(camX, 0, CAM_OUT), animate(camY, 0, CAM_OUT));
      }
      buttons.current[prev]?.focus({ preventScroll: true });
    } else if (camS.get() !== 1 || stageAlpha.get() !== 1) {
      camS.jump(1);
      camX.jump(0);
      camY.jump(0);
      stageAlpha.jump(1);
    }

    return () => {
      live = false;
      runs.forEach((r) => r.stop());
    };
  }, [openIndex, w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── pointer: drag the rail, brush the cloth ── */
  const brush = (e: RPointerEvent) => {
    const mx = clamp(e.movementX, -40, 40);
    const rel = e.clientY - L.barY;
    const depth = L.gh * 0.85;
    if (!mx || rel < 0 || rel > depth) return;
    const reach = L.gw * 0.42;
    const torque = 0.25 + (0.75 * rel) / depth; // pushing near the hem swings more
    brushes.forEach((b) => {
      const dx = Math.abs(e.clientX - b.centerX());
      if (dx < reach) b.nudge(-mx * 0.16 * (1 - dx / reach) * torque);
    });
  };

  const onPointerDown = (e: RPointerEvent) => {
    pointerType.current = e.pointerType;
    justDragged.current = false;
    if (open || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { id: e.pointerId, startX: e.clientX, start: rackX.get(), active: false };
  };

  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (d.id === e.pointerId) {
      if (!d.active && Math.abs(e.clientX - d.startX) > 6) {
        anim.current?.stop();
        Object.assign(d, { active: true, start: rackX.get(), startX: e.clientX });
        setDragging(true);
        setHovered(null);
        stage.current?.setPointerCapture(e.pointerId);
      }
      if (d.active) {
        rackX.set(rubber(d.start + e.clientX - d.startX));
        return;
      }
    }
    if (e.pointerType === "mouse" && !open) brush(e);
  };

  const endDrag = (e: RPointerEvent) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = -1;
    if (!d.active) return;
    d.active = false;
    justDragged.current = true;
    setDragging(false);
    settle(rackX.getVelocity());
  };

  const onHoverStart = (i: number, e: RPointerEvent) => {
    if (e.pointerType !== "mouse" || drag.current.active || open) return;
    window.clearTimeout(hoverTimer.current);
    setHovered(i);
  };
  const onHoverEnd = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHovered(null), 260);
  };

  // Touch: first tap centres a garment, second tap opens it. Mouse and keyboard open directly.
  const onGarmentClick = (i: number, e: RMouseEvent) => {
    if (e.detail !== 0 && pointerType.current !== "mouse" && i !== centeredRef.current) go(i);
    else onOpen(i);
  };

  const onKeyDown = (e: RKeyboardEvent) => {
    if (open) return;
    const c = centeredRef.current;
    const to = ({ ArrowRight: c + 1, ArrowLeft: c - 1, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to, true);
  };

  return (
    <div
      ref={stage}
      inert={open}
      className={`no-select fixed inset-0 touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHovered(null)}
      onClickCapture={(e) => {
        if (!justDragged.current) return;
        justDragged.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <section aria-roledescription="carousel" aria-label="Clothing rack" className="absolute inset-0" onKeyDown={onKeyDown}>
        <motion.div
          className="absolute inset-0"
          style={{ scale: camS, x: camX, y: camY, opacity: stageAlpha, originX: 0, originY: 0 }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: -w, width: 3 * w, top: L.floorY - 36, height: 72,
              background: "radial-gradient(closest-side, rgb(0 0 0 / 0.07), rgb(0 0 0 / 0))",
            }}
          />
          {products.map((p, i) => (
            <HangingGarment
              key={p.id}
              product={p}
              color={colorOf(p)}
              index={i}
              count={n}
              layout={L}
              rackX={rackX}
              activeIndex={active}
              isCentered={i === centered}
              openIndex={openIndex}
              brushes={brushes}
              buttonRef={(el) => {
                buttons.current[i] = el;
              }}
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
              onClick={onGarmentClick}
              onAvailability={onAvailability}
            />
          ))}
          {/* the rail sits above the garments so it hides the middle of each hook */}
          <div
            aria-hidden
            className="chrome-bar pointer-events-none absolute rounded-full"
            style={{ left: -w, width: 3 * w, top: L.barY - rail / 2, height: rail, zIndex: 300 }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-[52px] flex items-center justify-center gap-6 px-4 sm:justify-between md:px-8"
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
        >
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.2em] text-black/60 sm:block">
            Drag, scroll or use arrow keys
          </p>
          <div className="flex items-center gap-1">
            <RoundButton label="Previous garment" disabled={centered === 0} onClick={() => go(centered - 1)}>
              <ChevronLeft aria-hidden size={18} />
            </RoundButton>
            <span aria-hidden className="w-16 text-center text-[11px] font-medium tabular-nums tracking-[0.2em]">
              {pad2(centered + 1)}/{pad2(n)}
            </span>
            <RoundButton label="Next garment" disabled={centered === n - 1} onClick={() => go(centered + 1)}>
              <ChevronRight aria-hidden size={18} />
            </RoundButton>
          </div>
        </motion.div>

        <p className="sr-only" aria-live="polite">{`${products[centered].title}, ${centered + 1} of ${n}`}</p>
      </section>
    </div>
  );
}
