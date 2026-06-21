import { query, ensureSchema } from "../../../lib/db";
import { getSessionFromReq } from "../../../lib/auth";
import { detectCategory, CATEGORIES } from "../../../lib/categories";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const result = await query(
        "SELECT id, amount, reason, category, occurred_at FROM expenses WHERE user_id = $1 ORDER BY occurred_at DESC",
        [session.sub]
      );
      const expenses = result.rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        reason: row.reason,
        category: row.category,
        ts: new Date(row.occurred_at).getTime(),
      }));
      return res.status(200).json({ expenses });
    }

    if (req.method === "POST") {
      const { amount, reason, category } = req.body || {};
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: "Enter a valid amount." });
      }
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({ error: "Tell us what it was for." });
      }

      const cleanReason = reason.trim().slice(0, 80);
      const finalCategory =
        category && CATEGORIES[category] ? category : detectCategory(cleanReason);

      const result = await query(
        `INSERT INTO expenses (user_id, amount, reason, category)
         VALUES ($1, $2, $3, $4)
         RETURNING id, amount, reason, category, occurred_at`,
        [session.sub, Math.round(numAmount * 100) / 100, cleanReason, finalCategory]
      );

      const row = result.rows[0];
      return res.status(200).json({
        expense: {
          id: row.id,
          amount: Number(row.amount),
          reason: row.reason,
          category: row.category,
          ts: new Date(row.occurred_at).getTime(),
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Expenses API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
