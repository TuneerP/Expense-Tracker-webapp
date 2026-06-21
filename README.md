# Tuppence

A fun little expense ledger. Type in an amount and what it was for, and
Tuppence figures out the category automatically. Built with Next.js, a
Postgres database, and a small pixel-coin mascot named Tup.

## What's in here

- `pages/index.js` — the main dashboard (quick-add form, charts, ledger)
- `pages/api/` — backend routes (signup, login, expenses)
- `lib/db.js` — database connection (works with any Postgres)
- `lib/auth.js` — PIN hashing + login sessions
- `lib/categories.js` — the keyword list that auto-detects categories
- `components/` — CoinMascot, charts, the auth screen

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in POSTGRES_URL and JWT_SECRET
npm run dev
```

You'll need a Postgres database to test against locally. The easiest free
option is [Neon](https://neon.tech) — create a project, copy the connection
string into `.env.local` as `POSTGRES_URL`.

## Deploying to Vercel (free)

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and import
   the repo. Keep all the default build settings — Vercel detects Next.js
   automatically.
3. Before the first deploy finishes, add a database:
   - In your Vercel project, go to the **Storage** tab
   - Click **Create Database** → choose **Postgres** (powered by Neon) →
     pick the free plan
   - Vercel automatically adds a `POSTGRES_URL` environment variable to
     your project — you don't need to copy/paste anything
4. Go to **Settings → Environment Variables** and add one more:
   - `JWT_SECRET` — any long random string (e.g. output of
     `openssl rand -base64 32`)
5. Redeploy (Vercel does this automatically after you add env vars, or
   click **Redeploy** in the Deployments tab).

That's it — you'll get a permanent URL like `tuppence-yourname.vercel.app`
that you can share with friends. Everyone gets their own private ledger
(username + PIN), and their data follows them across any device or browser.

## Notes

- PINs are hashed with bcrypt before they're stored — never saved in plain text.
- There's no email/password recovery yet. If someone forgets their PIN,
  the only fix today is creating a new username.
- The free Vercel Postgres (Neon) tier comfortably covers casual use by a
  small group of friends.
