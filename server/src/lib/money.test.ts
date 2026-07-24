import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, splitEvenCents } from './money.js';

test('formatMoney formats whole and fractional dollars', () => {
  assert.equal(formatMoney(0), '$0.00');
  assert.equal(formatMoney(5), '$0.05');
  assert.equal(formatMoney(1234), '$12.34');
});

test('formatMoney groups the integer dollar part with commas', () => {
  assert.equal(formatMoney(100000), '$1,000.00');
  assert.equal(formatMoney(123456789), '$1,234,567.89');
});

test('formatMoney handles negative amounts', () => {
  assert.equal(formatMoney(-750), '-$7.50');
});

test('formatMoney groups negative amounts with commas', () => {
  assert.equal(formatMoney(-100000), '-$1,000.00');
});

test('formatMoney rejects non-integer cents', () => {
  assert.throws(() => formatMoney(12.5), TypeError);
});

test('splitEvenCents divides evenly when divisible', () => {
  assert.deepEqual(splitEvenCents(900, 3), [300, 300, 300]);
});

test('splitEvenCents distributes the remainder to the first shares', () => {
  const shares = splitEvenCents(1000, 3);
  assert.deepEqual(shares, [334, 333, 333]);
  assert.equal(shares.reduce((a, b) => a + b, 0), 1000);
});

test('splitEvenCents handles a single participant', () => {
  assert.deepEqual(splitEvenCents(4200, 1), [4200]);
});

test('splitEvenCents rejects a non-positive count', () => {
  assert.throws(() => splitEvenCents(100, 0), RangeError);
  assert.throws(() => splitEvenCents(100, -2), RangeError);
});

test('splitEvenCents rejects a negative total', () => {
  assert.throws(() => splitEvenCents(-100, 3), RangeError);
});
