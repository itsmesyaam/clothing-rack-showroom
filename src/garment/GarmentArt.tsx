import { motion } from "framer-motion";
import { memo, useId } from "react";
import { BRAND } from "../config/brand";
import type { Colorway, Product } from "../data/products";
import { luminance, shade, tint } from "../lib/util";
import { Print } from "./Prints";
import {
  HANGER_D, HOLES, HOOD_BACK, HOOD_RIM, JERSEY_STRIPES, POCKET, POCKET_STITCH, SHAPES, type GarmentShape,
} from "./shapes";

type Side = "front" | "back";
const T = { duration: 0.55, ease: "easeInOut" } as const;
const SHADOW = "drop-shadow(0 18px 18px rgb(30 30 25 / 0.16)) drop-shadow(0 3px 4px rgb(30 30 25 / 0.14))";

interface Props { product: Product; color: Colorway; side?: Side; shadow?: boolean; className?: string }

/**
 * Layering (front): inside of back panel → woven label → wooden hanger → front panel → texture/shading/prints → trims.
 * So the hanger shows through the neckline and between tank straps like a real hung garment.
 */
export const GarmentArt = memo(function GarmentArt({ product, color, side = "front", shadow, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const photo = product.images?.[color.id]?.[side];
  if (photo) {
    return <img src={photo} alt="" draggable={false} className={className} style={{ objectFit: "contain", filter: shadow ? SHADOW : undefined }} />;
  }

  const s = SHAPES[product.kind];
  const base = color.hex;
  const light = luminance(base) > 0.55;
  const inner = shade(base, light ? 0.3 : 0.5);
  const edge = shade(base, light ? 0.24 : 0.42);
  const band = shade(base, 0.07);
  const stitch = light ? "rgb(0 0 0 / 0.3)" : "rgb(255 255 255 / 0.24)";
  const front = side === "front";
  const hood = product.kind === "hoodie";
  const pp = front ? s.print.front : s.print.back;

  return (
    <svg viewBox="0 0 300 400" overflow="visible" className={className}
      style={{ filter: shadow ? SHADOW : undefined }} fontFamily="Inter, Helvetica, Arial, sans-serif" aria-hidden="true">
      <defs>
        <clipPath id={`clip-${uid}`}><path d={s.outline} /></clipPath>
      </defs>

      {front ? (
        <>
          <motion.path d={s.outline} initial={false} animate={{ fill: inner }} transition={T} />
          {hood && (
            <motion.path d={HOOD_RIM} fill="none" strokeWidth={11} strokeLinecap="round"
              initial={false} animate={{ stroke: shade(base, 0.08) }} transition={T} />
          )}
          <rect x={142} y={s.labelY} width={16} height={8.5} rx={1} fill="#141414" />
          <text x={150} y={s.labelY + 5.8} fontSize={3.3} fontWeight={800} fill="#eee" textAnchor="middle"
            textLength={12} lengthAdjust="spacingAndGlyphs">{BRAND.name}</text>
          <Hanger />
          <motion.path d={s.front} initial={false} animate={{ fill: base }} transition={T} />
        </>
      ) : (
        <>
          <Hanger mirrored />
          <motion.path d={s.outline} initial={false} animate={{ fill: base }} transition={T} />
        </>
      )}

      <g clipPath={`url(#clip-${uid})`}>
        {s.ribs.map((d) => <motion.path key={d} d={d} initial={false} animate={{ fill: band }} transition={T} />)}
        {s.ribs.map((d) => <path key={`rib-${d}`} d={d} fill="url(#ov-rib)" />)}
        {product.kind === "jersey" && (
          <motion.g fill="none" strokeWidth={6} initial={false} animate={{ stroke: color.ink }} transition={T}>
            {JERSEY_STRIPES.map((d) => <path key={d} d={d} />)}
          </motion.g>
        )}
        {hood && !front && (
          <>
            <path d={HOOD_BACK} transform="translate(0 7)" fill="#000" opacity={0.25} filter="url(#ov-fold)" />
            <motion.path d={HOOD_BACK} initial={false} animate={{ fill: shade(base, 0.03) }} transition={T} />
            <path d={HOOD_BACK} fill="none" stroke={edge} strokeWidth={1.2} opacity={0.6} />
            <path d="M150 73 L150 178" stroke={edge} strokeWidth={1} opacity={0.5} />
          </>
        )}
        {product.kind === "jersey" && <rect width={300} height={400} fill="url(#ov-mesh)" opacity={0.6} />}
        {product.kind === "longsleeve" && <rect width={300} height={400} fill="url(#ov-waffle)" />}
        <rect width={300} height={400} fill="url(#ov-shade-h)" />
        <rect width={300} height={400} fill="url(#ov-shade-v)" />
        <motion.rect width={300} height={400} filter="url(#ov-wash)" style={{ mixBlendMode: "screen" }}
          initial={false} animate={{ opacity: color.wash ? 0.34 : 0 }} transition={T} />
        <rect width={300} height={400} filter="url(#ov-grain)" opacity={0.22} style={{ mixBlendMode: "overlay" }} />
        <g fill="none" strokeLinecap="round" filter="url(#ov-fold)">
          {s.folds.map((f, i) => <path key={i} d={f.d} stroke={f.light ? "#fff" : "#000"} strokeWidth={f.w} opacity={f.o} />)}
        </g>
        <g transform={`translate(0 ${pp.y}) translate(150 170) scale(${pp.s}) translate(-150 -170)`}>
          <Print kind={front ? product.print.front : product.print.back} side={side} ink={color.ink}
            outline={shade(base, 0.25)} uid={uid} number={product.number ?? "00"} />
        </g>
      </g>

      <Collar s={s} front={front} base={base} ink={color.ink} edge={edge} stitch={stitch} />
      <g fill="none" stroke={stitch} strokeWidth={0.85} strokeDasharray="2.2 1.8">
        {s.stitches.map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="none" stroke={edge} strokeWidth={1} opacity={0.4}>
        {s.seams.map((d) => <path key={d} d={d} />)}
      </g>
      {hood && front && <HoodieFront base={base} ink={color.ink} edge={edge} stitch={stitch} />}
      {product.distressed && <Distress base={base} inner={inner} front={front} />}
      <motion.path d={s.outline} fill="none" strokeWidth={1.1} opacity={0.6} initial={false} animate={{ stroke: edge }} transition={T} />
    </svg>
  );
});

function Hanger({ mirrored }: { mirrored?: boolean }) {
  return (
    <g>
      {/* Chrome hook — the rail (drawn above garments) hides its middle, so it reads as hooked over the bar */}
      <g fill="none" strokeLinecap="round" transform={mirrored ? "translate(300 0) scale(-1 1)" : undefined}>
        <path d="M150 58 L150 20 C150 7 143 0 134 0 C125 0 119 7 120 15" stroke="#7f8287" strokeWidth={3.6} />
        <path d="M149 56 L149 20 C149 8 142.5 1.2 134 1.2" stroke="#fbfbfc" strokeWidth={1.1} opacity={0.85} />
      </g>
      <path d={HANGER_D} fill="url(#ov-wood)" />
      <path d={HANGER_D} fill="url(#ov-wood-shade)" />
      <path d="M72 91 Q104 72 140 62 M160 62 Q196 72 228 91" fill="none" stroke="#6e4520" strokeWidth={0.6} opacity={0.35} />
      <rect x={145} y={50} width={10} height={9} rx={2} fill="url(#ov-nut)" />
    </g>
  );
}

function Collar({ s, front, base, ink, edge, stitch }: { s: GarmentShape; front: boolean; base: string; ink: string; edge: string; stitch: string }) {
  if (!front && s.collar === "hood") return null;
  const d = front ? s.neckFront : s.neckBack;
  const w = s.collar === "hood" ? 11 : s.collar === "scoop" ? 4.5 : 7;
  const color = s.collar === "v" ? ink : shade(base, s.collar === "hood" ? 0.03 : 0.07);
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={edge} strokeWidth={w + 1.6} opacity={0.5} />
      <motion.path d={d} strokeWidth={w} initial={false} animate={{ stroke: color }} transition={T} />
      <path d={d} transform={`translate(0 ${w / 2 + 2})`} stroke={stitch} strokeWidth={0.8} strokeDasharray="2 1.8" />
      {s.bindings.map((b) => (
        <g key={b}>
          <path d={b} stroke={edge} strokeWidth={6} opacity={0.45} />
          <motion.path d={b} strokeWidth={4.5} initial={false} animate={{ stroke: color }} transition={T} />
        </g>
      ))}
    </g>
  );
}

function HoodieFront({ base, ink, edge, stitch }: { base: string; ink: string; edge: string; stitch: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={POCKET} stroke={edge} strokeWidth={1.1} opacity={0.55} />
      <path d={POCKET_STITCH} stroke={stitch} strokeWidth={0.85} strokeDasharray="2.2 1.8" />
      <path d="M104 270 L84 304 M196 270 L216 304" stroke="#000" strokeOpacity={0.2} strokeWidth={6} filter="url(#ov-soft)" />
      <path d="M102 266 L80 304 M198 266 L220 304" stroke={shade(base, 0.35)} strokeWidth={2.2} />
      <motion.g strokeWidth={3.2} initial={false} animate={{ stroke: ink }} transition={T}>
        <path d="M139 93 C138 112 136 136 135 170" />
        <path d="M161 93 C163 116 166 140 167 162" />
      </motion.g>
      <rect x={132.6} y={168} width={4.8} height={11} rx={1.4} fill="#c9c9c4" stroke="#8d8d88" strokeWidth={0.5} />
      <rect x={164.6} y={160} width={4.8} height={11} rx={1.4} fill="#c9c9c4" stroke="#8d8d88" strokeWidth={0.5} />
      <circle cx={139} cy={92} r={3.2} fill="#d4d4cf" stroke="#86867f" strokeWidth={1} />
      <circle cx={161} cy={92} r={3.2} fill="#d4d4cf" stroke="#86867f" strokeWidth={1} />
    </g>
  );
}

/** Rips + frayed raw hem. Hem maths matches the tank silhouette (the only distressed kind). */
function Distress({ base, inner, front }: { base: string; inner: string; front: boolean }) {
  const threads = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const x = 230 - 160 * t;
    const y = 352 + 20 * t * (1 - t);
    const len = 2 + (Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1) * 6;
    const lean = Math.sin(i * 7.3) * 1.6;
    return `M${x.toFixed(1)} ${(y - 1).toFixed(1)} q ${(lean / 2).toFixed(1)} ${(len / 2).toFixed(1)} ${lean.toFixed(1)} ${len.toFixed(1)}`;
  });
  return (
    <g>
      {(front ? HOLES : HOLES.slice(1, 3)).map((h) => (
        <g key={h.d}>
          <path d={h.d} fill={inner} stroke={tint(base, 0.18)} strokeWidth={1.3} strokeDasharray="1.4 1.1" />
          {h.t && <path d={h.t} fill="none" stroke={tint(base, 0.12)} strokeWidth={0.8} />}
        </g>
      ))}
      <g fill="none" stroke={base} strokeWidth={0.9} strokeLinecap="round" opacity={0.9}>
        {threads.map((d) => <path key={d} d={d} />)}
      </g>
    </g>
  );
}
