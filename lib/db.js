import { Pool } from "pg";

// Works with Neon / Vercel Postgres / Supabase / any standard Postgres URL.
// Connection string comes from whichever of these env vars is set —
// different integrations name it differently depending on prefix settings.
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_DATABASE_URL ||
  process.env.DATABASE_URL;

let pool;

function getPool() {
  if (!pool) {
    if (!connectionString) {
      throw new Error(
        "No database connection string found. Set POSTGRES_URL, POSTGRES_DATABASE_URL, or DATABASE_URL in your environment."
      );
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=disable")
        ? false
        : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

let initPromise = null;

// Creates tables if they don't exist yet. Safe to call on every cold start.
export async function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

    CREATE TABLE IF NOT EXISTS incomes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL,
      source TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      daily_limit NUMERIC(12,2),
      monthly_limit NUMERIC(12,2),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  return initPromise;
}
