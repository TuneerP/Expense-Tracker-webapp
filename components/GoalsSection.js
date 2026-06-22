import { formatMoney } from "@/lib/format";

export default function GoalsSection({ goals, onAddNew, onSelectGoal }) {
  return (
    <div className="px-4 pt-[26px]">
      <div className="flex items-center justify-between mb-3 ml-0.5">
        <span
          className="uppercase tracking-wider"
          style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}
        >
          Savings goals
        </span>
        <button onClick={onAddNew} className="text-xs font-semibold" style={{ color: "var(--copper)" }}>
          + New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <button
          onClick={onAddNew}
          className="w-full text-center rounded-[18px] py-7"
          style={{ border: "1.5px dashed var(--paper-line)", color: "var(--muted)", fontSize: 13 }}
        >
          Saving up for something? Set a goal.
        </button>
      ) : (
        <div className="flex flex-col gap-2.5">
          {goals.map((g) => {
            const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
            const done = Boolean(g.completedAt);
            return (
              <button
                key={g.id}
                onClick={() => onSelectGoal(g)}
                className="text-left rounded-[16px] p-3.5"
                style={{
                  border: `1px solid ${done ? "var(--mint)" : "var(--paper-line)"}`,
                  background: "var(--paper)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium flex items-center gap-1.5" style={{ fontSize: 14 }}>
                    {done && <span>🎉</span>}
                    {g.title}
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 8, background: "var(--paper-line)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: done ? "var(--mint)" : "var(--copper)" }}
                  />
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {formatMoney(g.savedAmount)} / {formatMoney(g.targetAmount)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
