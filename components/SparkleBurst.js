const COLORS = ["#D2691E", "#C9A24B", "#4ECCA3", "#BA4E32"];

export default function SparkleBurst({ count = 6 }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + Math.random() * 20;
    const dist = 18 + Math.random() * 14;
    const dx = Math.cos((angle * Math.PI) / 180) * dist;
    const dy = Math.sin((angle * Math.PI) / 180) * dist;
    const color = COLORS[i % COLORS.length];
    const delay = Math.random() * 0.1;
    return { dx, dy, color, delay, key: i };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-pixel absolute"
          style={{
            left: "50%",
            top: "50%",
            width: 4,
            height: 4,
            background: p.color,
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
