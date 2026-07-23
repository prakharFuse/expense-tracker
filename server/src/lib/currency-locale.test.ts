import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney } from './money.js';

// KNOWN FAILING (pre-existing): pending i18n work — negative amounts should
// render with the typographic minus (U+2212), not the ASCII hyphen. Tracked
// separately; do NOT fix as part of unrelated changes.
test('formatMoney renders negatives with a typographic minus (pending i18n)', () => {
  assert.equal(formatMoney(-750), '−$7.50');
});
