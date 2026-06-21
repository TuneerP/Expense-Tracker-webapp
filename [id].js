import { query, ensureSchema } from "../../../lib/db";
import { hashPin, signSession, setSessionCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureSchema();
    const { username, pin } = req.body || {};

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters." });
    }
    if (!pin || typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 4-8 digits." });
    }

    const cleanUsername = username.trim().toLowerCase();

    const existing = await query("SELECT id FROM users WHERE username = $1", [cleanUsername]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "That username is taken. Try another." });
    }

    const pinHash = await hashPin(pin);
    const result = await query(
      "INSERT INTO users (username, pin_hash) VALUES ($1, $2) RETURNING id, username",
      [cleanUsername, pinHash]
    );

    const user = result.rows[0];
    const token = signSession(user.id, user.username);
    setSessionCookie(res, token);

    return res.status(200).json({ id: user.id, username: user.username });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
