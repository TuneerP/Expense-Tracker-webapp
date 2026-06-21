import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import AuthScreen from "@/components/AuthScreen";
import CoinMascot from "@/components/CoinMascot";
import DonutChart from "@/components/DonutChart";
import TrendBars from "@/components/TrendBars";
import SparkleBurst from "@/components/SparkleBurst";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

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
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("other");
  const [autoCategory, setAutoCategory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [coinFace, setCoinFace] = useState("idle");

  // ---- check session on load ----
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  // ---- load expenses once logged in ----
  useEffect(() => {
    if (!user) return;
    setLoadingExpenses(true);
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses || []))
      .catch(() => setExpenses([]))
      .finally(() => setLoadingExpenses(false));
  }, [user]);

  // ---- live category preview while typing reason (client-side, instant) ----

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const wkStart = startOfWeek(now);
    let todaySum = 0,
      weekSum = 0,
      monthSum = 0;
    const monthByCat = {};

    expenses.forEach((x) => {
      const d = new Date(x.ts);
      if (d >= dayStart) todaySum += x.amount;
      if (d >= wkStart) weekSum += x.amount;
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

    return { todaySum, weekSum, monthSum, monthByCat, monthLabels, sums };
  }, [expenses]);

  const grouped = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.ts - a.ts);
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
  }, [expenses]);

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
    if (!numAmount || numAmount <= 0 || !reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, reason: reason.trim(), category }),
      });
      const data = await res.json();
      if (res.ok) {
        setExpenses((prev) => [data.expense, ...prev]);
        setAmount("");
        setReason("");
        setCategory("other");
        setAutoCategory(true);
        setJustAdded(true);
        setCoinFace("happy");
        setTimeout(() => setJustAdded(false), 900);
        setTimeout(() => setCoinFace("idle"), 1400);
      }
    } catch {
      // silently fail, keep their input so they can retry
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setExpenses((prev) => prev.filter((x) => x.id !== id));
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    } catch {
      // best-effort; a refresh will resync
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setExpenses([]);
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
                hey {user.username} — here&apos;s the damage
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CoinMascot expression={coinFace} size={40} className={justAdded ? "coin-spin" : "coin-bob"} />
            </div>
          </div>
          <div className="mono font-semibold mt-6" style={{ fontSize: 42, letterSpacing: "-.01em" }}>
            {formatMoney(stats.monthSum)}
          </div>
          <div
            className="uppercase mt-0.5"
            style={{ fontSize: 11.5, letterSpacing: ".12em", color: "rgba(244,239,227,.5)" }}
          >
            spent this month
          </div>
          <button
            onClick={handleLogout}
            className="absolute top-2 right-2 text-[10px] px-2 py-1"
            style={{ color: "rgba(244,239,227,.4)" }}
          >
            log out
          </button>
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
          </div>

          <div className="mt-3.5">
            <label
              className="block uppercase tracking-wider mb-1.5"
              style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: ".1em" }}
            >
              What was it for?
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="e.g. Swiggy dinner, Ola ride"
              required
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full bg-transparent outline-none py-2"
              style={{ borderBottom: "1.5px solid var(--paper-line)", fontSize: 16, color: "var(--ink)" }}
            />
          </div>

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

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full font-bold rounded-[11px] disabled:opacity-60"
            style={{ background: "var(--copper)", color: "var(--cream)", padding: "13px", fontSize: 15, letterSpacing: ".02em" }}
          >
            {submitting ? "Adding…" : "Add to ledger"}
          </button>
        </form>

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
            {loadingExpenses ? (
              <div className="text-center py-9 px-5" style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Loading your ledger…
              </div>
            ) : grouped.length === 0 ? (
              <div className="text-center py-9 px-5" style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
                Nothing logged yet.
                <br />
                Add your first expense above and it&apos;ll show up here.
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
                    const cat = CATEGORIES[x.category] || CATEGORIES.other;
                    const d = new Date(x.ts);
                    return (
                      <div
                        key={x.id}
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
                            fontSize: 7,
                            letterSpacing: ".02em",
                            border: `1.5px dashed ${cat.color}`,
                            color: cat.color,
                            transform: "rotate(-5deg)",
                          }}
                        >
                          {cat.code}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" style={{ fontSize: 14 }}>
                            {x.reason}
                          </div>
                          <div className="mt-0.5" style={{ fontSize: 11, color: "var(--muted)" }}>
                            {cat.label} &middot; {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="mono font-semibold whitespace-nowrap" style={{ fontSize: 14.5, color: "var(--rust)" }}>
                          {formatMoney(x.amount)}
                        </div>
                        <button
                          onClick={() => handleDelete(x.id)}
                          aria-label="Delete entry"
                          className="leading-none"
                          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, padding: "4px 2px 4px 8px", cursor: "pointer" }}
                        >
                          &times;
                        </button>
                      </div>
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
