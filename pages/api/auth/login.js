import { query, ensureSchema } from "../../../lib/db";
import { verifyPin, signSession, setSessionCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureSchema();
    const { username, pin } = req.body || {};

    if (!username || !pin) {
      return res.status(400).json({ error: "Username and PIN are required." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const result = await query(
      "SELECT id, username, pin_hash FROM users WHERE username = $1",
      [cleanUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "No account with that username." });
    }

    const user = result.rows[0];
    const valid = await verifyPin(pin, user.pin_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect PIN." });
    }

    const token = signSession(user.id, user.username);
    setSessionCookie(res, token);

    return res.status(200).json({ id: user.id, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
