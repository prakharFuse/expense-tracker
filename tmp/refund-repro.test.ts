import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances } from '../server/src/lib/settle.js';

// Reproduces: "Settlement crashes on a refund (negative-amount expense)".
// A refund/credit is a valid expense with negative amountCents and should be
// split across participants like any other expense — not throw a RangeError.
test('computeBalances splits a negative-amount refund instead of throwing', () => {
  let balances!: Map<string, number>;
  assert.doesNotThrow(() => {
    balances = computeBalances([
      { amountCents: -600, paidBy: 'Alice', participants: ['Alice', 'Bob'] },
    ]);
  });

  // The -600 credit splits evenly: Alice paid it back, so she is owed -300
  // (still down net) and Bob's share credits him +300. Balances sum to zero.
  assert.equal(balances.get('Alice'), -300);
  assert.equal(balances.get('Bob'), 300);
  const sum = [...balances.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
});
