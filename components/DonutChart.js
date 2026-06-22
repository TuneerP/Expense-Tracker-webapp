import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

// Lightens a category's own hex color into a soft pastel tint for its icon
// badge, so each category's badge is visually tied to its real color rather
// than rotating through an unrelated fixed palette.
function pastelTint(hex, amount = 0.78) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function DonutChart({ monthByCat, monthSum }) {
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Trigger the draw-in animation once this section actually scrolls into
    // view, rather than immediately on mount (which could fire off-screen
    // before the person has scrolled down to see it).
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setAnimated(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      ref={sectionRef}
      className="rounded-[20px] p-5"
      style={{
        background: "linear-gradient(160deg, #f3ead9 0%, #e9dcc4 55%, #ddd0b3 100%)",
        border: "1px solid rgba(255,255,255,.4)",
      }}
    >
      <div className="relative mx-auto" style={{ width: 156, height: 156, margin: "4px auto 20px" }}>
        <div
          className="w-full h-full rounded-full"
          style={{
            background,
            boxShadow: "0 6px 20px rgba(140,110,70,.18)",
            transform: animated ? "scale(1) rotate(0deg)" : "scale(0.4) rotate(-110deg)",
            opacity: animated ? 1 : 0,
            transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease",
          }}
        />
        <div
          className="absolute flex flex-col items-center justify-center rounded-full"
          style={{
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            background: "#fff",
            opacity: animated ? 1 : 0,
            transition: "opacity 0.4s ease 0.3s",
          }}
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
            const delay = 0.15 + idx * 0.08;
            return (
              <div
                key={e.key}
                className="flex items-center gap-3 rounded-[16px] p-3"
                style={{
                  background: "#fff",
                  boxShadow: "0 4px 14px rgba(140,110,70,.1)",
                  opacity: animated ? 1 : 0,
                  transform: animated ? "translateY(0)" : "translateY(14px)",
                  transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    background: pastelTint(c.color),
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
                        className="h-full rounded-full"
                        style={{
                          width: animated ? `${pct}%` : "0%",
                          background: c.color,
                          transition: `width 0.6s ease ${delay + 0.1}s`,
                        }}
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
