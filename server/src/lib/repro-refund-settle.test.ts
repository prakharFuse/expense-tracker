import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances } from './settle.js';

test('computeBalances settles a refund (negative-amount expense)', () => {
  const balances = computeBalances([
    { amountCents: -600, paidBy: 'Alice', participants: ['Alice', 'Bob'] },
  ]);
  // The credit is split like any expense: Alice -300, Bob +300.
  assert.equal(balances.get('Alice'), -300);
  assert.equal(balances.get('Bob'), 300);
  // Balances always sum to zero.
  const sum = [...balances.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
});
