import { useState } from "react";

export default function SavingsTargetModal({ currentTarget, onSave, onClose }) {
  const [value, setValue] = useState(currentTarget != null ? String(currentTarget) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(value === "" ? null : Number(value));
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
          Your savings target
        </div>
        <p className="mb-5" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
          What are you ultimately saving toward? This shapes how tall your
          climb looks and lets Tup estimate a timeline.
        </p>

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
            min="0"
            step="0.01"
            placeholder="e.g. 500000"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-transparent outline-none py-2 font-semibold"
            style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 22, color: "var(--ink)" }}
          />
        </div>

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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
