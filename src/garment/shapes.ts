import type { GarmentKind } from "../data/products";
import { mirror } from "../lib/util";

export interface Fold { d: string; w: number; o: number; light?: boolean; mirror?: boolean }
export interface GarmentShape {
  outline: string; // full silhouette (back neckline on top)
  front: string; // front panel (front neckline cut lower)
  neckFront: string;
  neckBack: string;
  collar: "crew" | "v" | "hood" | "scoop";
  bindings: string[];
  stitches: string[];
  seams: string[];
  ribs: string[];
  folds: Fold[];
  labelY: number;
  print: { front: { y: number; s: number }; back: { y: number; s: number } };
}

/* 300 × 400 box. Hook top y≈0, rail centre y=14, hanger y≈56–107, neck y≈60. */
export const HANGER_D =
  "M54 94 Q100 66 140 56 L160 56 Q200 66 246 94 Q252 98 249 104 Q245 107 240 105 Q198 80 160 70 L140 70 Q102 80 60 105 Q55 107 51 104 Q48 98 54 94 Z";

const both = (d: string) => [d, mirror(d)];
const folds = (list: Fold[]) => list.flatMap((f) => (f.mirror ? [f, { ...f, d: mirror(f.d) }] : [f]));
const SHOULDERS: Fold[] = [
  { d: "M126 68 C108 74 88 82 70 92", w: 9, o: 0.2, light: true, mirror: true }, // fabric lifted by hanger
  { d: "M128 80 C110 86 92 94 76 104", w: 6, o: 0.12, mirror: true }, // shadow under hanger arm
];
const flat = { y: 0, s: 1 };

const CREW_BACK = "C136 66 164 66 176 59";
const CREW_FRONT = "C130 86 170 86 176 59";
const V_FRONT = "C136 74 146 96 150 102 C154 96 164 74 176 59";
const TANK_BACK = "C138 70 162 70 174 60";
const TANK_FRONT = "C132 120 168 120 174 60";
const HOOD_TOP = "C110 34 130 26 150 26 C170 26 190 34 184 62";
const HOOD_FRONT = "C124 82 140 96 150 98 C160 96 176 82 184 62";

const tee = (n: string) =>
  `M124 59 ${n} L236 82 L284 160 Q270 172 254 176 L240 148 L244 354 Q150 364 56 354 L60 148 L46 176 Q30 172 16 160 L64 82 Z`;
const longsleeve = (n: string) =>
  `M124 59 ${n} L228 80 C250 90 262 120 264 160 L270 334 Q256 340 240 338 L234 166 L227 172 L228 356 Q150 364 72 356 L73 172 L66 166 L60 338 Q44 340 30 334 L36 160 C38 120 50 90 72 80 Z`;
const hoodie = (n: string) =>
  `M116 62 ${n} L242 88 C262 98 272 128 274 170 L280 338 Q264 346 246 344 L240 182 L233 186 L234 346 L230 372 Q150 380 70 372 L66 346 L67 186 L60 182 L54 344 Q36 346 20 338 L26 170 C28 128 38 98 58 88 Z`;
const jersey = (n: string) =>
  `M124 59 ${n} L238 84 L290 168 Q274 180 258 184 L242 152 L246 362 Q150 370 54 362 L58 152 L42 184 Q26 180 10 168 L62 84 Z`;
const tank = (n: string) =>
  `M126 60 ${n} L200 70 C196 118 208 166 228 178 L230 352 Q150 362 70 352 L72 178 C92 166 104 118 100 70 Z`;

export const HOOD_BACK =
  "M116 62 C112 96 116 140 132 170 C140 182 160 182 168 170 C184 140 188 96 184 62 C174 70 162 73 150 73 C138 73 126 70 116 62 Z";
export const HOOD_RIM = "M121 63 C116 41 132 33 150 33 C168 33 184 41 179 63";
export const POCKET = "M102 266 L198 266 L220 304 L222 342 L78 342 L80 304 Z";
export const POCKET_STITCH = "M106 271 L194 271 L214 305 L216 337 L84 337 L86 305 Z";
export const JERSEY_STRIPES = [...both("M300 150 L244 178"), ...both("M300 140 L238 171")];
export const HOLES = [
  { d: "M112 238 C116 233 125 234 127 239 C128 244 121 247 116 246 C111 245 109 241 112 238 Z", t: "M110 240 C116 238 122 242 128 240" },
  { d: "M184 272 C188 268 196 268 198 273 C199 277 193 279 189 278 C185 277 183 275 184 272 Z", t: "M183 274 C189 272 194 276 199 274" },
  { d: "M140 304 C143 301 149 301 150 305 C151 308 147 310 143 309 C140 308 138 306 140 304 Z", t: "" },
  { d: "M194 160 C196 157 201 157 202 160 C203 163 200 164 197 164 C195 163 193 162 194 160 Z", t: "" },
];

