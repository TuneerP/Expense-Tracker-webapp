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
        "SELECT daily_limit, monthly_limit, roast_mode FROM user_settings WHERE user_id = $1",
        [session.sub]
      );
      const row = result.rows[0];
      return res.status(200).json({
        dailyLimit: row && row.daily_limit !== null ? Number(row.daily_limit) : null,
        monthlyLimit: row && row.monthly_limit !== null ? Number(row.monthly_limit) : null,
        roastMode: row ? Boolean(row.roast_mode) : false,
      });
    }

    if (req.method === "PUT") {
      const body = req.body || {};

      // Read existing row first so a partial update (e.g. only roastMode)
      // never accidentally wipes out fields the caller didn't intend to touch.
      const existingResult = await query(
        "SELECT daily_limit, monthly_limit, roast_mode FROM user_settings WHERE user_id = $1",
        [session.sub]
      );
      const existing = existingResult.rows[0] || {};

      const dailyProvided = Object.prototype.hasOwnProperty.call(body, "dailyLimit");
      const monthlyProvided = Object.prototype.hasOwnProperty.call(body, "monthlyLimit");
      const roastProvided = Object.prototype.hasOwnProperty.call(body, "roastMode");

      function normalizeLimit(v) {
        if (v === null || v === undefined || v === "") return null;
        return Math.max(0, Math.round(Number(v) * 100) / 100);
      }

      const dl = dailyProvided
        ? normalizeLimit(body.dailyLimit)
        : existing.daily_limit !== undefined && existing.daily_limit !== null
        ? Number(existing.daily_limit)
        : null;
      const ml = monthlyProvided
        ? normalizeLimit(body.monthlyLimit)
        : existing.monthly_limit !== undefined && existing.monthly_limit !== null
        ? Number(existing.monthly_limit)
        : null;
      const roast = roastProvided ? Boolean(body.roastMode) : Boolean(existing.roast_mode);

      if (dl !== null && Number.isNaN(dl)) {
        return res.status(400).json({ error: "Daily limit must be a number." });
      }
      if (ml !== null && Number.isNaN(ml)) {
        return res.status(400).json({ error: "Monthly limit must be a number." });
      }

      await query(
        `INSERT INTO user_settings (user_id, daily_limit, monthly_limit, roast_mode, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (user_id)
         DO UPDATE SET daily_limit = $2, monthly_limit = $3, roast_mode = $4, updated_at = now()`,
        [session.sub, dl, ml, roast]
      );

      return res.status(200).json({ dailyLimit: dl, monthlyLimit: ml, roastMode: roast });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Settings API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
