import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import AuthScreen from "@/components/AuthScreen";
import CoinMascot from "@/components/CoinMascot";
import DonutChart from "@/components/DonutChart";
import TrendBars from "@/components/TrendBars";
import SparkleBurst from "@/components/SparkleBurst";
import BustedBanner from "@/components/BustedBanner";
import MilestoneBanner from "@/components/MilestoneBanner";
import LimitsModal from "@/components/LimitsModal";
import SwipeToDelete from "@/components/SwipeToDelete";
import HealthScoreCard from "@/components/HealthScoreCard";
import GoalsSection from "@/components/GoalsSection";
import NewGoalModal from "@/components/NewGoalModal";
import AddToGoalModal from "@/components/AddToGoalModal";
import GoalCompleteBanner from "@/components/GoalCompleteBanner";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import {
  computeStreak,
  generateRecap,
  detectNewMilestones,
  computeMood,
  computeHealthScore,
  countActiveDaysLast7,
} from "@/lib/insights";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function dayKey(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function monthKey(d) {
  return d.toISOString().slice(0, 7); // YYYY-MM
}
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function groupLabel(d) {
  const now = new Date();
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today - that) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function Home() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [mode, setMode] = useState("expense"); // "expense" | "income"
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("other");
  const [autoCategory, setAutoCategory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [coinFace, setCoinFace] = useState("idle");

  const [dailyLimit, setDailyLimit] = useState(null);
  const [monthlyLimit, setMonthlyLimit] = useState(null);
  const [roastMode, setRoastMode] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [bustedType, setBustedType] = useState(null); // null | "daily" | "monthly"
  const [overDaily, setOverDaily] = useState(false); // true once today's limit is crossed
  const [overMonthly, setOverMonthly] = useState(false); // true once this month's limit is crossed

  const [seenMilestones, setSeenMilestones] = useState([]);
  const [activeMilestone, setActiveMilestone] = useState(null);

  const [goals, setGoals] = useState([]);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [completedGoal, setCompletedGoal] = useState(null);

  // ---- transient signal for "payday" mood: true right after an income add,
  // cleared a few seconds later so the mood doesn't stay stuck on "payday" ----
  const [justAddedIncomeFlag, setJustAddedIncomeFlag] = useState(false);
  const [lastExpenseAmount, setLastExpenseAmount] = useState(0);

  // ---- has the "Busted" popup already been shown for this period? ----
  function bustedShownKey(username, period, key) {
    return `tuppence_busted_${username}_${period}_${key}`;
  }
  function hasShownBusted(period, key) {
    if (!user || typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(bustedShownKey(user.username, period, key)) === "1";
    } catch {
      return false;
    }
  }
  function markBustedShown(period, key) {
    if (!user || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(bustedShownKey(user.username, period, key), "1");
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }

  // ---- check session on load ----
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  // ---- load expenses + incomes + settings + milestones + goals once logged in ----
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      fetch("/api/expenses").then((r) => r.json()),
      fetch("/api/incomes").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/milestones").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
    ])
      .then(([expData, incData, setData, milestoneData, goalsData]) => {
        setExpenses(expData.expenses || []);
        setIncomes(incData.incomes || []);
        setDailyLimit(setData.dailyLimit ?? null);
        setMonthlyLimit(setData.monthlyLimit ?? null);
        setRoastMode(Boolean(setData.roastMode));
        setSeenMilestones(milestoneData.seen || []);
        setGoals(goalsData.goals || []);
      })
      .catch(() => {
        setExpenses([]);
        setIncomes([]);
      })
      .finally(() => setLoadingData(false));
  }, [user]);

  // ---- live category preview while typing reason (client-side, instant) ----

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const wkStart = startOfWeek(now);
    const lastWkStart = new Date(wkStart.getTime() - 7 * 86400000);
    let todaySum = 0,
      weekSum = 0,
      lastWeekSum = 0,
      monthSum = 0;
    const monthByCat = {};

    expenses.forEach((x) => {
      const d = new Date(x.ts);
      if (d >= dayStart) todaySum += x.amount;
      if (d >= wkStart) weekSum += x.amount;
      if (d >= lastWkStart && d < wkStart) lastWeekSum += x.amount;
      if (sameMonth(d, now)) {
        monthSum += x.amount;
        monthByCat[x.category] = (monthByCat[x.category] || 0) + x.amount;
      }
    });

    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    const sums = months.map((m) => {
      let s = 0;
      expenses.forEach((x) => {
        const d = new Date(x.ts);
        if (d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth()) s += x.amount;
      });
      return s;
    });
    const monthLabels = months.map((m) => m.toLocaleDateString("en-IN", { month: "short" }));

    const totalIncome = incomes.reduce((sum, x) => sum + x.amount, 0);
    const totalExpense = expenses.reduce((sum, x) => sum + x.amount, 0);
    const balance = totalIncome - totalExpense;

    const dailyPct = dailyLimit ? (todaySum / dailyLimit) * 100 : null;
    const monthlyPct = monthlyLimit ? (monthSum / monthlyLimit) * 100 : null;

    const streak = computeStreak(expenses, now);
    const recap = generateRecap({ todaySum, weekSum, lastWeekSum, monthByCat, monthSum });

    const mood = computeMood(
      {
        balance,
        isOverLimit: Boolean((dailyLimit && todaySum > dailyLimit) || (monthlyLimit && monthSum > monthlyLimit)),
        justAddedIncome: justAddedIncomeFlag,
        lastExpenseAmount,
        monthlyLimit,
        monthSum,
      },
      roastMode
    );

    const last7DaysLoggedCount = countActiveDaysLast7(
      [...expenses, ...incomes].map((x) => ({ ts: x.ts })),
      now
    );
    const healthScore = computeHealthScore({
      monthSum,
      monthlyLimit,
      totalIncome,
      totalExpense,
      last7DaysLoggedCount,
    });

    return {
      todaySum,
      weekSum,
      monthSum,
      monthByCat,
      monthLabels,
      sums,
      balance,
      dailyPct,
      monthlyPct,
      streak,
      recap,
      mood,
      healthScore,
    };
  }, [expenses, incomes, dailyLimit, monthlyLimit, roastMode, justAddedIncomeFlag, lastExpenseAmount]);

  // ---- keep the persistent over-limit badges in sync (covers page refresh too) ----
  useEffect(() => {
    setOverDaily(Boolean(dailyLimit && stats.todaySum > dailyLimit));
    setOverMonthly(Boolean(monthlyLimit && stats.monthSum > monthlyLimit));
  }, [stats.todaySum, stats.monthSum, dailyLimit, monthlyLimit]);

  // ---- detect newly-reached milestones once data has loaded ----
  useEffect(() => {
    if (loadingData || expenses.length === 0) return;
    const newOnes = detectNewMilestones(expenses, seenMilestones);
    if (newOnes.length > 0 && !activeMilestone) {
      const next = newOnes[0];
      setActiveMilestone(next);
      setSeenMilestones((prev) => [...prev, next.key]);
      fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: next.key }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses.length, loadingData]);

  const grouped = useMemo(() => {
    const taggedExpenses = expenses.map((x) => ({ ...x, kind: "expense" }));
    const taggedIncomes = incomes.map((x) => ({ ...x, kind: "income" }));
    const sorted = [...taggedExpenses, ...taggedIncomes].sort((a, b) => b.ts - a.ts);
    const groups = [];
    let lastLabel = null;
    sorted.forEach((x) => {
      const label = groupLabel(new Date(x.ts));
      if (label !== lastLabel) {
        groups.push({ label, items: [] });
        lastLabel = label;
      }
      groups[groups.length - 1].items.push(x);
    });
    return groups;
  }, [expenses, incomes]);

  function detectLocalCategory(text) {
    // Mirrors lib/categories.js logic client-side for instant preview.
    const t = (text || "").toLowerCase();
    const KEYWORDS = {
      food: ["swiggy", "zomato", "restaurant", "cafe", "food", "lunch", "dinner", "breakfast", "coffee", "pizza", "burger"],
      groceries: ["grocery", "groceries", "supermarket", "vegetable", "milk", "walmart", "costco"],
      transport: ["uber", "ola", "taxi", "bus", "train", "metro", "fuel", "petrol", "gas", "parking", "cab"],
      shopping: ["amazon", "flipkart", "clothes", "shoes", "mall", "shopping", "dress"],
      bills: ["electricity", "recharge", "internet", "wifi", "bill", "phone bill"],
      entertainment: ["movie", "netflix", "spotify", "concert", "game", "cinema"],
      health: ["medicine", "doctor", "hospital", "pharmacy", "gym", "clinic"],
      housing: ["rent", "maintenance", "emi", "mortgage"],
      education: ["course", "tuition", "fees", "school", "college", "class"],
      travel: ["hotel", "flight", "trip", "vacation", "airbnb", "resort"],
      personal: ["salon", "spa", "haircut"],
    };
    for (const key in KEYWORDS) {
      if (KEYWORDS[key].some((w) => t.includes(w))) return key;
    }
    return "other";
  }

  function handleReasonChange(val) {
    setReason(val);
    if (autoCategory) {
      setCategory(detectLocalCategory(val));
    }
  }

  function handleCategoryChange(val) {
    setCategory(val);
    setAutoCategory(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (mode === "expense" && !reason.trim()) return;

    setSubmitting(true);
    try {
      if (mode === "income") {
        const res = await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: numAmount, source: reason.trim() || "Income" }),
        });
        const data = await res.json();
        if (res.ok) {
          setIncomes((prev) => [data.income, ...prev]);
          setAmount("");
          setReason("");
          setJustAdded(true);
          setCoinFace("happy");
          setJustAddedIncomeFlag(true);
          setTimeout(() => setJustAdded(false), 900);
          setTimeout(() => setCoinFace("idle"), 1400);
          setTimeout(() => setJustAddedIncomeFlag(false), 6000);
        }
        return;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, reason: reason.trim(), category }),
      });
      const data = await res.json();
      if (res.ok) {
        const newExpense = data.expense;
        const updatedExpenses = [newExpense, ...expenses];
        setExpenses(updatedExpenses);
        setAmount("");
        setReason("");
        setCategory("other");
        setAutoCategory(true);
        setJustAdded(true);
        setLastExpenseAmount(numAmount);
        setTimeout(() => setLastExpenseAmount(0), 8000);

        // ---- check limits with the freshly updated totals ----
        const now = new Date();
        const dayStart = startOfDay(now);
        let newTodaySum = 0;
        let newMonthSum = 0;
        updatedExpenses.forEach((x) => {
          const d = new Date(x.ts);
          if (d >= dayStart) newTodaySum += x.amount;
          if (sameMonth(d, now)) newMonthSum += x.amount;
        });

        const dailyOver = Boolean(dailyLimit && newTodaySum > dailyLimit);
        const monthlyOver = Boolean(monthlyLimit && newMonthSum > monthlyLimit);

        const dKey = dayKey(now);
        const mKey = monthKey(now);
        const dailyFirstTime = dailyOver && !hasShownBusted("daily", dKey);
        const monthlyFirstTime = monthlyOver && !hasShownBusted("monthly", mKey);

        if (dailyFirstTime || monthlyFirstTime) {
          setCoinFace("busted");
          setBustedType(dailyFirstTime ? "daily" : "monthly");
          if (dailyFirstTime) markBustedShown("daily", dKey);
          if (monthlyFirstTime) markBustedShown("monthly", mKey);
        } else {
          setCoinFace("happy");
          setTimeout(() => setCoinFace("idle"), 1400);
        }

        setTimeout(() => setJustAdded(false), 900);
      }
    } catch {
      // silently fail, keep their input so they can retry
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, kind) {
    if (kind === "income") {
      setIncomes((prev) => prev.filter((x) => x.id !== id));
      try {
        await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      } catch {
        // best-effort; a refresh will resync
      }
      return;
    }
    setExpenses((prev) => prev.filter((x) => x.id !== id));
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    } catch {
      // best-effort; a refresh will resync
    }
  }

  async function handleSaveLimits({ dailyLimit: dl, monthlyLimit: ml, roastMode: rm }) {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLimit: dl, monthlyLimit: ml, roastMode: rm }),
      });
      const data = await res.json();
      if (res.ok) {
        setDailyLimit(data.dailyLimit);
        setMonthlyLimit(data.monthlyLimit);
        setRoastMode(Boolean(data.roastMode));
      }
    } catch {
      // best effort
    } finally {
      setShowLimitsModal(false);
    }
  }

  async function handleCreateGoal({ title, targetAmount }) {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, targetAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals((prev) => [data.goal, ...prev]);
      }
    } catch {
      // best effort
    } finally {
      setShowNewGoalModal(false);
    }
  }

  async function handleAddToGoal(addAmount) {
    if (!selectedGoal) return;
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals((prev) => prev.map((g) => (g.id === data.goal.id ? data.goal : g)));
        if (data.justCompleted) {
          setCompletedGoal(data.goal);
        }
      }
    } catch {
      // best effort
    } finally {
      setSelectedGoal(null);
    }
  }

  async function handleDeleteGoal() {
    if (!selectedGoal) return;
    const id = selectedGoal.id;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSelectedGoal(null);
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
    } catch {
      // best-effort; a refresh will resync
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setExpenses([]);
    setIncomes([]);
    setDailyLimit(null);
    setMonthlyLimit(null);
    setRoastMode(false);
    setGoals([]);
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
        <CoinMascot expression="idle" size={56} className="coin-bob" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthed={(u) => setUser(u)} />;
  }

  const c = CATEGORIES[category] || CATEGORIES.other;

  return (
    <>
      <Head>
        <title>Tuppence — your fun little ledger</title>
        <meta
          name="description"
          content="A playful expense ledger that auto-categorizes what you spend and shows you exactly where it goes."
        />
        <meta name="theme-color" content="#14213D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tuppence" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="max-w-[480px] mx-auto min-h-screen relative pb-10"
        style={{ background: "var(--paper)", boxShadow: "0 0 70px rgba(0,0,0,.35)" }}
      >
        {/* ---- Cover ---- */}
        <div
          className="relative"
          style={{
            background: "var(--navy)",
            color: "var(--cream)",
            padding: "calc(28px + env(safe-area-inset-top)) 24px 56px",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className="font-bold uppercase"
                style={{ fontSize: 24, letterSpacing: ".16em", color: "var(--copper)" }}
              >
                Tuppence
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(244,239,227,.55)" }}>
                Hey {capitalize(user.username)} — here&apos;s the damage
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CoinMascot
                expression={justAdded ? coinFace : stats.mood.face}
                size={40}
                className={justAdded ? "coin-spin" : "coin-bob"}
              />
            </div>
          </div>

          <div className="flex items-end justify-between mt-6">
            <div>
              <div className="mono font-semibold" style={{ fontSize: 42, letterSpacing: "-.01em" }}>
                {formatMoney(stats.monthSum)}
              </div>
              <div
                className="uppercase mt-0.5"
                style={{ fontSize: 11.5, letterSpacing: ".12em", color: "rgba(244,239,227,.5)" }}
              >
                spent this month
              </div>
              {(stats.mood.line || stats.recap) && (
                <div
                  className="mt-2 flex items-start gap-1.5"
                  style={{ maxWidth: 230 }}
                >
                  <span style={{ fontSize: 12, lineHeight: 1.4 }}>🪙</span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--gold)", lineHeight: 1.4, fontWeight: 500 }}
                  >
                    {stats.mood.line || stats.recap}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right pb-1">
              <div
                className="mono font-semibold"
                style={{ fontSize: 18, color: stats.balance < 0 ? "#E08A6E" : "var(--mint)" }}
              >
                {formatMoney(stats.balance)}
              </div>
              <div
                className="uppercase mt-0.5"
                style={{ fontSize: 9.5, letterSpacing: ".1em", color: "rgba(244,239,227,.45)" }}
              >
                balance
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {stats.streak.current >= 2 && (
              <div
                className="flex items-center gap-1 rounded-full"
                style={{ background: "rgba(244,239,227,.1)", padding: "3px 8px 3px 6px" }}
                title={`${stats.streak.current}-day logging streak`}
              >
                <span style={{ fontSize: 11.5 }}>🔥</span>
                <span className="mono font-semibold" style={{ fontSize: 11, color: "var(--gold)" }}>
                  {stats.streak.current}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowLimitsModal(true)}
              className="text-[10px] px-2 py-1 flex items-center gap-1"
              style={{ color: "rgba(244,239,227,.4)" }}
            >
              {(overDaily || overMonthly) && (
                <span
                  className="inline-block rounded-full"
                  style={{ width: 6, height: 6, background: "var(--rust)" }}
                  aria-label="Over a spending limit"
                />
              )}
              limits
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] px-2 py-1"
              style={{ color: "rgba(244,239,227,.4)" }}
            >
              log out
            </button>
          </div>
        </div>

        {/* ---- Quick add ---- */}
        <form
          onSubmit={handleSubmit}
          className="relative z-[2]"
          style={{
            background: "var(--paper)",
            margin: "-32px 16px 0",
            borderRadius: "var(--radius)",
            boxShadow: "0 10px 28px rgba(20,33,61,.22)",
            padding: "20px 18px 18px",
            border: "1px solid var(--paper-line)",
          }}
        >
          <div className="flex gap-1.5 mb-4" style={{ background: "var(--cream)", borderRadius: 10, padding: 3 }}>
            <button
              type="button"
              onClick={() => setMode("expense")}
              className="flex-1 font-bold rounded-[8px]"
              style={{
                padding: "8px 0",
                fontSize: 12.5,
                letterSpacing: ".02em",
                background: mode === "expense" ? "var(--copper)" : "transparent",
                color: mode === "expense" ? "var(--cream)" : "var(--muted)",
                transition: "all .15s",
              }}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setMode("income")}
              className="flex-1 font-bold rounded-[8px]"
              style={{
                padding: "8px 0",
                fontSize: 12.5,
                letterSpacing: ".02em",
                background: mode === "income" ? "var(--mint)" : "transparent",
                color: mode === "income" ? "var(--navy)" : "var(--muted)",
                transition: "all .15s",
              }}
            >
              Income
            </button>
          </div>

          <div className="flex gap-3.5 items-end relative">
            <div className="flex-1">
              <label
                className="block uppercase tracking-wider mb-1.5"
                style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
              >
                Amount
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent outline-none py-2 font-semibold"
                style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 22, color: "var(--ink)" }}
              />
            </div>
            {mode === "expense" && (
              <div
                className="relative flex-shrink-0 rounded-full flex items-center justify-center mono font-bold"
                style={{
                  width: 48,
                  height: 48,
                  border: `2px dashed ${c.color}`,
                  color: c.color,
                  fontSize: 8.5,
                  letterSpacing: ".03em",
                  transform: "rotate(-6deg)",
                  transition: "border-color .15s,color .15s",
                }}
              >
                {c.code}
                {justAdded && <SparkleBurst count={6} />}
              </div>
            )}
          </div>

          <div className="mt-3.5">
            <label
              className="block uppercase tracking-wider mb-1.5"
              style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
            >
              {mode === "expense" ? "What was it for?" : "Where's it from?"}
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder={mode === "expense" ? "e.g. Swiggy dinner, Ola ride" : "e.g. Salary, freelance gig"}
              required={mode === "expense"}
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full bg-transparent outline-none py-2"
              style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 16, color: "var(--ink)" }}
            />
          </div>

          {mode === "expense" && (
            <div className="mt-3.5">
              <label
                className="block uppercase tracking-wider mb-1.5"
                style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-transparent outline-none py-2"
                style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 16, color: "var(--ink)" }}
              >
                {Object.keys(CATEGORIES).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full font-bold rounded-[11px] disabled:opacity-60"
            style={{
              background: mode === "expense" ? "var(--copper)" : "var(--mint)",
              color: mode === "expense" ? "var(--cream)" : "var(--navy)",
              padding: "13px",
              fontSize: 15,
              letterSpacing: ".02em",
            }}
          >
            {submitting ? "Adding…" : mode === "expense" ? "Add to ledger" : "Add income"}
          </button>
        </form>

        {/* ---- Limits progress ---- */}
        {(dailyLimit || monthlyLimit) && (
          <div className="px-4 pt-[26px]">
            <div className="uppercase tracking-wider mb-3 ml-0.5" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}>
              Your limits
            </div>
            <div
              className="rounded-[18px] p-4"
              style={{ border: "1px solid var(--paper-line)" }}
            >
              {dailyLimit && (
                <LimitBar
                  label="Today"
                  spent={stats.todaySum}
                  limit={dailyLimit}
                  pct={stats.dailyPct}
                />
              )}
              {dailyLimit && monthlyLimit && <div className="h-3.5" />}
              {monthlyLimit && (
                <LimitBar
                  label="This month"
                  spent={stats.monthSum}
                  limit={monthlyLimit}
                  pct={stats.monthlyPct}
                />
              )}
            </div>
          </div>
        )}

        {/* ---- Overview stats ---- */}
        <div className="px-4 pt-[26px]">
          <div className="uppercase tracking-wider mb-3 ml-0.5" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}>
            Overview
          </div>
          <div className="flex rounded-[18px] overflow-hidden" style={{ border: "1px solid var(--paper-line)" }}>
            <Stat label="Today" value={formatMoney(stats.todaySum)} />
            <Stat label="This week" value={formatMoney(stats.weekSum)} border />
            <Stat label="This month" value={formatMoney(stats.monthSum)} border />
          </div>
        </div>

        {/* ---- Health score ---- */}
        <div className="px-4 pt-[26px]">
          <HealthScoreCard score={stats.healthScore} />
        </div>

        {/* ---- Goals ---- */}
        <GoalsSection
          goals={goals}
          onAddNew={() => setShowNewGoalModal(true)}
          onSelectGoal={(g) => setSelectedGoal(g)}
        />

        {/* ---- Donut ---- */}
        <div className="px-4 pt-[26px]">
          <div className="uppercase tracking-wider mb-3 ml-0.5" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}>
            Where it&apos;s going
          </div>
          <DonutChart monthByCat={stats.monthByCat} monthSum={stats.monthSum} />
        </div>

        {/* ---- Trend ---- */}
        <div className="px-4 pt-[26px]">
          <div className="uppercase tracking-wider mb-3 ml-0.5" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}>
            Last 6 months
          </div>
          <TrendBars months={stats.monthLabels} sums={stats.sums} />
        </div>

        {/* ---- Ledger ---- */}
        <div className="px-4 pt-[26px]">
          <div className="uppercase tracking-wider mb-3 ml-0.5" style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: ".12em" }}>
            Recent entries
          </div>
          <div className="rounded-[18px] overflow-hidden" style={{ background: "var(--paper)", border: "1px solid var(--paper-line)" }}>
            {loadingData ? (
              <div className="text-center py-9 px-5" style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Loading your ledger…
              </div>
            ) : grouped.length === 0 ? (
              <div className="text-center py-10 px-5">
                <CoinMascot expression="idle" size={48} className="coin-bob" style={{ margin: "0 auto 12px" }} />
                <div style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
                  Tup&apos;s waiting on your first entry.
                  <br />
                  Add an expense above and it&apos;ll show up here.
                </div>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div
                    className="uppercase tracking-wider"
                    style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".1em", padding: "12px 16px 6px", background: "var(--paper)" }}
                  >
                    {group.label}
                  </div>
                  {group.items.map((x, idx) => {
                    const isIncome = x.kind === "income";
                    const cat = isIncome ? null : CATEGORIES[x.category] || CATEGORIES.other;
                    const d = new Date(x.ts);
                    return (
                      <SwipeToDelete key={`${x.kind}-${x.id}`} onDelete={() => handleDelete(x.id, x.kind)}>
                        <div
                          className={`flex items-center gap-3 relative ${idx === 0 ? "row-in" : ""}`}
                          style={{
                            padding: "11px 14px 11px 16px",
                            borderBottom: "1px dashed var(--paper-line)",
                            background: "var(--paper)",
                          }}
                        >
                          <div
                            className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
                            style={{
                              width: 38,
                              height: 38,
                              fontSize: isIncome ? 16 : 7,
                              letterSpacing: ".02em",
                              border: `1.5px dashed ${isIncome ? "var(--mint)" : cat.color}`,
                              color: isIncome ? "var(--mint)" : cat.color,
                              transform: "rotate(-5deg)",
                            }}
                          >
                            {isIncome ? "+" : cat.code}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate" style={{ fontSize: 14 }}>
                              {isIncome ? x.source : x.reason}
                            </div>
                            <div className="mt-0.5" style={{ fontSize: 11, color: "var(--muted)" }}>
                              {isIncome ? "Income" : cat.label} &middot;{" "}
                              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div
                            className="mono font-semibold whitespace-nowrap"
                            style={{ fontSize: 14.5, color: isIncome ? "var(--mint)" : "var(--rust)" }}
                          >
                            {isIncome ? "+" : ""}
                            {formatMoney(x.amount)}
                          </div>
                        </div>
                      </SwipeToDelete>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-center mt-4 px-6" style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
          Logged in as <strong>{user.username}</strong>. Your entries sync to your account —
          open Tuppence on any device and they&apos;ll be right here.
        </p>
      </div>

      {showLimitsModal && (
        <LimitsModal
          dailyLimit={dailyLimit}
          monthlyLimit={monthlyLimit}
          roastMode={roastMode}
          onSave={handleSaveLimits}
          onClose={() => setShowLimitsModal(false)}
        />
      )}

      {bustedType && (
        <BustedBanner type={bustedType} onDismiss={() => setBustedType(null)} />
      )}

      {showNewGoalModal && (
        <NewGoalModal onSave={handleCreateGoal} onClose={() => setShowNewGoalModal(false)} />
      )}

      {selectedGoal && (
        <AddToGoalModal
          goal={selectedGoal}
          onSave={handleAddToGoal}
          onClose={() => setSelectedGoal(null)}
          onDeleteGoal={handleDeleteGoal}
        />
      )}

      {completedGoal && (
        <GoalCompleteBanner goal={completedGoal} onDismiss={() => setCompletedGoal(null)} />
      )}

      {!bustedType && activeMilestone && (
        <MilestoneBanner milestone={activeMilestone} onDismiss={() => setActiveMilestone(null)} />
      )}
    </>
  );
}

function Stat({ label, value, border }) {
  return (
    <div
      className="flex-1 text-center py-3.5 px-2.5"
      style={border ? { borderLeft: "1px dashed var(--paper-line)" } : {}}
    >
      <div className="mono font-semibold" style={{ fontSize: 17 }}>
        {value}
      </div>
      <div className="uppercase tracking-wider mt-0.5" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".08em" }}>
        {label}
      </div>
    </div>
  );
}

function LimitBar({ label, spent, limit, pct }) {
  const clamped = Math.min(pct, 100);
  const over = pct >= 100;
  const warn = !over && pct >= 80;
  const barColor = over ? "var(--rust)" : warn ? "var(--gold)" : "var(--mint)";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{label}</span>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
          {formatMoney(spent)} / {formatMoney(limit)}
        </span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 8, background: "var(--paper-line)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, background: barColor }}
        />
      </div>
      {over && (
        <div className="mt-1" style={{ fontSize: 11, color: "var(--rust)", fontWeight: 600 }}>
          Over by {formatMoney(spent - limit)}
        </div>
      )}
      {warn && (
        <div className="mt-1" style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>
          Getting close — {Math.round(pct)}% used
        </div>
      )}
    </div>
  );
}
