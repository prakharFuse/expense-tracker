import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    // Read lazily (not at module load) so tests can set EXPENSE_DB_PATH=':memory:'
    // after importing this module — ESM hoists imports ahead of the test file's
    // own top-level statements, so a module-scope read would see the var too early.
    const DB_PATH = process.env.EXPENSE_DB_PATH ?? path.join(process.cwd(), 'data', 'expenses.db');
    if (DB_PATH !== ':memory:') {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    db = new DatabaseSync(DB_PATH);

    db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        paid_by TEXT NOT NULL,
        participants TEXT NOT NULL,
        category TEXT NOT NULL,
        spent_on TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const count = db.prepare('SELECT COUNT(*) as count FROM expenses').get() as unknown as { count: number };
    if (count.count === 0) {
      const insert = db.prepare(
        'INSERT INTO expenses (description, amount_cents, paid_by, participants, category, spent_on) VALUES (?, ?, ?, ?, ?, ?)'
      );
      insert.run('Team dinner', 12000, 'alice', 'alice,bob,carol', 'Food', '2024-05-01');
      insert.run('Uber to airport', 4200, 'bob', 'bob,carol', 'Transport', '2024-05-03');
      insert.run('Conference tickets', 90000, 'carol', 'alice,bob,carol', 'Events', '2024-05-10');
      insert.run('Coffee run', 1550, 'alice', 'alice,bob', 'Food', '2024-05-11');
    }
  }
  return db;
}
