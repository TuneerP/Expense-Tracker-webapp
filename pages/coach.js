import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import CoinMascot from "@/components/CoinMascot";
import FinancialClimbScene from "@/components/FinancialClimbScene";
import SavingsTargetModal from "@/components/SavingsTargetModal";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { computeCoachAnalysis, computeFinancialClimb, suggestSpendingCut } from "@/lib/insights";

const WEATHER_LABELS = {
  clear: { emoji: "☀️", text: "Clear skies" },
  cloudy: { emoji: "⛅", text: "Partly cloudy" },
  rain: { emoji: "🌧️", text: "Rain warning" },
  storm: { emoji: "⛈️", text: "Financial storm" },
};

function coachLine({ weather, hasGoal, projection }) {
  if (weather === "storm") {
    return "Right now you're spending more than comes in. Let's look at where it's going.";
  }
  if (weather === "rain") {
    return "You're keeping your head above water, but the margin is thin.";
  }
  if (weather === "cloudy") {
    return "Steady, but there's room to build a bigger cushion.";
  }
  if (hasGoal && projection) {
    return `At this pace, you're genuinely on track for your goal.`;
  }
  return "Things are looking comfortable. Nice work.";
}

export default function Coach() {
  // TEMPORARY: visit /coach?preview=1 to see the "enough data" view rendered
  // with your real numbers even if your account is under 14 days old. This
  // block is removed once you've confirmed the real view looks right.
  const router = useRouter();
  const isPreview = router.query.preview === "1";

  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsTarget, setSavingsTarget] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [monthlyLimit, setMonthlyLimit] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showTargetModal, setShowTargetModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch("/api/expenses").then((r) => r.json()),
      fetch("/api/incomes").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
    ])
      .then(([expData, incData, setData, goalsData]) => {
        setExpenses(expData.expenses || []);
        setIncomes(incData.incomes || []);
        setSavingsTarget(setData.savingsTarget ?? null);
        setDailyLimit(setData.dailyLimit ?? null);
        setMonthlyLimit(setData.monthlyLimit ?? null);
        setGoals(goalsData.goals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSaveTarget(value) {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savingsTarget: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavingsTarget(data.savingsTarget);
      }
    } catch {
      // best effort
    } finally {
      setShowTargetModal(false);
    }
  }

  if (user === undefined || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
        <CoinMascot expression="idle" accessory="coach" size={56} className="coin-bob" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--navy)" }}>
        <div className="text-center" style={{ color: "var(--cream)" }}>
          <p className="mb-4">You&apos;ll need to log in first.</p>
          <Link href="/" style={{ color: "var(--copper)", fontWeight: 600 }}>
            Back to Tuppence
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  let todaySum = 0;
  let monthSum = 0;
  expenses.forEach((x) => {
    const d = new Date(x.ts);
    if (d >= dayStart) todaySum += x.amount;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) monthSum += x.amount;
  });
  const isOverLimit = Boolean((dailyLimit && todaySum > dailyLimit) || (monthlyLimit && monthSum > monthlyLimit));

  const rawAnalysis = computeCoachAnalysis({ expenses, incomes, savingsTarget, now });
  // TEMPORARY: in preview mode, pretend there's enough history so the real
  // numbers render even on a young account. Remove this block afterward.
  const analysis =
    isPreview && !rawAnalysis.hasEnoughData
      ? computeCoachAnalysis({
          expenses,
          incomes,
          savingsTarget,
          now: new Date(now.getTime() + 14 * 86400000),
        })
      : rawAnalysis;

  const activeGoal = goals.find((g) => !g.completedAt);
  // Prefer the explicitly-tracked Goal's progress if the user has actually
  // put money into one. Otherwise, fall back to progress derived from real
  // accumulated leftover against the savings target — never default to an
  // arbitrary 0% just because the separate Goals feature happens to be empty.
  const goalProgressPct =
    activeGoal && activeGoal.savedAmount > 0
      ? Math.min(100, (activeGoal.savedAmount / activeGoal.targetAmount) * 100)
      : analysis.targetProgressPct ?? null;

  const climb = computeFinancialClimb({
    coachAnalysis: analysis,
    goalProgressPct,
    isOverLimit,
  });

  const weatherInfo = climb.ready ? WEATHER_LABELS[climb.weather] : null;

  return (
    <>
      <Head>
        <title>Coach Tup — Tuppence</title>
        <meta name="theme-color" content="#14213D" />
      </Head>

      <div
        className="max-w-[480px] mx-auto min-h-screen relative pb-12"
        style={{ background: "var(--paper)", boxShadow: "0 0 70px rgba(0,0,0,.35)" }}
      >
        {/* ---- Header ---- */}
        <div
          className="flex items-center justify-between px-5"
          style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 14px", background: "var(--navy)" }}
        >
          <Link href="/" style={{ color: "rgba(244,239,227,.6)", fontSize: 13 }}>
            &larr; Back
          </Link>
          <div className="font-bold uppercase" style={{ color: "var(--copper)", fontSize: 14, letterSpacing: ".1em" }}>
            Coach Tup
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* ---- Climb scene hero ---- */}
        <div className="relative" style={{ height: 230 }}>
          {climb.ready ? (
            <FinancialClimbScene height={climb.height} weather={climb.weather} />
          ) : (
            <div
              style={{
                height: "100%",
                background: "linear-gradient(160deg, #F5E6C8 0%, #D89F66 100%)",
              }}
            />
          )}
          <div
            className="absolute left-0 right-0 bottom-0 flex flex-col items-center pb-4"
            style={{ background: "linear-gradient(to top, rgba(20,15,8,.45), transparent)" }}
          >
            <CoinMascot expression="happy" accessory="coach" size={56} className="coin-bob" />
          </div>
        </div>

        {/* ---- Tup's take ---- */}
        <div className="px-5 pt-5">
          {!analysis.hasEnoughData ? (
            <div
              className="rounded-[18px] p-4 text-center"
              style={{ background: "#fff", boxShadow: "0 4px 16px rgba(140,110,70,.12)" }}
            >
              <div className="font-semibold mb-1" style={{ fontSize: 14.5, color: "var(--ink)" }}>
                Tup needs a bit more to go on
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                Keep logging for a couple of weeks ({Math.max(0, 14 - analysis.daysOfHistory)} more days) and
                I&apos;ll be able to show you real averages and a proper climb.
              </p>
            </div>
          ) : (
            <div
              className="rounded-[18px] p-4"
              style={{ background: "#fff", boxShadow: "0 4px 16px rgba(140,110,70,.12)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ fontSize: 16 }}>{weatherInfo.emoji}</span>
                <span className="font-bold" style={{ fontSize: 14.5, color: "var(--ink)" }}>
                  {weatherInfo.text}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
                {coachLine({ weather: climb.weather, hasGoal: Boolean(savingsTarget), projection: analysis.projection })}
              </p>
            </div>
          )}
        </div>

        {analysis.hasEnoughData && (
          <>
            {/* ---- Income / Spending / Leftover pastel cards ---- */}
            <div className="px-5 pt-5">
              <div
                className="uppercase tracking-wider mb-3"
                style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".1em" }}
              >
                Your monthly average
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <PastelStat
                  label="Income"
                  value={formatMoney(analysis.avgMonthlyIncome)}
                  bg="linear-gradient(150deg, #E3F2EC 0%, #C9E8DA 100%)"
                  color="#2F6B52"
                />
                <PastelStat
                  label="Spending"
                  value={formatMoney(analysis.avgMonthlyExpense)}
                  bg="linear-gradient(150deg, #FBE8DD 0%, #F3CFB6 100%)"
                  color="#A8552B"
                />
                <PastelStat
                  label="Left over"
                  value={formatMoney(analysis.avgMonthlyLeftover)}
                  bg={
                    analysis.avgMonthlyLeftover >= 0
                      ? "linear-gradient(150deg, #E7F0FA 0%, #C9DEF0 100%)"
                      : "linear-gradient(150deg, #FAE4E4 0%, #F0C9C9 100%)"
                  }
                  color={analysis.avgMonthlyLeftover >= 0 ? "#2E5A85" : "#A33B3B"}
                />
              </div>
            </div>

            {/* ---- Category breakdown ---- */}
            {analysis.avgCategoryMonthly.length > 0 && (
              <div className="px-5 pt-6">
                <div
                  className="uppercase tracking-wider mb-3"
                  style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".1em" }}
                >
                  Where it tends to go
                </div>
                <div className="flex flex-col gap-2">
                  {analysis.avgCategoryMonthly.slice(0, 5).map((c) => {
                    const cat = CATEGORIES[c.key] || CATEGORIES.other;
                    const pct = analysis.avgMonthlyExpense > 0 ? (c.avgMonthly / analysis.avgMonthlyExpense) * 100 : 0;
                    return (
                      <div
                        key={c.key}
                        className="flex items-center gap-3 rounded-[14px] p-2.5"
                        style={{ background: "#fff", boxShadow: "0 2px 10px rgba(140,110,70,.08)" }}
                      >
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span className="flex-1" style={{ fontSize: 13, color: "var(--ink)" }}>
                          {cat.label}
                        </span>
                        <span className="mono font-semibold" style={{ fontSize: 13, color: "var(--ink)" }}>
                          {formatMoney(c.avgMonthly)}
                        </span>
                        <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", width: 32, textAlign: "right" }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const cut = suggestSpendingCut(analysis.avgCategoryMonthly, analysis.avgMonthlyExpense);
                  if (!cut) return null;
                  const cutCat = CATEGORIES[cut.key] || CATEGORIES.other;
                  return (
                    <div
                      className="mt-3 rounded-[14px] p-3.5 flex items-start gap-2.5"
                      style={{ background: "linear-gradient(150deg, #FFF3E0 0%, #FCE3C4 100%)" }}
                    >
                      <span style={{ fontSize: 16 }}>💡</span>
                      <p style={{ fontSize: 12.5, color: "#7A4A1F", lineHeight: 1.5 }}>
                        <strong>{cutCat.label}</strong> is taking up {cut.sharePct}% of your spending — the
                        single biggest share. If there&apos;s room to trim it, that&apos;s where it&apos;ll
                        move the needle most.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ---- Savings target + projection ---- */}
            <div className="px-5 pt-6">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="uppercase tracking-wider"
                  style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".1em" }}
                >
                  Savings target
                </span>
                <button
                  onClick={() => setShowTargetModal(true)}
                  className="text-xs font-semibold"
                  style={{ color: "var(--copper)" }}
                >
                  {savingsTarget ? "Edit" : "+ Set one"}
                </button>
              </div>

              {!savingsTarget ? (
                <div
                  className="rounded-[16px] p-4 text-center"
                  style={{ border: "1.5px dashed var(--paper-line)", color: "var(--muted)", fontSize: 13 }}
                >
                  Set a target and Tup can estimate how long it&apos;ll take.
                </div>
              ) : (
                <div className="rounded-[16px] p-4" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(140,110,70,.12)" }}>
                  <div className="mono font-semibold" style={{ fontSize: 18, color: "var(--ink)" }}>
                    {formatMoney(savingsTarget)}
                  </div>
                  {analysis.projection ? (
                    <p className="mt-2" style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
                      At your current average pace, you can reach this in about{" "}
                      <strong>
                        {analysis.projection.yearsToGoal >= 1
                          ? `${analysis.projection.yearsToGoal} years`
                          : `${analysis.projection.monthsToGoal} months`}
                      </strong>
                      .
                    </p>
                  ) : (
                    <p className="mt-2" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                      {analysis.avgMonthlyLeftover <= 0
                        ? "Right now you're not leaving anything over on average, so a timeline wouldn't be honest yet."
                        : "Log a bit more income to get a timeline estimate."}
                    </p>
                  )}
                  <p className="mt-2.5" style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.4 }}>
                    This is a simple estimate based on your average leftover — it doesn&apos;t assume interest
                    or account for one-off expenses.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-center mt-7 px-8" style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
          Everything here comes from what you&apos;ve actually logged — no assumptions, no invented numbers.
        </p>
      </div>

      {showTargetModal && (
        <SavingsTargetModal
          currentTarget={savingsTarget}
          onSave={handleSaveTarget}
          onClose={() => setShowTargetModal(false)}
        />
      )}
    </>
  );
}

function PastelStat({ label, value, bg, color }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: bg }}>
      <div className="mono font-bold" style={{ fontSize: 14, color }}>
        {value}
      </div>
      <div className="uppercase mt-0.5" style={{ fontSize: 9, color, opacity: 0.75, letterSpacing: ".06em" }}>
        {label}
      </div>
    </div>
  );
}
