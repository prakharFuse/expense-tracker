# Expense Tracker

A small shared-expense tracker: record who paid for what, split each expense
across participants, and compute who-owes-whom settlements. Built as a realistic
sandbox app with **lint, typecheck, and tests** wired up as scripts.

## Tech stack

- **Server:** Node.js, Express, TypeScript, SQLite (`node:sqlite`)
- **Client:** React, TypeScript, Vite
- **Tooling:** pnpm, ESLint (flat config), `node:test`
- **Runtime:** Node.js >= 22.5 (required for `node:sqlite`)

## Getting started

```bash
pnpm install
pnpm build
pnpm dev
```

Server runs on port 4070, client on port 5173 with an API proxy to the server.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm lint` | ESLint over server + client |
| `pnpm typecheck` | Type-check server and client |
| `pnpm test` | Compile server + run `node:test` suites |
| `pnpm build` | Compile the server |
| `pnpm dev` | Run server + client concurrently |
| `pnpm start` | Run the compiled server |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/expenses | List expenses |
| POST | /api/expenses | Add an expense (description, amount_cents, paid_by, participants[], category, spent_on) |
| GET | /api/expenses/:id | Get one expense |
| PATCH | /api/expenses/:id | Update description/category/spent_on |
| DELETE | /api/expenses/:id | Remove an expense |
| GET | /api/expenses/balances | Net balance per person + suggested settlements |
| GET | /api/expenses/stats | Totals by category |
| GET | /api/expenses/export | CSV export |

## Core logic

- `server/src/lib/money.ts` — `formatMoney`, `splitEvenCents` (even split with
  remainder-cent distribution so shares always sum back to the total)
- `server/src/lib/settle.ts` — `computeBalances` (net payments vs. shares) and
  `settleUp` (greedy debtor↔creditor matching)

These pure functions are the most heavily tested part of the codebase.

## Database

SQLite file at `data/expenses.db`, auto-created on first run with sample data.
