/**
 * Expenses API contract tests. No test-framework dependency — Node's built-in
 * test runner + an ephemeral in-process Express server on an in-memory SQLite DB.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import expensesRouter from './expenses.js';
import { formatMoney } from '../lib/money.js';

// Isolated throwaway DB — set before the first getDb() call (handlers call
// getDb() lazily, so setting it here, before any request, is enough).
process.env.EXPENSE_DB_PATH = ':memory:';

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/expenses', expensesRouter);
  return app;
}

const app = makeApp();

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json };
  } finally {
    server.close();
  }
}

test('GET /api/expenses lists the seeded expenses', async () => {
  const res = await call('GET', '/api/expenses');
  assert.equal(res.status, 200);
  const expenses = (res.json as { expenses: unknown[] }).expenses;
  assert.ok(Array.isArray(expenses));
  assert.ok(expenses.length > 0, 'seed data is present');
});

test('POST /api/expenses creates an expense', async () => {
  const res = await call('POST', '/api/expenses', {
    description: 'Lunch',
    amount_cents: 2500,
    paid_by: 'alice',
    participants: ['alice', 'bob'],
    category: 'Food',
    spent_on: '2024-06-01',
  });
  assert.equal(res.status, 201);
  const created = res.json as { id: number; amount_cents: number };
  assert.ok(created.id > 0);
  assert.equal(created.amount_cents, 2500);
});

test('POST /api/expenses rejects missing fields with 400', async () => {
  const res = await call('POST', '/api/expenses', { description: 'Incomplete' });
  assert.equal(res.status, 400);
});

test('POST /api/expenses rejects a non-positive amount with 400', async () => {
  const res = await call('POST', '/api/expenses', {
    description: 'Free thing',
    amount_cents: 0,
    paid_by: 'alice',
    participants: ['alice'],
    category: 'Misc',
    spent_on: '2024-06-02',
  });
  assert.equal(res.status, 400);
});

test('POST /api/expenses rejects empty participants with 400', async () => {
  const res = await call('POST', '/api/expenses', {
    description: 'Nobody',
    amount_cents: 500,
    paid_by: 'alice',
    participants: [],
    category: 'Misc',
    spent_on: '2024-06-02',
  });
  assert.equal(res.status, 400);
});

test('GET /api/expenses/:id returns 404 for a missing expense', async () => {
  const res = await call('GET', '/api/expenses/999999');
  assert.equal(res.status, 404);
  assert.equal((res.json as { error: string }).error, 'Expense not found');
});

test('GET /api/expenses/stats returns totals by category', async () => {
  const res = await call('GET', '/api/expenses/stats');
  assert.equal(res.status, 200);
  const body = res.json as {
    totalCents: number;
    total: string;
    byCategory: { category: string; total: number }[];
  };
  assert.ok(body.totalCents > 0);
  assert.equal(body.total, formatMoney(body.totalCents));
  assert.ok(Array.isArray(body.byCategory));
});

test('GET /api/expenses/balances returns balances that sum to zero', async () => {
  const res = await call('GET', '/api/expenses/balances');
  assert.equal(res.status, 200);
  const body = res.json as {
    balances: { person: string; amountCents: number }[];
    settlements: { from: string; to: string; amountCents: number }[];
  };
  const sum = body.balances.reduce((acc, b) => acc + b.amountCents, 0);
  assert.equal(sum, 0);
  assert.ok(Array.isArray(body.settlements));
});

test('GET /api/expenses/export returns CSV with a header row', async () => {
  const res = await call('GET', '/api/expenses/export');
  assert.equal(res.status, 200);
  assert.ok(typeof res.json === 'string');
  const csv = res.json as string;
  assert.ok(csv.startsWith('id,description,amount_cents'));
  assert.ok(csv.split('\n')[0].endsWith(',amount'));
});

test('GET /api/expenses/export includes a quoted grouped amount column per row', async () => {
  const res = await call('GET', '/api/expenses/export');
  assert.equal(res.status, 200);
  const [, ...rows] = (res.json as string).split('\n');
  assert.ok(rows.length > 0, 'export has at least one data row');
  const rowPattern = /^\d+,[^,]+,(-?\d+),[^,]+,"[^"]*",[^,]+,[^,]+,"(-?\$[\d,]+\.\d{2})"$/;
  for (const row of rows) {
    const match = row.match(rowPattern);
    assert.ok(match, `row did not match expected shape: ${row}`);
    const [, amountCents, quotedAmount] = match as RegExpMatchArray;
    assert.equal(quotedAmount, formatMoney(Number(amountCents)));
  }
});
