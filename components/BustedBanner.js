import CoinMascot from "./CoinMascot";

export default function BustedBanner({ type, onDismiss }) {
  // type: "daily" | "monthly"
  const label = type === "daily" ? "today's limit" : "this month's limit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(20,33,61,.55)" }}
      onClick={onDismiss}
    >
      <div
        className="stamp-slam shake-it relative max-w-[300px] w-full text-center"
        style={{
          background: "var(--paper)",
          border: "3px dashed var(--rust)",
          borderRadius: 14,
          padding: "28px 22px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CoinMascot expression="busted" size={64} />
        <div
          className="font-bold uppercase mt-3"
          style={{ color: "var(--rust)", fontSize: 26, letterSpacing: ".08em", transform: "rotate(-2deg)" }}
        >
          Busted!
        </div>
        <p className="mt-2" style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
          You&apos;ve gone over {label}. No judgment here — just thought Tup should let you know.
        </p>
        <button
          onClick={onDismiss}
          className="mt-4 w-full font-bold rounded-[10px]"
          style={{ background: "var(--rust)", color: "var(--cream)", padding: "10px", fontSize: 13.5 }}
        >
          Fair enough
        </button>
      </div>
    </div>
  );
}
