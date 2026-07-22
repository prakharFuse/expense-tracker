import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances, settleUp } from './settle.js';

test('computeBalances nets payments against shares and sums to zero', () => {
  const balances = computeBalances([
    { amountCents: 3000, paidBy: 'alice', participants: ['alice', 'bob', 'carol'] },
  ]);
  assert.equal(balances.get('alice'), 2000); // paid 3000, owes their 1000 share
  assert.equal(balances.get('bob'), -1000);
  assert.equal(balances.get('carol'), -1000);
  const sum = [...balances.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
});

test('computeBalances splits a refund (negative amount) and balances sum to zero', () => {
  const balances = computeBalances([
    { amountCents: -600, paidBy: 'Alice', participants: ['Alice', 'Bob'] },
  ]);
  assert.equal(balances.get('Alice'), -300);
  assert.equal(balances.get('Bob'), 300);
  const sum = [...balances.values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 0);
});

test('computeBalances rejects an expense with no participants', () => {
  assert.throws(
    () => computeBalances([{ amountCents: 1000, paidBy: 'alice', participants: [] }]),
    RangeError,
  );
});

test('settleUp produces transfers that clear every balance', () => {
  const balances = computeBalances([
    { amountCents: 3000, paidBy: 'alice', participants: ['alice', 'bob', 'carol'] },
    { amountCents: 1200, paidBy: 'bob', participants: ['alice', 'bob'] },
  ]);
  const transfers = settleUp(balances);

  // Apply each transfer and confirm everyone ends at zero.
  const net = new Map(balances);
  for (const t of transfers) {
    net.set(t.from, (net.get(t.from) ?? 0) + t.amountCents);
    net.set(t.to, (net.get(t.to) ?? 0) - t.amountCents);
  }
  for (const value of net.values()) {
    assert.equal(value, 0);
  }
  // Every transfer moves a positive amount from a debtor to a creditor.
  for (const t of transfers) {
    assert.ok(t.amountCents > 0);
  }
});

test('settleUp returns no transfers when everyone is square', () => {
  assert.deepEqual(settleUp(new Map([['a', 0], ['b', 0]])), []);
});

test('settleUp clears balances from a mix of an expense and a refund', () => {
  const balances = computeBalances([
    { amountCents: 3000, paidBy: 'alice', participants: ['alice', 'bob'] },
    { amountCents: -600, paidBy: 'alice', participants: ['alice', 'bob'] },
  ]);
  const transfers = settleUp(balances);

  const net = new Map(balances);
  for (const t of transfers) {
    net.set(t.from, (net.get(t.from) ?? 0) + t.amountCents);
    net.set(t.to, (net.get(t.to) ?? 0) - t.amountCents);
  }
  for (const value of net.values()) {
    assert.equal(value, 0);
  }
});
