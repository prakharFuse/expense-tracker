# CLAUDE.md

## Project
Expense Tracker — record shared expenses, split them, settle up. Express + React + SQLite.

## Layout
- `server/src/` — Express API (TypeScript, compiled to `dist/`)
  - `lib/` — pure money + settlement logic (most-tested code)
  - `routes/` — Express route handlers
- `client/src/` — React UI (Vite)
- `data/` — SQLite database (gitignored)

## Commands
- `pnpm install` — install dependencies
- `pnpm dev` — run server + client concurrently
- `pnpm build` — compile server TypeScript
- `pnpm typecheck` — type-check both server and client
- `pnpm lint` — ESLint over server + client
- `pnpm test` — compile server + run `node:test` suites

## Endpoints
- GET /api/expenses — list expenses
- POST /api/expenses — create (description, amount_cents, paid_by, participants[], category, spent_on)
- GET /api/expenses/:id — get by ID
- PATCH /api/expenses/:id — update description/category/spent_on
- DELETE /api/expenses/:id — remove
- GET /api/expenses/balances — net balances + settlements
- GET /api/expenses/stats — totals by category
- GET /api/expenses/export — CSV export

## Rules
- Money is always integer **cents** — never floats.
- API errors: `{ "error": string }` with an appropriate HTTP status.
- Prefer parameterized SQL (`?` placeholders) — no string concatenation.
- SQLite via Node built-in `node:sqlite` (`DatabaseSync`), requires Node >= 22.5.
- `/stats`, `/balances`, `/export` routes are declared before `/:id` so they aren't shadowed.
