export type GarmentKind = "tee" | "longsleeve" | "hoodie" | "jersey" | "tank";
export type PrintKind = "painted-logo" | "chest-mark" | "crest" | "back-stack" | "jersey-number" | "none";

export interface Colorway { id: string; name: string; code: string; hex: string; ink: string; wash?: boolean }

export interface Product {
  id: string;
  title: string;
  kind: GarmentKind;
  price: number;
  colors: Colorway[];
  print: { front: PrintKind; back: PrintKind };
  distressed?: boolean;
  number?: string;
  /** 0.6 = light & floaty … 1.4 = heavy fleece. Scales sway amplitude and damping. */
  weight: number;
  details: string[];
  /** Optional transparent cutouts per colourway id; falls back to the vector garment. */
  images?: Partial<Record<string, { front: string; back: string }>>;
}

export const PRODUCTS: Product[] = [
  {
    id: "tee-box", title: "Heavyweight Box Tee", kind: "tee", price: 70, weight: 0.95,
    print: { front: "chest-mark", back: "back-stack" },
    colors: [
      { id: "optic", name: "Optic White", code: "OW / 01", hex: "#f2f1ec", ink: "#121212" },
      { id: "jet", name: "Jet Black", code: "JB / 02", hex: "#18181a", ink: "#f2f1ec" },
      { id: "moss", name: "Moss", code: "MS / 03", hex: "#5b6347", ink: "#ebe6d6" },
    ],
    details: ["300 GSM loopback jersey", "Dropped shoulder, boxy body", "Ribbed crew collar", "Pre-shrunk"],
  },
  {
    id: "hoodie-acid", title: "Acid Wash Pullover Hoodie", kind: "hoodie", price: 160, weight: 1.35,
    print: { front: "crest", back: "back-stack" },
    colors: [
      { id: "acid-charcoal", name: "Acid Charcoal", code: "AC / 01", hex: "#47484c", ink: "#ebe7dd", wash: true },
      { id: "sand", name: "Washed Sand", code: "WS / 02", hex: "#cbbda2", ink: "#2a2722", wash: true },
      { id: "cobalt", name: "Faded Cobalt", code: "FC / 03", hex: "#3e5c99", ink: "#f0ece2", wash: true },
    ],
    details: ["480 GSM brushed fleece", "Double-layer hood", "Kangaroo pocket", "Hand acid-washed"],
  },
  {
    id: "tank-painted", title: "Distressed Painted Logo Tank Top", kind: "tank", price: 95, weight: 0.7,
    distressed: true, print: { front: "painted-logo", back: "back-stack" },
    colors: [
      { id: "charcoal", name: "Charcoal Grey", code: "CG / 01", hex: "#3b3b3e", ink: "#efebe2" },
      { id: "cream", name: "Washed Cream", code: "WC / 02", hex: "#e8e0cc", ink: "#1c1b19", wash: true },
      { id: "acid-black", name: "Acid Black", code: "AB / 03", hex: "#1d1d20", ink: "#39ff14", wash: true },
    ],
    details: ["220 GSM garment-dyed cotton", "Hand-distressed, no two alike", "Raw-cut hem", "Boxy, cropped fit"],
  },
  {
    id: "jersey-09", title: "Mesh Football Jersey 09", kind: "jersey", price: 120, weight: 0.8, number: "09",
    print: { front: "jersey-number", back: "jersey-number" },
    colors: [
      { id: "navy", name: "Navy", code: "NV / 01", hex: "#1e2642", ink: "#f3f0e7" },
      { id: "blood", name: "Blood Red", code: "BR / 02", hex: "#8c1c1d", ink: "#f3f0e7" },
      { id: "pitch", name: "Pitch White", code: "PW / 03", hex: "#f1f0eb", ink: "#141414" },
    ],
    details: ["Breathable athletic mesh", "Contrast V-neck trim", "Twill-effect numbers", "Relaxed fit"],
  },
  {
    id: "ls-thermal", title: "Thermal Waffle Longsleeve", kind: "longsleeve", price: 90, weight: 1,
    print: { front: "chest-mark", back: "crest" },
    colors: [
      { id: "oat", name: "Oatmeal", code: "OM / 01", hex: "#d8ccb4", ink: "#2a2925" },
      { id: "washed-black", name: "Washed Black", code: "WB / 02", hex: "#29292c", ink: "#e8e4d9", wash: true },
      { id: "clay", name: "Clay", code: "CL / 03", hex: "#a5644a", ink: "#f1e9d8" },
    ],
    details: ["Waffle-knit cotton thermal", "Long rib cuffs", "Slim through the sleeve", "Garment dyed"],
  },
  {
    id: "hoodie-pigment", title: "Pigment Dyed Hoodie", kind: "hoodie", price: 150, weight: 1.4,
    print: { front: "chest-mark", back: "crest" },
    colors: [
      { id: "pigment-black", name: "Pigment Black", code: "PB / 01", hex: "#2c2c2f", ink: "#39ff14" },
      { id: "stone", name: "Stone", code: "ST / 02", hex: "#b7b1a4", ink: "#1b1b1b" },
      { id: "forest", name: "Forest", code: "FR / 03", hex: "#34473b", ink: "#e7e2d4" },
    ],
    details: ["460 GSM fleece", "Pigment dyed for a lived-in fade", "Rib hem and cuffs", "Oversized fit"],
  },
  {
    id: "tank-ripped", title: "Ripped Muscle Tank", kind: "tank", price: 80, weight: 0.62,
    distressed: true, print: { front: "crest", back: "none" },
    colors: [
      { id: "bone", name: "Bone White", code: "BW / 01", hex: "#efede6", ink: "#161616" },
      { id: "black", name: "Black", code: "BK / 02", hex: "#19191b", ink: "#efede6" },
      { id: "army", name: "Army", code: "AR / 03", hex: "#58603f", ink: "#ece7d6" },
    ],
    details: ["Slub cotton jersey", "Deep armholes", "Raw-cut hem", "Hand-ripped details"],
  },
  {
    id: "tee-crest", title: "Studio Crest Tee", kind: "tee", price: 75, weight: 0.9,
    print: { front: "crest", back: "back-stack" },
    colors: [
      { id: "ash", name: "Ash Grey", code: "AG / 01", hex: "#b8b8b4", ink: "#121212" },
      { id: "cream", name: "Washed Cream", code: "WC / 02", hex: "#e9e1ce", ink: "#1d1c1a", wash: true },
      { id: "jet", name: "Jet", code: "JT / 03", hex: "#18181a", ink: "#39ff14" },
    ],
    details: ["260 GSM combed cotton", "Cracked plastisol crest", "Taped neck seam", "Regular-boxy fit"],
  },
];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Deterministic mock stock (swap for your inventory API). */
export function stockFor(productId: string, colorId: string, size: string) {
  let h = 2166136261;
  for (const ch of `${productId}|${colorId}|${size}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = (h >>> 0) % 100;
  return r < 14 ? 0 : r < 32 ? 1 + (r % 2) : 3 + (r % 6);
}
