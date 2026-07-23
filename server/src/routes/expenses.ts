import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { computeBalances, settleUp } from '../lib/settle.js';

interface ExpenseRow {
  id: number;
  description: string;
  amount_cents: number;
  paid_by: string;
  participants: string; // comma-separated names
  category: string;
  spent_on: string;
  created_at: string;
  updated_at: string;
}

const router: Router = Router();

function parseParticipants(csv: string): string[] {
  return csv.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM expenses ORDER BY spent_on DESC, id DESC'
  ).all() as unknown as ExpenseRow[];
  res.json({ expenses: rows });
});

router.post('/', (req: Request, res: Response): void => {
  const { description, amount_cents, paid_by, participants, category, spent_on } = req.body ?? {};

  if (
    typeof description !== 'string' || description.trim() === '' ||
    typeof paid_by !== 'string' || paid_by.trim() === '' ||
    typeof category !== 'string' || category.trim() === '' ||
    typeof spent_on !== 'string' || spent_on.trim() === ''
  ) {
    res.status(400).json({
      error: 'Missing required fields: description, amount_cents, paid_by, participants, category, spent_on',
    });
    return;
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    res.status(400).json({ error: 'amount_cents must be a positive integer (cents)' });
    return;
  }
  if (
    !Array.isArray(participants) ||
    participants.length === 0 ||
    !participants.every((p) => typeof p === 'string' && p.trim() !== '')
  ) {
    res.status(400).json({ error: 'participants must be a non-empty array of names' });
    return;
  }

  const db = getDb();
  const csv = (participants as string[]).map((p) => p.trim()).join(',');
  const info = db.prepare(
    'INSERT INTO expenses (description, amount_cents, paid_by, participants, category, spent_on) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(description.trim(), amount_cents, paid_by.trim(), csv, category.trim(), spent_on.trim());
  const created = db.prepare('SELECT * FROM expenses WHERE id = ?')
    .get(Number(info.lastInsertRowid)) as unknown as ExpenseRow;
  res.status(201).json(created);
});

router.get('/stats', (_req: Request, res: Response): void => {
  const db = getDb();
  const total = db.prepare(
    'SELECT COALESCE(SUM(amount_cents), 0) as total FROM expenses'
  ).get() as unknown as { total: number };
  const byCategory = db.prepare(
    'SELECT category, SUM(amount_cents) as total FROM expenses GROUP BY category ORDER BY total DESC'
  ).all() as unknown as { category: string; total: number }[];
  res.json({ totalCents: total.total, byCategory });
});

router.get('/balances', (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM expenses').all() as unknown as ExpenseRow[];
  const balances = computeBalances(
    rows.map((r) => ({
      amountCents: r.amount_cents,
      paidBy: r.paid_by,
      participants: parseParticipants(r.participants),
    }))
  );
  const settlements = settleUp(balances);
  res.json({
    balances: [...balances.entries()].map(([person, amountCents]) => ({ person, amountCents })),
    settlements,
  });
});

router.get('/export', (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM expenses ORDER BY id ASC').all() as unknown as ExpenseRow[];
  const header = 'expense_id,description,amount_cents,paid_by,participants,category,spent_on';
  const csv = [
    header,
    ...rows.map((r) =>
      [r.id, r.description, r.amount_cents, r.paid_by, `"${r.participants}"`, r.category, r.spent_on].join(',')
    ),
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(csv);
});

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?')
    .get(Number(req.params.id)) as unknown as ExpenseRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json(row);
});

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?')
    .get(Number(req.params.id)) as unknown as ExpenseRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  const { description, category, spent_on } = req.body ?? {};
  db.prepare(
    `UPDATE expenses SET
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      spent_on = COALESCE(?, spent_on),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(description ?? null, category ?? null, spent_on ?? null, row.id);
  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(row.id) as unknown as ExpenseRow;
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?')
    .get(Number(req.params.id)) as unknown as ExpenseRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  db.prepare('DELETE FROM expenses WHERE id = ?').run(row.id);
  res.json({ success: true });
});

export default router;
