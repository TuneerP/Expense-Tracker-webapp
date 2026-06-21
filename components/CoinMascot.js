// "Tup" the pixel coin — drawn on an 16x16 grid, scaled up with crisp edges.
// Each pixel is a <rect>, so it stays sharp at any size (no raster blur).
const GRID = 16;

// Expression maps: 0 = empty, 1 = coin body, 2 = rim highlight, 3 = eye/mouth dark,
// 4 = cheek blush, 5 = sparkle
const FACES = {
  idle: [
    "0001111111110000",
    "0111111111111100",
    "1112222222221110",
    "1122222222222110",
    "1122233022332110",
    "1122233022332110",
    "1122222222222110",
    "1122224444222110",
    "1122244444422110",
    "1122223333222110",
    "1122222222222110",
    "1122222222222110",
    "1112222222221110",
    "0111111111111100",
    "0001111111110000",
    "0000000000000000",
  ],
  happy: [
    "0001111111110000",
    "0111111111111100",
    "1112222222221110",
    "1122222222222110",
    "1122203330222110",
    "1122203330222110",
    "1122222222222110",
    "1122244444422110",
    "1122244444422110",
    "1122223333222110",
    "1122203333022110",
    "1122222222222110",
    "1112222222221110",
    "0111111111111100",
    "0001111111110000",
    "0000000000000000",
  ],
  worried: [
    "0001111111110000",
    "0111111111111100",
    "1112222222221110",
    "1122222222222110",
    "1122230003222110",
    "1122203000322110",
    "1122222222222110",
    "1122222222222110",
    "1122203333022110",
    "1122230000322110",
    "1122222222222110",
    "1122222222222110",
    "1112222222221110",
    "0111111111111100",
    "0001111111110000",
    "0000000000000000",
  ],
  wink: [
    "0001111111110000",
    "0111111111111100",
    "1112222222221110",
    "1122222222222110",
    "1122233300332110",
    "1122222000222110",
    "1122222222222110",
    "1122244444422110",
    "1122244444422110",
    "1122203333022110",
    "1122222222222110",
    "1122222222222110",
    "1112222222221110",
    "0111111111111100",
    "0001111111110000",
    "0000000000000000",
  ],
};

const COLOR_MAP = {
  1: "var(--coin-body, #D2691E)",
  2: "var(--coin-rim, #E8A659)",
  3: "var(--coin-dark, #5C2E0E)",
  4: "var(--coin-blush, #F2C57C)",
  5: "var(--coin-sparkle, #FFF4DE)",
};

export default function CoinMascot({
  expression = "idle",
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
