/**
 * Money helpers. All amounts are integer **cents** so we never accumulate
 * floating-point drift.
 */

const dollarsFormatter = new Intl.NumberFormat('en-US');

/**
 * Format integer cents as a currency string with comma-grouped thousands,
 * e.g. 1234 -> "$12.34", 100000 -> "$1,000.00".
 */
export function formatMoney(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError('formatMoney expects an integer number of cents');
  }
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollarsFormatter.format(dollars)}.${remainder.toString().padStart(2, '0')}`;
}

/**
 * Split an integer amount of cents evenly across `count` people. Because cents
 * are indivisible, any leftover is distributed one cent at a time to the first
 * `remainder` shares, so the shares always sum back to `total`.
 *
 * splitEvenCents(1000, 3) -> [334, 333, 333]
 */
export function splitEvenCents(total: number, count: number): number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError('total must be a non-negative integer number of cents');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError('count must be a positive integer');
  }
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  const shares: number[] = [];
  for (let i = 0; i < count; i += 1) {
    shares.push(base + (i < remainder ? 1 : 0));
  }
  return shares;
}
