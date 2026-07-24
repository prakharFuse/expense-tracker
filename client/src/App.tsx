import { useState, useEffect, useCallback } from 'react';

interface Expense {
  id: number;
  description: string;
  amount_cents: number;
  paid_by: string;
  participants: string;
  category: string;
  spent_on: string;
}

interface Balance {
  person: string;
  amountCents: number;
}

interface Settlement {
  from: string;
  to: string;
  amountCents: number;
}

function money(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString('en-US')}.${remainder.toString().padStart(2, '0')}`;
}

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    try {
      const [ex, bal] = await Promise.all([
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/expenses/balances').then((r) => r.json()),
      ]);
      setExpenses((ex as { expenses: Expense[] }).expenses);
      setBalances((bal as { balances: Balance[] }).balances);
      setSettlements((bal as { settlements: Settlement[] }).settlements);
    } catch {
      setError('Failed to load expenses');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="app">
      <h1>Expense Tracker</h1>
      {error && <p className="error">{error}</p>}

      <h2>Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Paid by</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.spent_on}</td>
              <td>{e.description}</td>
              <td>{e.category}</td>
              <td>{e.paid_by}</td>
              <td>{money(e.amount_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Balances</h2>
      <ul>
        {balances.map((b) => (
          <li key={b.person}>
            {b.person}: {money(b.amountCents)}
          </li>
        ))}
      </ul>

      <h2>Settle up</h2>
      <ul>
        {settlements.map((s) => (
          <li className="settlement" key={`${s.from}->${s.to}`}>
            {s.from} → {s.to}: {money(s.amountCents)}
          </li>
        ))}
      </ul>
    </div>
  );
}
