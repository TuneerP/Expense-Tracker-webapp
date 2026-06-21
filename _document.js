import { query, ensureSchema } from "../../lib/db";
import { getSessionFromReq } from "../../lib/auth";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const result = await query(
        "SELECT milestone_key FROM milestones_seen WHERE user_id = $1",
        [session.sub]
      );
      return res.status(200).json({ seen: result.rows.map((r) => r.milestone_key) });
    }

    if (req.method === "POST") {
      const { key } = req.body || {};
      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "Missing milestone key." });
      }
      await query(
        `INSERT INTO milestones_seen (user_id, milestone_key)
         VALUES ($1, $2)
         ON CONFLICT (user_id, milestone_key) DO NOTHING`,
        [session.sub, key]
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Milestones API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
