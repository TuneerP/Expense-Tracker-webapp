import { query, ensureSchema } from "../../lib/db";
import { getSessionFromReq } from "../../lib/auth";

// Each setting's DB column name, how to read it from a row, and how to
// normalize an incoming value. Adding a new setting means adding one entry
// here — the merge-safety logic below applies uniformly to all of them.
const FIELD_DEFS = {
  dailyLimit: {
    column: "daily_limit",
    fromRow: (v) => (v !== null && v !== undefined ? Number(v) : null),
    normalize: (v) => (v === null || v === undefined || v === "" ? null : Math.max(0, Math.round(Number(v) * 100) / 100)),
  },
  monthlyLimit: {
    column: "monthly_limit",
    fromRow: (v) => (v !== null && v !== undefined ? Number(v) : null),
    normalize: (v) => (v === null || v === undefined || v === "" ? null : Math.max(0, Math.round(Number(v) * 100) / 100)),
  },
  roastMode: {
    column: "roast_mode",
    fromRow: (v) => Boolean(v),
    normalize: (v) => Boolean(v),
  },
  savingsTarget: {
    column: "savings_target",
    fromRow: (v) => (v !== null && v !== undefined ? Number(v) : null),
    normalize: (v) => (v === null || v === undefined || v === "" ? null : Math.max(0, Math.round(Number(v) * 100) / 100)),
  },
};

const ALL_COLUMNS = Object.values(FIELD_DEFS).map((f) => f.column);

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const result = await query(
        `SELECT ${ALL_COLUMNS.join(", ")} FROM user_settings WHERE user_id = $1`,
        [session.sub]
      );
      const row = result.rows[0] || {};
      const out = {};
      for (const [key, def] of Object.entries(FIELD_DEFS)) {
        out[key] = def.fromRow(row[def.column]);
      }
      return res.status(200).json(out);
    }

    if (req.method === "PUT") {
      const body = req.body || {};

      // Read existing row first so a partial update (e.g. only one field)
      // never accidentally wipes out fields the caller didn't intend to touch.
      const existingResult = await query(
        `SELECT ${ALL_COLUMNS.join(", ")} FROM user_settings WHERE user_id = $1`,
        [session.sub]
      );
      const existing = existingResult.rows[0] || {};

      const finalValues = {};
      for (const [key, def] of Object.entries(FIELD_DEFS)) {
        const provided = Object.prototype.hasOwnProperty.call(body, key);
        finalValues[key] = provided ? def.normalize(body[key]) : def.fromRow(existing[def.column]);
      }

      if (finalValues.dailyLimit !== null && Number.isNaN(finalValues.dailyLimit)) {
        return res.status(400).json({ error: "Daily limit must be a number." });
      }
      if (finalValues.monthlyLimit !== null && Number.isNaN(finalValues.monthlyLimit)) {
        return res.status(400).json({ error: "Monthly limit must be a number." });
      }
      if (finalValues.savingsTarget !== null && Number.isNaN(finalValues.savingsTarget)) {
        return res.status(400).json({ error: "Savings target must be a number." });
      }

      const keys = Object.keys(FIELD_DEFS);
      const columns = keys.map((k) => FIELD_DEFS[k].column);
      const placeholders = columns.map((_, i) => `$${i + 2}`);
      const updateSet = columns.map((col, i) => `${col} = $${i + 2}`).join(", ");
      const values = [session.sub, ...keys.map((k) => finalValues[k])];

      await query(
        `INSERT INTO user_settings (user_id, ${columns.join(", ")}, updated_at)
         VALUES ($1, ${placeholders.join(", ")}, now())
         ON CONFLICT (user_id)
         DO UPDATE SET ${updateSet}, updated_at = now()`,
        values
      );

      return res.status(200).json(finalValues);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Settings API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
