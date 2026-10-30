import { motion } from "framer-motion";
import { BRAND } from "../config/brand";
import type { PrintKind } from "../data/products";

interface PrintProps { kind: PrintKind; side: "front" | "back"; ink: string; outline: string; uid: string; number: string }

/** Prints are authored around x=150; the parent group positions/scales them per garment. */
export function Print({ kind, side, ink, outline, uid, number }: PrintProps) {
  if (kind === "none") return null;
  return (
    <motion.g initial={false} animate={{ fill: ink, color: ink }} transition={{ duration: 0.5 }}>
      {kind === "painted-logo" && <PaintedLogo />}
      {kind === "chest-mark" && <ChestMark />}
      {kind === "crest" && <Crest uid={uid} />}
      {kind === "back-stack" && <BackStack />}
      {kind === "jersey-number" && <JerseyNumber side={side} number={number} outline={outline} />}
    </motion.g>
  );
}

const DRIPS: [number, number][] = [[-50, 12], [-18, 22], [14, 9], [44, 17], [62, 7]];
const DOTS: [number, number, number][] = [[-70, -24, 2.4], [74, -16, 1.6], [-62, 30, 1.8], [56, 36, 2.6], [82, 26, 1.2], [-82, 6, 1.4]];

function PaintedLogo() {
  return (
    <g transform="translate(150 168) rotate(-7)" filter="url(#ov-paint)">
      <path d="M-76 13 C-44 7 -14 19 18 12 C42 7 60 14 78 9" fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" opacity={0.92} />
      <text y={1} textAnchor="middle" fontSize={31} fontWeight={900} fontStyle="italic" textLength={150} lengthAdjust="spacingAndGlyphs">
        {BRAND.name}
      </text>
      {DRIPS.map(([x, h]) => (
        <g key={x}>
          <rect x={x - 1.7} y={13} width={3.4} height={h} rx={1.7} />
          <circle cx={x} cy={13 + h} r={2.4} />
        </g>
      ))}
      {DOTS.map(([x, y, r]) => <circle key={`${x}:${y}`} cx={x} cy={y} r={r} />)}
    </g>
  );
}

function ChestMark() {
  return (
    <g transform="translate(188 126)" filter="url(#ov-wear)" textAnchor="middle">
      <text fontSize={9} fontWeight={800} letterSpacing={1.2}>{BRAND.name}</text>
      <rect x={-15} y={4} width={30} height={1.3} />
      <text y={12.5} fontSize={4.6} letterSpacing={1.4} opacity={0.85}>{BRAND.studio}</text>
    </g>
  );
}

function Crest({ uid }: { uid: string }) {
  const id = `crest-${uid}`;
  return (
    <g transform="translate(150 160)" filter="url(#ov-wear)">
      <circle r={34} fill="none" stroke="currentColor" strokeWidth={2.4} />
      <circle r={22} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="2 2.4" />
      <path id={id} d="M -28 0 A 28 28 0 1 1 28 0 A 28 28 0 1 1 -28 0" fill="none" />
      <text fontSize={6.2} fontWeight={800} letterSpacing={2}>
        <textPath href={`#${id}`}>{`${BRAND.name} • ${BRAND.studio} •`}</textPath>
      </text>
      {/* hanger glyph */}
      <path d="M0 -12 C0 -16 4 -16 4 -13 C4 -11 2 -10 0 -8 L-13 3 L13 3 Z" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <text y={14} fontSize={4.8} letterSpacing={1.5} textAnchor="middle">{BRAND.est}</text>
    </g>
  );
}

function BackStack() {
  const [a, b] = BRAND.backPrint;
  return (
    <g transform="translate(150 150)" filter="url(#ov-wear)" textAnchor="middle">
      <text fontSize={30} fontWeight={900} textLength={150} lengthAdjust="spacingAndGlyphs">{a}</text>
      <text y={30} fontSize={30} fontWeight={900} textLength={150} lengthAdjust="spacingAndGlyphs">{b}</text>
      <rect x={-75} y={40} width={150} height={2} />
      <text y={54} fontSize={7} letterSpacing={3}>{`${BRAND.name} — ${BRAND.studio}`}</text>
    </g>
  );
}

function JerseyNumber({ side, number, outline }: { side: "front" | "back"; number: string; outline: string }) {
  const front = side === "front";
  return (
    <g filter="url(#ov-wear)" textAnchor="middle" fontWeight={900}>
      <text x={150} y={front ? 134 : 128} fontSize={front ? 11 : 17} letterSpacing={front ? 3 : 4}>{BRAND.name}</text>
      <text x={150} y={front ? 214 : 268} fontSize={front ? 70 : 128} letterSpacing={front ? 0 : -4}
        stroke={outline} strokeWidth={front ? 2 : 2.5} paintOrder="stroke">
        {number}
      </text>
    </g>
  );
}
