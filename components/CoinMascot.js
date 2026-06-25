// "Tup" the pixel coin — drawn on an 16x16 grid, scaled up with crisp edges.
// Each pixel is a <rect>, so it stays sharp at any size (no raster blur).
const GRID = 16;

// Expression maps: 0 = empty, 1 = coin body, 2 = rim highlight, 3 = eye/mouth dark.
// Redesigned for legibility at small sizes (40px header icon): bigger features,
// full vertical space used, simplified rim so features have visual priority.
const FACES = {
  idle: [
    "0001111111110000",
    "0112222222222110",
    "1122222222222210",
    "1122222222222210",
    "1122003330000210",
    "1122033303300210",
    "1122003330000210",
    "1122222222222210",
    "1122222222222210",
    "1122222222222210",
    "1122003333302210",
    "1122222222222210",
    "1122222222222210",
    "0112222222222110",
    "0001111111110000",
    "0000000000000000",
  ],
  happy: [
    "0001111111110000",
    "0112222222222110",
    "1122222222222210",
    "1122222222222210",
    "1122003330000210",
    "1122033303300210",
    "1122003330000210",
    "1122222222222210",
    "1122222222222210",
    "1122302222203210",
    "1122330222033210",
    "1122223333222210",
    "1122222222222210",
    "0112222222222110",
    "0001111111110000",
    "0000000000000000",
  ],
  worried: [
    "0001111111110000",
    "0112222222222110",
    "1122222222222210",
    "1122230000032210",
    "1122233000332210",
    "1122203333302210",
    "1122222222222210",
    "1122222222222210",
    "1122222222222210",
    "1122222222222210",
    "1122033333302210",
    "1122300000033210",
    "1122222222222210",
    "0112222222222110",
    "0001111111110000",
    "0000000000000000",
  ],
  wink: [
    "0001111111110000",
    "0112222222222110",
    "1122222222222210",
    "1122222222222210",
    "1122003330000210",
    "1122000000300210",
    "1122000000000210",
    "1122222222222210",
    "1122222222222210",
    "1122302222203210",
    "1122330222033210",
    "1122223333222210",
    "1122222222222210",
    "0112222222222110",
    "0001111111110000",
    "0000000000000000",
  ],
  busted: [
    "0001111111110000",
    "0112222222222110",
    "1122222222222210",
    "1122230000322210",
    "1122203303022210",
    "1122230303322210",
    "1122203303022210",
    "1122230000322210",
    "1122222222222210",
    "1122222222222210",
    "1122033333302210",
    "1122303333033210",
    "1122222222222210",
    "0112222222222110",
    "0001111111110000",
    "0000000000000000",
  ],
};

const COLOR_MAP = {
  1: "var(--coin-body, #D2691E)",
  2: "var(--coin-rim, #EBAC60)",
  3: "var(--coin-dark, #2D190C)",
};

// Optional accessory overlays — extra pixels drawn on top of whatever base
// expression is showing, so we don't need a separate full face per costume.
// 6 = glasses frame (navy), 7 = cap body (navy), 8 = cap brim/tassel (gold)
const ACCESSORY_COLOR_MAP = {
  6: "var(--coin-glasses, #14213D)",
  7: "var(--coin-cap, #14213D)",
  8: "var(--coin-cap-trim, #C9A24B)",
};

const ACCESSORIES = {
  coach: [
    "0007777777700000",
    "0077777777770000",
    "0007777777700000",
    "0000000000000000",
    "0066600000066600",
    "0606600000606600",
    "0066600000066600",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
    "0000000000000000",
  ],
};

export default function CoinMascot({
  expression = "idle",
  accessory = null,
  size = 72,
  spinning = false,
  className = "",
  style = {},
}) {
  const grid = FACES[expression] || FACES.idle;
  const pixels = [];

  for (let y = 0; y < GRID; y++) {
    const row = grid[y];
    for (let x = 0; x < GRID; x++) {
      const v = row[x];
      if (v === "0") continue;
      pixels.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={COLOR_MAP[v]}
          shapeRendering="crispEdges"
        />
      );
    }
  }

  if (accessory && ACCESSORIES[accessory]) {
    const accGrid = ACCESSORIES[accessory];
    for (let y = 0; y < GRID; y++) {
      const row = accGrid[y];
      for (let x = 0; x < GRID; x++) {
        const v = row[x];
        if (v === "0") continue;
        pixels.push(
          <rect
            key={`acc-${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={ACCESSORY_COLOR_MAP[v]}
            shapeRendering="crispEdges"
          />
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={size}
      height={size}
      className={`${spinning ? "coin-spin" : ""} ${className}`}
      style={{ imageRendering: "pixelated", ...style }}
      role="img"
      aria-label="Tuppence the coin mascot"
    >
      {pixels}
    </svg>
  );
}
