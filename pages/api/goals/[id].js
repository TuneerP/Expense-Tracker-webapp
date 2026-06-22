import { query, ensureSchema } from "../../../lib/db";
import { getSessionFromReq } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const { id } = req.query;

  try {
    await ensureSchema();

    if (req.method === "PUT") {
      const { addAmount } = req.body || {};
      const num = Number(addAmount);
      if (!num || num <= 0) {
        return res.status(400).json({ error: "Enter a valid amount to add." });
      }

      const existing = await query(
        "SELECT id, target_amount, saved_amount, completed_at FROM goals WHERE id = $1 AND user_id = $2",
        [id, session.sub]
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Goal not found." });
      }
      const goal = existing.rows[0];
      const newSaved = Math.round((Number(goal.saved_amount) + num) * 100) / 100;
      const target = Number(goal.target_amount);
      const justCompleted = newSaved >= target && !goal.completed_at;

      const result = await query(
        `UPDATE goals SET saved_amount = $1, completed_at = COALESCE(completed_at, $2)
         WHERE id = $3 AND user_id = $4
         RETURNING id, title, target_amount, saved_amount, created_at, completed_at`,
        [newSaved, justCompleted ? new Date().toISOString() : null, id, session.sub]
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
        justCompleted,
      });
    }

    if (req.method === "DELETE") {
      await query("DELETE FROM goals WHERE id = $1 AND user_id = $2", [id, session.sub]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Goal update error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
