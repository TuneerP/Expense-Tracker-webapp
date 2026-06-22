// All functions here are pure (no side effects), so they're easy to unit test
// and reuse between the client and, if ever needed, the server.

function toDayKey(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Counts how many of the last 7 days (including today) had at least one
 * expense or income entry logged.
 */
export function countActiveDaysLast7(items, now = new Date()) {
  if (!items || items.length === 0) return 0;
  const todayKey = toDayKey(now.getTime());
  const oneDay = 86400000;
  const windowStart = todayKey - 6 * oneDay;
  const days = new Set();
  items.forEach((x) => {
    const k = toDayKey(x.ts);
    if (k >= windowStart && k <= todayKey) days.add(k);
  });
  return days.size;
}

/**
 * Computes the current consecutive-day logging streak, counting backward
 * from today. A day "counts" if at least one expense was logged that day.
 * If nothing was logged today yet, we still count the streak as long as
 * yesterday continues an unbroken chain (so the streak doesn't visually
 * vanish at midnight before you've had a chance to log today).
 */
export function computeStreak(expenses, now = new Date()) {
  if (!expenses || expenses.length === 0) return { current: 0, loggedToday: false };

  const days = new Set(expenses.map((x) => toDayKey(x.ts)));
  const todayKey = toDayKey(now.getTime());
  const oneDay = 86400000;

  const loggedToday = days.has(todayKey);
  let cursor = loggedToday ? todayKey : todayKey - oneDay;
  let count = 0;

  // If today has no entry, the streak is "alive" only if yesterday has one;
  // otherwise it's already broken and should show 0.
  if (!loggedToday && !days.has(cursor)) {
    return { current: 0, loggedToday: false };
  }

  while (days.has(cursor)) {
    count++;
    cursor -= oneDay;
  }

  return { current: count, loggedToday };
}

/**
 * Generates a short, varied one-line "Tup's take" based on recent spending
 * patterns. Returns null if there isn't enough data to say anything useful.
 * Picks the single most informative line rather than rotating arbitrarily,
 * so the same underlying data always produces the same takeaway.
 */
export function generateRecap({ todaySum, weekSum, lastWeekSum, monthByCat, monthSum }) {
  // Priority order: a significant week-over-week change is the most useful
  // thing to flag, then today's quietness, then a general category callout.
  if (lastWeekSum > 0 && weekSum > 0) {
    const diff = weekSum - lastWeekSum;
    const pct = Math.round((Math.abs(diff) / lastWeekSum) * 100);
    if (pct >= 15) {
      return diff > 0
        ? `Spending ${pct}% higher than last week.`
        : `Spending ${pct}% lower than last week — nice.`;
    }
  }

  if (todaySum === 0) {
    return "Nothing logged yet today — a quiet one so far.";
  }
  if (todaySum < 100) {
    return "Light spending today. Tup approves.";
  }

  if (monthSum > 0 && monthByCat && Object.keys(monthByCat).length > 0) {
    const top = Object.entries(monthByCat).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      return `Biggest category this month: ${top[0]}.`;
    }
  }

  return null;
}

/**
 * Checks which milestones the user has newly reached, given their full
 * expense history and a set of milestone keys already shown to them.
 * Returns an array of { key, title, message } for any NOT yet shown.
 */
export function detectNewMilestones(expenses, alreadySeen) {
  const seen = new Set(alreadySeen || []);
  const found = [];
  const count = expenses.length;

  const countMilestones = [
    { n: 1, key: "first_expense", title: "First entry!", message: "You logged your first expense. Tup is proud." },
    { n: 10, key: "ten_expenses", title: "10 logged!", message: "Double digits. You're building a real habit." },
    { n: 50, key: "fifty_expenses", title: "50 logged!", message: "Tup is genuinely impressed at this point." },
    { n: 100, key: "hundred_expenses", title: "100 logged!", message: "A full century of expenses tracked." },
  ];

  countMilestones.forEach((m) => {
    if (count >= m.n && !seen.has(m.key)) {
      found.push(m);
    }
  });

  // Distinct calendar months with at least one entry, to detect "first full month".
  const months = new Set(expenses.map((x) => new Date(x.ts).toISOString().slice(0, 7)));
  if (months.size >= 1 && !seen.has("first_month")) {
    const now = new Date();
    const earliestMonth = [...months].sort()[0];
    const currentMonth = now.toISOString().slice(0, 7);
    // "completed" a month once we're now in a later month than the first entry's month
    if (earliestMonth < currentMonth) {
      found.push({
        key: "first_month",
        title: "First month done!",
        message: "You made it through a full month of tracking.",
      });
    }
  }

  return found;
}

