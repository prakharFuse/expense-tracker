import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances } from '../server/src/lib/settle.ts';

// Reproduces: "Settlement crashes on a refund (negative-amount expense)".
// A refund/credit is a valid expense entry, so computeBalances should split a
// negative amount just like any other expense instead of throwing RangeError.
test('computeBalances splits a refund (negative amount) like any expense', () => {
  const balances = computeBalances([
    { amountCents: -600, paidBy: 'Alice', participants: ['Alice', 'Bob'] },
  ]);

  // Alice "paid" -600 and owes her -300 share => -300; Bob owes his -300 share
  // as a credit => +300. Balances still sum to zero.
  assert.equal(balances.get('Alice'), -300);
  assert.equal(balances.get('Bob'), 300);

  const sum = [...balances.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
});
