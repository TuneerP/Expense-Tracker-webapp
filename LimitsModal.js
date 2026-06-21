import CoinMascot from "./CoinMascot";
import SparkleBurst from "./SparkleBurst";

export default function MilestoneBanner({ milestone, onDismiss }) {
  if (!milestone) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(20,33,61,.55)" }}
      onClick={onDismiss}
    >
      <div
        className="stamp-slam relative max-w-[300px] w-full text-center"
        style={{
          background: "var(--paper)",
          border: "3px dashed var(--mint)",
          borderRadius: 14,
          padding: "28px 22px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative inline-block">
          <CoinMascot expression="happy" size={64} className="coin-spin" />
          <SparkleBurst count={8} />
        </div>
        <div
          className="font-bold uppercase mt-3"
          style={{ color: "var(--sage)", fontSize: 22, letterSpacing: ".06em", transform: "rotate(-2deg)" }}
        >
          {milestone.title}
        </div>
        <p className="mt-2" style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
          {milestone.message}
        </p>
        <button
          onClick={onDismiss}
          className="mt-4 w-full font-bold rounded-[10px]"
          style={{ background: "var(--mint)", color: "var(--navy)", padding: "10px", fontSize: 13.5 }}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
