import { useState } from "react";

export default function HealthScoreCard({ score }) {
  const [expanded, setExpanded] = useState(false);
  if (!score) return null;

  const ringColor =
    score.total >= 85 ? "var(--mint)" : score.total >= 65 ? "var(--gold)" : score.total >= 40 ? "var(--copper)" : "var(--rust)";

  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (score.total / 100) * circumference;

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="w-full text-left rounded-[18px] p-4"
      style={{ border: "1px solid var(--paper-line)", background: "var(--paper)" }}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="30" fill="none" stroke="var(--paper-line)" strokeWidth="6" />
            <circle
              cx="34"
              cy="34"
              r="30"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 34 34)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center mono font-bold" style={{ fontSize: 18 }}>
            {score.total}
          </div>
        </div>
        <div className="flex-1">
          <div className="uppercase tracking-wider" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}>
            Financial Health
          </div>
          <div className="font-bold mt-0.5 flex items-center gap-1.5" style={{ fontSize: 16 }}>
            <span>{score.label.emoji}</span>
            <span>{score.label.text}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {expanded ? "Tap to collapse" : "Tap to see why"}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-3.5" style={{ borderTop: "1px dashed var(--paper-line)" }}>
          {score.breakdown.map((b) => (
            <div key={b.name} className="mb-2.5 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{b.name}</span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {b.points}/{b.max}
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--paper-line)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(b.points / b.max) * 100}%`, background: ringColor }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
