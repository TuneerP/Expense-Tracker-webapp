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
        `SELECT id, title, target_amount, saved_amount, created_at, completed_at
         FROM goals WHERE user_id = $1 ORDER BY completed_at IS NOT NULL, created_at DESC`,
        [session.sub]
      );
      const goals = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        targetAmount: Number(row.target_amount),
        savedAmount: Number(row.saved_amount),
        createdAt: new Date(row.created_at).getTime(),
        completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
      }));
      return res.status(200).json({ goals });
    }

    if (req.method === "POST") {
      const { title, targetAmount } = req.body || {};
      const cleanTitle = (title || "").toString().trim().slice(0, 80);
      const numTarget = Number(targetAmount);

      if (!cleanTitle) {
        return res.status(400).json({ error: "Give your goal a name." });
      }
      if (!numTarget || numTarget <= 0) {
        return res.status(400).json({ error: "Enter a valid target amount." });
      }

      const result = await query(
        `INSERT INTO goals (user_id, title, target_amount, saved_amount)
         VALUES ($1, $2, $3, 0)
         RETURNING id, title, target_amount, saved_amount, created_at, completed_at`,
        [session.sub, cleanTitle, Math.round(numTarget * 100) / 100]
      );

      const row = result.rows[0];
      return res.status(200).json({
        goal: {
          id: row.id,
          title: row.title,
          targetAmount: Number(row.target_amount),
          savedAmount: Number(row.saved_amount),
          createdAt: new Date(row.created_at).getTime(),
          completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Goals API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
