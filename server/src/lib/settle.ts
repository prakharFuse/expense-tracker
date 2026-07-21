import { splitEvenCents } from './money.js';

export interface ExpenseInput {
  amountCents: number;
  paidBy: string;
  participants: string[];
}

export interface Transfer {
  from: string;
  to: string;
  amountCents: number;
}

/**
 * Net balance per person across all expenses. Positive means the person is owed
 * money (paid more than their share); negative means they owe. The balances
 * always sum to zero.
 */
export function computeBalances(expenses: ExpenseInput[]): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (person: string, delta: number): void => {
    balances.set(person, (balances.get(person) ?? 0) + delta);
  };
  for (const exp of expenses) {
    if (exp.participants.length === 0) {
      throw new RangeError('each expense needs at least one participant');
    }
    const shares = splitEvenCents(exp.amountCents, exp.participants.length);
    exp.participants.forEach((person, i) => add(person, -shares[i]));
    add(exp.paidBy, exp.amountCents);
  }
  return balances;
}

/**
 * Greedy settlement: repeatedly match the largest creditor with the largest
 * debtor until everyone is square. Not provably minimal, but produces a small
 * set of transfers that clears every balance.
 */
export function settleUp(balances: Map<string, number>): Transfer[] {
  const creditors: { person: string; amount: number }[] = [];
  const debtors: { person: string; amount: number }[] = [];
  for (const [person, amount] of balances) {
    if (amount > 0) creditors.push({ person, amount });
    else if (amount < 0) debtors.push({ person, amount: -amount });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);
    if (amount > 0) {
      transfers.push({ from: debt.person, to: credit.person, amountCents: amount });
    }
    credit.amount -= amount;
    debt.amount -= amount;
    if (credit.amount === 0) ci += 1;
    if (debt.amount === 0) di += 1;
  }
  return transfers;
}
