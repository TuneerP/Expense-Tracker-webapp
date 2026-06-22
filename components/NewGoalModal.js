import { useState } from "react";

export default function NewGoalModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!title.trim()) {
      setError("Give your goal a name.");
      return;
    }
    const num = Number(targetAmount);
    if (!num || num <= 0) {
      setError("Enter a valid target amount.");
      return;
    }
    setSaving(true);
    await onSave({ title: title.trim(), targetAmount: num });
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
          New savings goal
        </div>
        <p className="mb-5" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
          What are you saving up for?
        </p>

        <div className="mb-4">
          <label
            className="block uppercase tracking-wider mb-1.5"
            style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
          >
            Goal name
          </label>
          <input
            type="text"
            maxLength={80}
            placeholder="e.g. New laptop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent outline-none py-2"
            style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 16, color: "var(--ink)" }}
          />
        </div>

        <div className="mb-5">
          <label
            className="block uppercase tracking-wider mb-1.5"
            style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
          >
            Target amount
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            placeholder="80000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full bg-transparent outline-none py-2"
            style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 16, color: "var(--ink)" }}
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
            style={{ background: "var(--copper)", color: "var(--cream)", padding: "11px", fontSize: 13.5 }}
          >
            {saving ? "Creating…" : "Create goal"}
          </button>
        </div>
      </div>
    </div>
  );
}