/**
 * Determines Tup's current mood from the user's live financial snapshot,
 * along with a one-line reaction in either a polite or "roast mode" tone.
 * Priority order (highest first): busted > broke > big expense > payday > happy > neutral.
 * Only one mood is ever active at a time, so this is deterministic — the
 * same inputs always produce the same mood and line, no randomness.
 *
 * @param {object} s - { balance, isOverLimit, justAddedIncome, lastExpenseAmount, monthlyLimit, todaySum, monthSum }
 * @param {boolean} roastMode
 */
export function computeMood(s, roastMode = false) {
  const {
    balance = 0,
    isOverLimit = false,
    justAddedIncome = false,
    lastExpenseAmount = 0,
    monthlyLimit = null,
    monthSum = 0,
  } = s || {};

  // ---- Busted: actively over a limit right now ----
  if (isOverLimit) {
    return {
      mood: "panicking",
      face: "busted",
      line: roastMode
        ? "Your wallet has filed a complaint."
        : "You've gone over your limit. No judgment — just flagging it.",
    };
  }

  // ---- Broke: balance is critically low ----
  if (balance < 500) {
    return {
      mood: "concerned",
      face: "worried",
      line: roastMode
        ? "Maybe skip ordering food today."
        : "Balance is looking thin right now.",
    };
  }

  // ---- Big expense: this single expense ate a large chunk of the monthly budget ----
  if (monthlyLimit && lastExpenseAmount > 0 && lastExpenseAmount >= monthlyLimit * 0.2) {
    return {
      mood: "concerned",
      face: "worried",
      line: roastMode ? "That one hurt a little, didn't it." : "That was a big one — noted.",
    };
  }

  // ---- Payday: income was just added ----
  if (justAddedIncome) {
    return {
      mood: "happy",
      face: "happy",
      line: roastMode ? "Salary received. We feast." : "Income added — nice.",
    };
  }

  // ---- Rich: balance is comfortably high ----
  if (balance > 50000) {
    return {
      mood: "happy",
      face: "happy",
      line: roastMode ? "Looking comfortable there, big spender." : "Looking comfortable there.",
    };
  }

  // ---- Default calm state ----
  if (monthSum === 0) {
    return { mood: "neutral", face: "idle", line: null };
  }

  return {
    mood: "neutral",
    face: "idle",
    line: roastMode ? "Steady as she goes." : "Things look steady.",
  };
}

/**
 * Calculates a 0-100 financial health score from three weighted factors,
 * returning the breakdown alongside the total so the UI can show its
 * reasoning rather than presenting an opaque number.
 *
 * - Budget adherence (40 pts): how far under the monthly limit you are.
 * - Savings rate (35 pts): income minus expenses, as a share of income.
 * - Consistency (25 pts): how many of the last 7 days had logged activity,
 *   as a proxy for actually paying attention rather than ignoring the app.
 */
export function computeHealthScore({ monthSum, monthlyLimit, totalIncome, totalExpense, last7DaysLoggedCount }) {
  let budgetScore = 40;
  if (monthlyLimit && monthlyLimit > 0) {
    const ratio = monthSum / monthlyLimit;
    if (ratio <= 1) {
      budgetScore = Math.round(40 * (1 - ratio * 0.5)); // 1.0 used -> 20pts, 0 used -> 40pts
    } else {
      budgetScore = Math.max(0, Math.round(20 - (ratio - 1) * 40)); // over budget tapers toward 0
    }
  }

  let savingsScore = 17; // neutral default when there's no income data at all
  if (totalIncome > 0) {
    const savingsRate = (totalIncome - totalExpense) / totalIncome;
    savingsScore = Math.round(Math.max(0, Math.min(1, savingsRate + 0.3)) * 35);
  } else if (totalExpense > 0) {
    savingsScore = 5; // spending with zero logged income isn't a great signal
  }

  const consistencyScore = Math.round((Math.min(7, last7DaysLoggedCount) / 7) * 25);

  const total = Math.max(0, Math.min(100, budgetScore + savingsScore + consistencyScore));

  let label;
  if (total >= 85) label = { emoji: "🔥", text: "Budget Ninja" };
  else if (total >= 65) label = { emoji: "🌱", text: "Careful Saver" };
  else if (total >= 40) label = { emoji: "⚖️", text: "Getting There" };
  else label = { emoji: "💸", text: "Certified Menace" };

  return {
    total,
    label,
    breakdown: [
      { name: "Staying under budget", points: budgetScore, max: 40 },
      { name: "Saving money", points: savingsScore, max: 35 },
      { name: "Logging consistently", points: consistencyScore, max: 25 },
    ],
  };
}
