import { query, ensureSchema } from "../../../lib/db";
import { getSessionFromReq } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const result = await query(
        "SELECT id, amount, source, occurred_at FROM incomes WHERE user_id = $1 ORDER BY occurred_at DESC",
        [session.sub]
      );
      const incomes = result.rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        source: row.source,
        ts: new Date(row.occurred_at).getTime(),
      }));
      return res.status(200).json({ incomes });
    }

    if (req.method === "POST") {
      const { amount, source } = req.body || {};
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: "Enter a valid amount." });
      }
      const cleanSource = (source || "Income").toString().trim().slice(0, 80) || "Income";

      const result = await query(
        `INSERT INTO incomes (user_id, amount, source)
         VALUES ($1, $2, $3)
         RETURNING id, amount, source, occurred_at`,
        [session.sub, Math.round(numAmount * 100) / 100, cleanSource]
      );

      const row = result.rows[0];
      return res.status(200).json({
        income: {
          id: row.id,
          amount: Number(row.amount),
          source: row.source,
          ts: new Date(row.occurred_at).getTime(),
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Incomes API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
