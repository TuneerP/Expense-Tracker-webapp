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
 *   Requires a limit to be set — if none exists, this factor is excluded
 *   from the total entirely (its points are redistributed), rather than
 *   defaulting to full marks for an absent input.
 * - Savings rate (35 pts): income minus expenses, as a share of income.
 *   Needs at least a small amount of logged income to mean anything;
 *   with too little data this factor is also excluded rather than guessed.
 * - Consistency (25 pts): how many of the last 7 days had logged activity.
 *
 * When a factor is excluded, its max points are proportionally redistributed
 * across the remaining factors, so the score is always out of 100 — but it's
 * only ever built from real signal, never from a missing input's default.
 */
export function computeHealthScore({ monthSum, monthlyLimit, totalIncome, totalExpense, last7DaysLoggedCount }) {
  const factors = [];

  // ---- Budget adherence: only counts if a limit actually exists ----
  if (monthlyLimit && monthlyLimit > 0) {
    const ratio = monthSum / monthlyLimit;
    let budgetScore;
    if (ratio <= 1) {
      budgetScore = Math.round(40 * (1 - ratio * 0.5)); // 0% used -> 40pts, 100% used -> 20pts
    } else {
      budgetScore = Math.max(0, Math.round(20 - (ratio - 1) * 40)); // over budget tapers toward 0
    }
    factors.push({ name: "Staying under budget", points: budgetScore, max: 40 });
  }

  // ---- Savings rate: only counts with a meaningful minimum of logged income ----
  // Below this, a single small transaction can swing the rate wildly and the
  // number means nothing yet — better to leave it out than show a fake signal.
  const MIN_INCOME_FOR_SAVINGS_SIGNAL = 1000;
  if (totalIncome >= MIN_INCOME_FOR_SAVINGS_SIGNAL) {
    const savingsRate = (totalIncome - totalExpense) / totalIncome;
    const savingsScore = Math.round(Math.max(0, Math.min(1, savingsRate + 0.3)) * 35);
    factors.push({ name: "Saving money", points: savingsScore, max: 35 });
  }

  // ---- Consistency: always computable, even with zero history (just scores 0) ----
  const consistencyScore = Math.round((Math.min(7, last7DaysLoggedCount) / 7) * 25);
  factors.push({ name: "Logging consistently", points: consistencyScore, max: 25 });

  // ---- Redistribute so the total is always genuinely out of 100 ----
  const rawMax = factors.reduce((sum, f) => sum + f.max, 0);
  const rawPoints = factors.reduce((sum, f) => sum + f.points, 0);
  const total = rawMax > 0 ? Math.max(0, Math.min(100, Math.round((rawPoints / rawMax) * 100))) : 0;

  // Breakdown stays in original point scales (not rescaled) so the "why" is
  // still legible against familiar numbers, with a note when data is missing.
  const allFactorNames = ["Staying under budget", "Saving money", "Logging consistently"];
  const breakdown = allFactorNames.map((name) => {
    const found = factors.find((f) => f.name === name);
    if (found) return found;
    const max = name === "Staying under budget" ? 40 : name === "Saving money" ? 35 : 25;
    return { name, points: null, max, missing: true };
  });

  let label;
  if (factors.length < 2) {
    label = { emoji: "🌀", text: "Not enough data yet" };
  } else if (total >= 85) {
    label = { emoji: "🔥", text: "Budget Ninja" };
  } else if (total >= 65) {
    label = { emoji: "🌱", text: "Careful Saver" };
  } else if (total >= 40) {
    label = { emoji: "⚖️", text: "Getting There" };
  } else {
    label = { emoji: "💸", text: "Certified Menace" };
  }

  return { total, label, breakdown };
}
