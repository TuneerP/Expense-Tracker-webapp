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
        "SELECT daily_limit, monthly_limit FROM user_settings WHERE user_id = $1",
        [session.sub]
      );
      const row = result.rows[0];
      return res.status(200).json({
        dailyLimit: row && row.daily_limit !== null ? Number(row.daily_limit) : null,
        monthlyLimit: row && row.monthly_limit !== null ? Number(row.monthly_limit) : null,
      });
    }

    if (req.method === "PUT") {
      const { dailyLimit, monthlyLimit } = req.body || {};

      const dl =
        dailyLimit === null || dailyLimit === undefined || dailyLimit === ""
          ? null
          : Math.max(0, Math.round(Number(dailyLimit) * 100) / 100);
      const ml =
        monthlyLimit === null || monthlyLimit === undefined || monthlyLimit === ""
          ? null
          : Math.max(0, Math.round(Number(monthlyLimit) * 100) / 100);

      if (dl !== null && Number.isNaN(dl)) {
        return res.status(400).json({ error: "Daily limit must be a number." });
      }
      if (ml !== null && Number.isNaN(ml)) {
        return res.status(400).json({ error: "Monthly limit must be a number." });
      }

      await query(
        `INSERT INTO user_settings (user_id, daily_limit, monthly_limit, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (user_id)
         DO UPDATE SET daily_limit = $2, monthly_limit = $3, updated_at = now()`,
        [session.sub, dl, ml]
      );

      return res.status(200).json({ dailyLimit: dl, monthlyLimit: ml });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Settings API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
