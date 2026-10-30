import { GRAIN_URL } from "../lib/util";

/** Cyclorama studio: key light from above, wall sweeping into floor, vignette, film grain. */
export function StudioBackdrop({ floorY }: { floorY: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-studio">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 20%, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0) 70%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: floorY - 260,
          background: "linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.035) 72%, rgb(0 0 0 / 0.018) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0"
        style={{
          top: floorY - 40,
          height: 160,
          background: "radial-gradient(ellipse 55% 50% at 50% 30%, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0) 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 85% 85% at 50% 40%, rgb(0 0 0 / 0) 55%, rgb(0 0 0 / 0.07) 100%)" }}
      />
      <div className="absolute inset-0 opacity-[0.06] mix-blend-multiply" style={{ backgroundImage: GRAIN_URL }} />
    </div>
  );
}
