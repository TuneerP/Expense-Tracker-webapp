import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

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
    <div className="panel" style={{ border: "1px solid var(--paper-line)", borderRadius: "var(--radius)", padding: 18 }}>
      <div className="relative mx-auto" style={{ width: 168, height: 168, margin: "6px auto 18px" }}>
        <div
          className="w-full h-full rounded-full transition-all duration-300"
          style={{ background }}
        />
        <div
          className="absolute flex flex-col items-center justify-center rounded-full"
          style={{ top: 17, left: 17, right: 17, bottom: 17, background: "var(--paper)" }}
        >
          <div className="mono font-semibold" style={{ fontSize: 18 }}>
            {formatMoney(monthSum)}
          </div>
          <div className="uppercase tracking-wider mt-0.5" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".08em" }}>
            this month
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-9 px-5" style={{ color: "var(--muted)", fontSize: 13.5 }}>
          No spending logged this month yet.
        </div>
      ) : (
        <div>
          {entries.map((e) => {
            const c = CATEGORIES[e.key];
            const pct = (e.amt / monthSum) * 100;
            return (
              <div
                key={e.key}
                className="flex items-center gap-2.5 py-2"
                style={{ borderBottom: "1px dashed var(--paper-line)" }}
              >
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                <span className="flex-1" style={{ fontSize: 13.5 }}>{c.label}</span>
                <span className="mono text-right" style={{ fontSize: 12, color: "var(--muted)", width: 36 }}>
                  {pct.toFixed(0)}%
                </span>
                <span className="mono text-right" style={{ fontSize: 13, width: 80 }}>
                  {formatMoney(e.amt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
