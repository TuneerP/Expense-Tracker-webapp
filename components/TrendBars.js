export default function TrendBars({ months, sums }) {
  const max = Math.max(...sums, 1);

  return (
    <div className="panel" style={{ border: "1px solid var(--paper-line)", borderRadius: "var(--radius)", padding: 18 }}>
      <div
        className="flex items-end gap-2.5"
        style={{ height: 110, paddingTop: 6, borderBottom: "1px solid var(--paper-line)", marginBottom: 8 }}
      >
        {sums.map((s, idx) => {
          const h = s > 0 ? Math.max(4, (s / max) * 100) : 2;
          const isCurrent = idx === sums.length - 1;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full rounded-t-[3px] transition-all duration-300"
                style={{
                  height: `${h}%`,
                  minHeight: 2,
                  background: isCurrent ? "var(--copper)" : "var(--navy)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2.5 mt-1.5">
        {months.map((m, idx) => (
          <span key={idx} className="flex-1 text-center" style={{ fontSize: 9.5, color: "var(--muted)" }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
