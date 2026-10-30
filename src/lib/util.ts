import { BRAND } from "../config/brand";

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const pad2 = (n: number) => String(n).padStart(2, "0");

export type Bezier = [number, number, number, number];
export const EASE_OUT: Bezier = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT: Bezier = [0.76, 0, 0.24, 1];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: BRAND.currency, maximumFractionDigits: 0 });
export const formatPrice = (n: number) => money.format(n);

/* ── colour (6-digit hex) ── */
const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a), B = toRgb(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
export const shade = (hex: string, t: number) => mix(hex, "#000000", t);
export const tint = (hex: string, t: number) => mix(hex, "#ffffff", t);
export const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** Mirror an absolute M/L/C/Q/Z path across x = 150 (garment box is 300 wide). */
export function mirror(d: string) {
  let isX = true;
  return d.replace(/-?\d*\.?\d+/g, (num) => {
    const v = parseFloat(num);
    const out = isX ? 300 - v : v;
    isX = !isX;
    return String(Math.round(out * 100) / 100);
  });
}

/* ── tiny procedural textures as CSS backgrounds ── */
const svgUrl = (markup: string) => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
export const GRAIN_URL = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
);
export const WASH_URL = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="5"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.6 0 0 0 -1.15"/></filter><rect width="100%" height="100%" filter="url(#w)"/></svg>`,
);
