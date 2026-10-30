/** All stage geometry in one place so the rack → detail "camera" can line up exactly. */
export interface RackLayout {
  w: number; h: number; gh: number; gw: number; u: number;
  barY: number; floorY: number; S: number; G: number; captionTop: number; garmentTop: number;
}

export function rackLayout(w: number, h: number): RackLayout {
  const gh = Math.round(Math.min(h * 0.5, 520, w * 1.05));
  const gw = Math.round(gh * 0.75);
  const u = gh / 400; // px per garment-box unit
  const barY = Math.round(Math.max(96, h * 0.16));
  return {
    w, h, gh, gw, u, barY,
    floorY: h - 84,
    S: gw * 0.36, // spacing between hangers
    G: gw * 0.5, // extra gap that opens around the focused garment
    captionTop: Math.round(barY + gh * 0.95 + 14),
    garmentTop: barY - 14 * u, // rail centre sits at y=14 in the garment box
  };
}

export interface DetailLayout {
  compact: boolean; barY: number; gh: number; gw: number; u: number; centerX: number;
  garmentTop: number; infoTop: number; tagX0: number; tagGap: number; tagScale: number; tagLengths: number[];
}

export function detailLayout(w: number, h: number, tagCount = 3): DetailLayout {
  const compact = w < 768;
  const barY = Math.round(Math.max(80, h * 0.1));
  const gh = Math.round(compact ? Math.min(h * 0.46, (w * 0.66) / 0.75) : Math.min(h * 0.56, 600, (w * 0.42) / 0.75));
  const gw = Math.round(gh * 0.75);
  const u = gh / 400;
  const tagGap = compact ? 28 : w < 1200 ? 84 : 104;
  const tagSpan = (tagCount - 1) * tagGap;
  // Desktop: shift the garment left if the hanging tags need the room.
  const centerX = Math.round(compact ? w * 0.4 : Math.min(w / 2, w - 70 - tagSpan - 60 - gw / 2));
  const tagX0 = compact
    ? Math.min(centerX + gw / 2 - 8, w - 30 - tagSpan)
    : Math.min(centerX + gw / 2 + 60, w - 70 - tagSpan);
  return {
    compact, barY, gh, gw, u, centerX,
    garmentTop: barY - 14 * u,
    infoTop: Math.round(barY + gh * 0.96 + 10),
    tagX0, tagGap,
    tagScale: compact ? 0.56 : 1,
    tagLengths: compact ? [110, 196, 140, 224] : [92, 150, 112, 172],
  };
}
