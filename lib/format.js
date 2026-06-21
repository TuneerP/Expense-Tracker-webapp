// Default to a generic, widely-understood currency display.
// Stored amounts are plain numbers — formatting is presentation-only.
export function formatMoney(n, currency = "INR") {
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  const symbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : "₹";
  const opts =
    rounded % 1 === 0
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return symbol + rounded.toLocaleString("en-IN", opts);
}
