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

    if (req.method === "DELETE") {
      await query("DELETE FROM expenses WHERE id = $1 AND user_id = $2", [id, session.sub]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Expense delete error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
