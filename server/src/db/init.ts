import { sqlite } from './connection.js';
import { seedDatabase } from './seed.js';

/**
 * Auto-initialize the database on server startup.
 * Runs migrations (CREATE IF NOT EXISTS) and seeds if empty.
 * Safe to call on every startup — fully idempotent.
 */
export function initDatabase(): void {
  console.log('[db] Running auto-migrations...');

  const statements = [
    `CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_seed TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_part_time INTEGER NOT NULL DEFAULT 0,
      hire_date TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL REFERENCES workers(id),
      day_of_week INTEGER NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS availability_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL REFERENCES workers(id),
      date TEXT NOT NULL,
      is_available INTEGER NOT NULL,
      reason TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS schedule_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      day_type TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS template_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES schedule_templates(id),
      role TEXT NOT NULL,
      shift TEXT NOT NULL,
      required_count INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL REFERENCES workers(id),
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      role TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_worker_day
      ON availability(worker_id, day_of_week)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_worker_date_shift
      ON assignments(worker_id, date, shift)`,
  ];

  for (const sql of statements) {
    sqlite.exec(sql);
  }

  console.log('[db] Migrations complete.');

  // Auto-seed if database is empty (handles ephemeral filesystems like Render free tier)
  seedDatabase();
}
