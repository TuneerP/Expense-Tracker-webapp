import { DatabaseSync } from "node:sqlite";

// A tiny shim that lets our Postgres-flavored SQL run against SQLite for local
// integration testing of the API route handlers, without needing a real Postgres
// server in this sandbox.
const db = new DatabaseSync(":memory:");

function translateParams(sql) {
  return sql.replace(/\$\d+/g, "?");
}

function translateUpsert(sql) {
  // Translate Postgres "ON CONFLICT (col) DO UPDATE SET a = $2, b = $3"
  // into SQLite's "ON CONFLICT(col) DO UPDATE SET a = excluded.a, b = excluded.b"
  // For our specific settings upsert we know the exact shape, so handle it directly.
  if (/ON CONFLICT/i.test(sql)) {
    return sql
      .replace(/ON CONFLICT \(user_id\)/i, "ON CONFLICT(user_id)")
      .replace(
        /DO UPDATE SET daily_limit = \$2, monthly_limit = \$3, updated_at = now\(\)/i,
        "DO UPDATE SET daily_limit = excluded.daily_limit, monthly_limit = excluded.monthly_limit, updated_at = excluded.updated_at"
      );
  }
  return sql;
}

export async function query(text, params = []) {
  const isInsertReturning = /RETURNING/i.test(text) && /^\s*INSERT/i.test(text.trim());
  let sql = translateUpsert(text);
  sql = translateParams(sql).replace(/now\(\)/gi, "(datetime('now'))");

  if (isInsertReturning) {
    const insertSql = sql.replace(/RETURNING[\s\S]*$/i, "");
    const stmt = db.prepare(insertSql);
    const info = stmt.run(...params);
    const tableMatch = /INSERT INTO (\w+)/i.exec(sql);
    const table = tableMatch[1];
    const row = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid);
    return { rows: row ? [row] : [] };
  }

  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith("SELECT")) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return { rows };
  }

  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { rows: [], rowCount: info.changes };
}

let initialized = false;
export async function ensureSchema() {
  if (initialized) return;
  initialized = true;
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      source TEXT NOT NULL,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      daily_limit REAL,
      monthly_limit REAL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;
  db.exec(schema);
}
