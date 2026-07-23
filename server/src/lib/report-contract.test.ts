/**
 * External report contract — finance-importer v2 column map.
 *
 * The finance importer consumes GET /api/expenses/export POSITIONALLY; this pin
 * mirrors its deployed column map. Do NOT change without coordinating an
 * importer release (ops/finance runbook).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import expensesRouter from '../routes/expenses.js';

process.env.EXPENSE_DB_PATH = ':memory:';

const IMPORTER_V2_COLUMNS = ['id', 'description', 'amount_cents', 'paid_by', 'participants', 'category', 'spent_on'];

test('export header matches the deployed finance-importer v2 column map', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/expenses', expensesRouter);
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/expenses/export`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text.split('\n')[0], IMPORTER_V2_COLUMNS.join(','));
  } finally {
    server.close();
  }
});
