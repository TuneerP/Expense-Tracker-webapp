// A painterly, atmospheric backdrop built entirely from layered SVG gradients
// and loose brushstroke accents — no photographic imagery, since that would
// require licensed assets we don't have rights to use. The goal is the same
// *feeling* of depth and warmth as a watercolor postcard, built from Tuppence's
// own palette (copper, gold, sage, navy) so it reads as part of this app's
// world rather than a borrowed aesthetic.
export default function WatercolorBackdrop({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 460"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="wcSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E6C8" />
          <stop offset="30%" stopColor="#EFCB95" />
          <stop offset="60%" stopColor="#D89F66" />
          <stop offset="100%" stopColor="#B97849" />
        </linearGradient>
        <radialGradient id="wcSun" cx="68%" cy="8%" r="35%">
          <stop offset="0%" stopColor="#FFF6DC" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#FCE8B4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FCE8B4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wcHillsFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A9764E" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8A5A3A" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="wcHillsMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E4530" />
          <stop offset="100%" stopColor="#4F2F1E" />
        </linearGradient>
        <linearGradient id="wcHillsNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A2417" />
          <stop offset="100%" stopColor="#241509" />
        </linearGradient>
        <linearGradient id="wcWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F7E6E" />
          <stop offset="40%" stopColor="#2E5747" />
          <stop offset="100%" stopColor="#11261E" />
        </linearGradient>
        <linearGradient id="wcVignetteTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14213D" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14213D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wcVignetteBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081410" stopOpacity="0" />
          <stop offset="100%" stopColor="#081410" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <rect width="400" height="460" fill="url(#wcSky)" />
      <rect width="400" height="460" fill="url(#wcSun)" />

      {/* three layered hill silhouettes for real depth, loosely brushed rather than literal scenery */}
      <path
        d="M-10,190 C50,165 110,200 180,175 C250,150 310,190 410,165 L410,240 C310,215 250,250 180,235 C110,220 50,245 -10,225 Z"
        fill="url(#wcHillsFar)"
      />
      <path
        d="M-10,225 C45,200 95,235 155,212 C210,192 250,222 300,205 C340,192 375,212 410,200 L410,275 L-10,275 Z"
        fill="url(#wcHillsMid)"
      />
      <path
        d="M-10,250 C40,232 85,258 140,240 C190,225 225,248 275,232 C315,220 360,238 410,228 L410,300 L-10,300 Z"
        fill="url(#wcHillsNear)"
      />

      <path
        d="M-10,278 C60,262 140,288 220,270 C290,255 350,275 410,262 L410,460 L-10,460 Z"
        fill="url(#wcWater)"
      />
      <ellipse cx="220" cy="270" rx="200" ry="6" fill="#FCE9B8" opacity="0.4" />

      {/* loose brushstroke accents for texture */}
      <path d="M30,205 q18,-7 35,1" stroke="#6E4530" strokeWidth="3.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M270,178 q22,-9 42,2" stroke="#C9925A" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M150,200 q14,-5 26,1" stroke="#8A5A3A" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M60,330 q28,9 55,-3" stroke="#3E6B5E" strokeWidth="4" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M250,360 q24,7 48,-3" stroke="#3E6B5E" strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d="M150,390 q20,6 40,-2" stroke="#2E5747" strokeWidth="3.5" fill="none" opacity="0.3" strokeLinecap="round" />

      <rect width="400" height="460" fill="url(#wcVignetteTop)" />
      <rect width="400" height="460" fill="url(#wcVignetteBottom)" />
    </svg>
  );
}
