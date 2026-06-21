// All functions here are pure (no side effects), so they're easy to unit test
// and reuse between the client and, if ever needed, the server.

function toDayKey(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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
