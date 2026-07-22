/**
 * Money helpers. All amounts are integer **cents** so we never accumulate
 * floating-point drift.
 */

/** Format integer cents as a currency string, e.g. 1234 -> "$12.34". */
export function formatMoney(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError('formatMoney expects an integer number of cents');
  }
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars}.${remainder.toString().padStart(2, '0')}`;
}

/**
 * Split an integer amount of cents evenly across `count` people. Because cents
 * are indivisible, any leftover is distributed one cent at a time to the first
 * `remainder` shares, so the shares always sum back to `total`. `total` may be
 * negative (e.g. a refund/credit); the split is computed on its magnitude and
 * re-signed so shares still sum back to `total`.
 *
 * splitEvenCents(1000, 3) -> [334, 333, 333]
 * splitEvenCents(-1000, 3) -> [-334, -333, -333]
 */
export function splitEvenCents(total: number, count: number): number[] {
  if (!Number.isInteger(total)) {
    throw new RangeError('total must be an integer number of cents');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError('count must be a positive integer');
  }
  const sign = total < 0 ? -1 : 1;
  const magnitude = Math.abs(total);
  const base = Math.floor(magnitude / count);
  const remainder = magnitude - base * count;
  const shares: number[] = [];
  for (let i = 0; i < count; i += 1) {
    shares.push(sign * (base + (i < remainder ? 1 : 0)));
  }
  return shares;
}
