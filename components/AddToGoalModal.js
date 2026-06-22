import { useState } from "react";

export default function AddToGoalModal({ goal, onSave, onClose, onDeleteGoal }) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    const num = Number(amount);
    if (!num || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    await onSave(num);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(20,33,61,.55)" }}
      onClick={onClose}
    >
      <div
        className="pop-in max-w-[340px] w-full"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--paper-line)",
          borderRadius: "var(--radius)",
          padding: "24px 22px",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="uppercase font-bold mb-1"
          style={{ color: "var(--copper)", fontSize: 16, letterSpacing: ".06em" }}
        >
          {goal.title}
        </div>
        <p className="mb-5" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
          Add money saved toward this goal.
        </p>

        <div className="mb-5">
          <label
            className="block uppercase tracking-wider mb-1.5"
            style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
          >
            Amount to add
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent outline-none py-2 font-semibold"
            style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 22, color: "var(--ink)" }}
          />
        </div>

        {error && (
          <div className="mb-3 text-sm" style={{ color: "var(--rust)" }}>
            {error}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 font-semibold rounded-[10px]"
            style={{ background: "transparent", border: "1px solid var(--paper-line)", color: "var(--muted)", padding: "11px", fontSize: 13.5 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 font-bold rounded-[10px] disabled:opacity-60"
            style={{ background: "var(--mint)", color: "var(--navy)", padding: "11px", fontSize: 13.5 }}
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>

        <button
          onClick={onDeleteGoal}
          className="w-full text-center mt-3.5"
          style={{ fontSize: 11.5, color: "var(--muted)" }}
        >
          Remove this goal
        </button>
      </div>
    </div>
  );
}
