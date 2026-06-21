import { query, ensureSchema } from "../../lib/db";
import { getSessionFromReq } from "../../lib/auth";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await ensureSchema();

  if (req.method === "GET") {
    const result = await query(
      `
      SELECT monthly_budget
      FROM users
      WHERE id = $1
      `,
      [session.sub]
    );

    return res.status(200).json({
      budget: Number(result.rows[0]?.monthly_budget || 0)
    });
  }

  if (req.method === "POST") {
    const { budget } = req.body;

    await query(
      `
      UPDATE users
      SET monthly_budget = $1
      WHERE id = $2
      `,
      [budget, session.sub]
    );

    return res.status(200).json({
      success: true
    });
  }

  return res.status(405).end();
}
