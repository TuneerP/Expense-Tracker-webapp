// The visual heart of Coach Tup: a mountain whose height reflects how far
// there is to climb (spending burden + distance to any savings goal), and
// weather that reflects the current trajectory (storm when overspending,
// clear when comfortably ahead). Built from layered SVG, not photography,
// consistent with the rest of Tuppence's painterly accent moments.
//
// Motion is intentionally restrained: clouds drift slowly, rain falls at a
// gentle constant rate, lightning flashes occasionally — nothing that would
// feel exhausting on a screen someone might check daily.

const SKY_COLORS = {
  clear: ["#F5E6C8", "#D89F66"],
  cloudy: ["#D8CDB8", "#A89478"],
  rain: ["#9C9486", "#5C5650"],
  storm: ["#5C5650", "#2E2A26"],
};

const MOUNTAIN_COLORS = {
  clear: ["#A9764E", "#6E4530"],
  cloudy: ["#8A7460", "#5C4838"],
  rain: ["#5C5248", "#36302A"],
  storm: ["#332E2A", "#18150F"],
};

export default function FinancialClimbScene({ height = 35, weather = "clear", className = "" }) {
  const horizonY = 280;
  const minApexY = 70; // tallest possible peak
  const maxApexY = 215; // shortest possible hill
  const clamped = Math.max(0, Math.min(100, height));
  const apexY = maxApexY - (clamped / 100) * (maxApexY - minApexY);
  const apexX = 200;
  const baseHalfWidth = 230;

  const [skyTop, skyBottom] = SKY_COLORS[weather] || SKY_COLORS.clear;
  const [mtnTop, mtnBottom] = MOUNTAIN_COLORS[weather] || MOUNTAIN_COLORS.clear;

  const uid = weather; // stable per-weather gradient ids, fine since only one renders at a time

  return (
    <svg
      viewBox="0 0 400 320"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`climbSky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id={`climbMtn-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mtnTop} />
          <stop offset="100%" stopColor={mtnBottom} />
        </linearGradient>
      </defs>

      <rect width="400" height="320" fill={`url(#climbSky-${uid})`} />

      {weather === "clear" && (
        <circle cx="290" cy="60" r="26" fill="#FFF6DC" opacity="0.9" />
      )}

      {weather === "cloudy" && (
        <>
          <ellipse className="climb-cloud-drift-slow" cx="100" cy="80" rx="45" ry="18" fill="#fff" opacity="0.5" />
          <ellipse className="climb-cloud-drift" cx="280" cy="110" rx="55" ry="20" fill="#fff" opacity="0.4" />
        </>
      )}

      {weather === "rain" && (
        <>
          <ellipse cx="120" cy="55" rx="70" ry="24" fill="#8A8478" opacity="0.7" />
          <ellipse cx="260" cy="50" rx="80" ry="26" fill="#8A8478" opacity="0.6" />
          <g className="climb-rain">
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={i}
                x1={40 + i * 32}
                y1={70 + ((i * 17) % 40)}
                x2={32 + i * 32}
                y2={110 + ((i * 17) % 40)}
                stroke="#AEC6D8"
                strokeWidth="2"
                opacity="0.55"
              />
            ))}
          </g>
        </>
      )}

      {weather === "storm" && (
        <>
          <ellipse cx="140" cy="45" rx="90" ry="28" fill="#1E1B17" opacity="0.85" />
          <ellipse cx="280" cy="55" rx="100" ry="30" fill="#241F1A" opacity="0.85" />
          <g className="climb-rain-heavy">
            {Array.from({ length: 14 }, (_, i) => (
              <line
                key={i}
                x1={25 + i * 28}
                y1={60 + ((i * 19) % 45)}
                x2={14 + i * 28}
                y2={105 + ((i * 19) % 45)}
                stroke="#A8BCC9"
                strokeWidth="2.5"
                opacity="0.6"
              />
            ))}
          </g>
          <path
            className="climb-lightning"
            d="M255,80 L242,118 L258,116 L244,158"
            stroke="#FCE9B8"
            strokeWidth="3.5"
            fill="none"
            opacity="0"
            strokeLinejoin="round"
          />
        </>
      )}

      <path
        d={`M-10,${horizonY} L${apexX - baseHalfWidth},${apexY + 90} L${apexX - 65},${apexY + 22} L${apexX},${apexY} L${apexX + 65},${apexY + 22} L${apexX + baseHalfWidth},${apexY + 90} L410,${horizonY - 6} L410,320 L-10,320 Z`}
        fill={`url(#climbMtn-${uid})`}
      />
      <path
        d={`M${apexX - 20},${apexY + 12} L${apexX},${apexY} L${apexX + 20},${apexY + 12} L${apexX + 9},${apexY + 9} L${apexX},${apexY + 1} L${apexX - 9},${apexY + 9} Z`}
        fill="#fff"
        opacity="0.85"
      />
    </svg>
  );
}