export const SHAPES: Record<GarmentKind, GarmentShape> = {
  tee: {
    outline: tee(CREW_BACK), front: tee(CREW_FRONT),
    neckFront: `M124 59 ${CREW_FRONT}`, neckBack: `M124 59 ${CREW_BACK}`, collar: "crew", bindings: [],
    stitches: ["M244 345 Q150 355 56 345", ...both("M280.5 153 Q266.5 165 250.5 169")],
    seams: both("M236 82 C232 104 234 128 240 148"),
    ribs: [],
    folds: folds([
      ...SHOULDERS,
      { d: "M238 156 C222 196 206 228 196 266", w: 12, o: 0.18, mirror: true },
      { d: "M226 170 C212 204 200 232 190 262", w: 8, o: 0.15, light: true, mirror: true },
      { d: "M262 118 C266 136 268 150 272 164", w: 6, o: 0.12, mirror: true },
      { d: "M112 300 C114 322 110 340 113 354", w: 9, o: 0.1, mirror: true },
      { d: "M121 304 C123 324 120 342 122 354", w: 6, o: 0.12, light: true, mirror: true },
      { d: "M150 98 C147 130 143 160 146 196", w: 8, o: 0.06 },
    ]),
    labelY: 70, print: { front: flat, back: flat },
  },
  longsleeve: {
    outline: longsleeve(CREW_BACK), front: longsleeve(CREW_FRONT),
    neckFront: `M124 59 ${CREW_FRONT}`, neckBack: `M124 59 ${CREW_BACK}`, collar: "crew", bindings: [],
    stitches: ["M228 347 Q150 355 72 347"],
    seams: both("M228 80 C226 110 226 140 227 172"),
    ribs: both("M239.2 314 L269.3 314 L270 334 Q256 340 240 338 Z"),
    folds: folds([
      ...SHOULDERS,
      { d: "M226 178 C214 208 204 234 198 264", w: 10, o: 0.16, mirror: true },
      { d: "M252 172 C254 222 256 270 258 312", w: 7, o: 0.14, light: true, mirror: true },
      { d: "M244 182 C246 232 247 280 248 312", w: 6, o: 0.12, mirror: true },
      { d: "M241 296 C250 292 260 293 268 298", w: 5, o: 0.14, mirror: true },
      { d: "M241 272 C250 268 259 269 266 274", w: 4, o: 0.12, mirror: true },
      { d: "M112 316 C114 334 111 348 113 356", w: 8, o: 0.1, mirror: true },
    ]),
    labelY: 70, print: { front: flat, back: flat },
  },
  hoodie: {
    outline: hoodie(HOOD_TOP), front: hoodie(HOOD_FRONT),
    neckFront: `M116 62 ${HOOD_FRONT}`, neckBack: "M116 62 C130 70 170 70 184 62", collar: "hood", bindings: [],
    stitches: ["M234 352 Q150 358 66 352"],
    seams: both("M242 88 C238 120 236 155 238 184"),
    ribs: ["M234 346 L230 372 Q150 380 70 372 L66 346 Q150 352 234 346 Z", ...both("M244.8 312 L279.1 312 L280 338 Q264 346 246 344 Z")],
    folds: folds([
      ...SHOULDERS,
      { d: "M236 192 C214 222 200 248 192 282", w: 14, o: 0.2, mirror: true },
      { d: "M224 202 C206 230 196 254 188 284", w: 10, o: 0.13, light: true, mirror: true },
      { d: "M252 122 C258 172 262 222 266 300", w: 8, o: 0.1, mirror: true },
      { d: "M246 286 C256 282 268 284 278 292", w: 6, o: 0.16, mirror: true },
      { d: "M246 262 C256 258 268 260 277 268", w: 6, o: 0.13, mirror: true },
      { d: "M246 274 C256 270 268 272 277 280", w: 5, o: 0.13, light: true, mirror: true },
      { d: "M112 314 C114 328 111 338 113 346", w: 7, o: 0.12, mirror: true },
    ]),
    labelY: 72, print: { front: { y: 44, s: 0.95 }, back: { y: 74, s: 1 } },
  },
  jersey: {
    outline: jersey(CREW_BACK), front: jersey(V_FRONT),
    neckFront: `M124 59 ${V_FRONT}`, neckBack: `M124 59 ${CREW_BACK}`, collar: "v", bindings: [],
    stitches: ["M246 353 Q150 361 54 353", ...both("M286.4 162 Q270.4 174 254.4 178")],
    seams: both("M170 63 L242 152"),
    ribs: [],
    folds: folds([
      ...SHOULDERS,
      { d: "M240 160 C224 200 208 230 198 268", w: 12, o: 0.16, mirror: true },
      { d: "M228 174 C214 206 202 234 192 264", w: 8, o: 0.14, light: true, mirror: true },
      { d: "M110 304 C112 326 108 344 111 360", w: 9, o: 0.1, mirror: true },
      { d: "M150 108 C148 140 145 168 147 200", w: 8, o: 0.05 },
    ]),
    labelY: 70, print: { front: flat, back: flat },
  },
  tank: {
    outline: tank(TANK_BACK), front: tank(TANK_FRONT),
    neckFront: `M126 60 ${TANK_FRONT}`, neckBack: `M126 60 ${TANK_BACK}`, collar: "scoop",
    bindings: both("M200 70 C196 118 208 166 228 178"),
    stitches: ["M230 343 Q150 353 70 343"],
    seams: [],
    ribs: [],
    folds: folds([
      ...SHOULDERS,
      { d: "M104 84 C110 120 116 150 118 190", w: 9, o: 0.16, mirror: true },
      { d: "M112 86 C118 120 124 150 126 186", w: 6, o: 0.13, light: true, mirror: true },
      { d: "M216 200 C214 240 216 290 214 340", w: 10, o: 0.12, mirror: true },
      { d: "M128 318 C130 332 128 344 130 354", w: 6, o: 0.1, mirror: true },
    ]),
    labelY: 72, print: { front: { y: 14, s: 0.82 }, back: { y: 20, s: 0.8 } },
  },
};
