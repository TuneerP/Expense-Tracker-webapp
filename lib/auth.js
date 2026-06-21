import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { serialize, parse } from "cookie";

const SECRET = process.env.JWT_SECRET || "tuppence-dev-secret-change-me";
const COOKIE_NAME = "tuppence_session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

export function verifyPin(pin, hash) {
  return bcrypt.compare(pin, hash);
}

export function signSession(userId, username) {
  return jwt.sign({ sub: userId, username }, SECRET, { expiresIn: MAX_AGE });
}

export function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    })
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  );
}

export function getSessionFromReq(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
