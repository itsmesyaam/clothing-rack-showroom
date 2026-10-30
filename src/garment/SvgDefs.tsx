export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ov-wood" x1="54" y1="0" x2="246" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a8723f" />
          <stop offset=".25" stopColor="#d6a56d" />
          <stop offset=".5" stopColor="#c08a55" />
          <stop offset=".75" stopColor="#dcae78" />
          <stop offset="1" stopColor="#a06a38" />
        </linearGradient>
        <linearGradient id="ov-wood-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#3b2410" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id="ov-nut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6f7277" />
          <stop offset=".4" stopColor="#f5f6f7" />
          <stop offset=".7" stopColor="#a4a7ab" />
          <stop offset="1" stopColor="#5d6064" />
        </linearGradient>
        {/* Body volume: darker at the sides and hem, lifted at the shoulders */}
        <linearGradient id="ov-shade-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".24" />
          <stop offset=".2" stopColor="#000" stopOpacity="0" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
        <linearGradient id="ov-shade-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset=".75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
        <filter id="ov-grain" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1" />
        </filter>
        <filter id="ov-wash" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="4" seed="11" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.6 0 0 0 -1.15" />
        </filter>
        <filter id="ov-fold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <filter id="ov-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="ov-paint" x="-15%" y="-30%" width="130%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Cracked / worn print */}
        <filter id="ov-wear" x="0" y="0" width="1" height="1">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -3.3" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <pattern id="ov-mesh" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="#000" fillOpacity=".28" />
        </pattern>
        <pattern id="ov-waffle" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 .5 H6 M.5 0 V6" stroke="#000" strokeOpacity=".14" strokeWidth=".8" />
        </pattern>
        <pattern id="ov-rib" width="2.6" height="10" patternUnits="userSpaceOnUse">
          <rect width="1.1" height="10" fill="#000" fillOpacity=".2" />
        </pattern>
      </defs>
    </svg>
  );
}
