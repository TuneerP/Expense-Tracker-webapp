import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

// A soft, abstract gradient wash per index, rotating through a small set —
// evokes a watercolor-postcard feeling without using any photographic art
// (which would need real licensed imagery we don't have rights to use).
const WASHES = [
  "linear-gradient(135deg, #fde8d3 0%, #f6d9c4 40%, #e8c4a8 100%)",
  "linear-gradient(135deg, #d9e8f0 0%, #c9dde8 40%, #b8cdd9 100%)",
  "linear-gradient(135deg, #e3ecd8 0%, #d3e0c4 40%, #c2d1ae 100%)",
];

export default function DonutChart({ monthByCat, monthSum }) {
  const entries = Object.keys(monthByCat)
    .map((k) => ({ key: k, amt: monthByCat[k] }))
    .sort((a, b) => b.amt - a.amt);

  let stops = [];
  let acc = 0;
  entries.forEach((e) => {
    const pct = (e.amt / monthSum) * 100;
    const c = CATEGORIES[e.key];
    const start = acc;
    const end = acc + pct;
    stops.push(`${c.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    acc = end;
  });

  const background = entries.length > 0 ? `conic-gradient(${stops.join(",")})` : "var(--paper-line)";

  return (
    <div
      className="rounded-[20px] p-5"
      style={{
        background: "linear-gradient(160deg, #f3ead9 0%, #e9dcc4 55%, #ddd0b3 100%)",
        border: "1px solid rgba(255,255,255,.4)",
      }}
    >
      <div className="relative mx-auto" style={{ width: 156, height: 156, margin: "4px auto 20px" }}>
        <div
          className="w-full h-full rounded-full transition-all duration-300"
          style={{ background, boxShadow: "0 6px 20px rgba(140,110,70,.18)" }}
        />
        <div
          className="absolute flex flex-col items-center justify-center rounded-full"
          style={{ top: 16, left: 16, right: 16, bottom: 16, background: "#fff" }}
        >
          <div className="mono font-semibold" style={{ fontSize: 17, color: "var(--ink)" }}>
            {formatMoney(monthSum)}
          </div>
          <div className="uppercase tracking-wider mt-0.5" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".08em" }}>
            this month
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="text-center py-8 px-5 rounded-[16px]"
          style={{ background: "rgba(255,255,255,.7)", color: "var(--muted)", fontSize: 13.5 }}
        >
          No spending logged this month yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e, idx) => {
            const c = CATEGORIES[e.key];
            const pct = (e.amt / monthSum) * 100;
            return (
              <div
                key={e.key}
                className="flex items-center gap-3 rounded-[16px] p-3"
                style={{
                  background: "#fff",
                  boxShadow: "0 4px 14px rgba(140,110,70,.1)",
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    background: WASHES[idx % WASHES.length],
                    fontSize: 17,
                  }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium truncate" style={{ fontSize: 13.5, color: "var(--ink)" }}>
                      {c.label}
                    </span>
                    <span className="mono font-semibold whitespace-nowrap" style={{ fontSize: 13.5, color: "var(--ink)" }}>
                      {formatMoney(e.amt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "#ECE4D4" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                    <span className="mono flex-shrink-0" style={{ fontSize: 10.5, color: "var(--muted)", width: 28, textAlign: "right" }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
