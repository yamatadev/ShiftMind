import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// --- Enum types ---

export const ROLES = ['RN', 'CNA', 'MED_TECH', 'ACTIVITIES', 'KITCHEN', 'HOUSEKEEPING', 'SECURITY', 'SUPERVISOR'] as const;
export type Role = typeof ROLES[number];

export const SHIFTS = ['morning', 'afternoon', 'night'] as const;
export type Shift = typeof SHIFTS[number];

export const DAY_TYPES = ['weekday', 'weekend', 'holiday'] as const;
export type DayType = typeof DAY_TYPES[number];

// --- Tables ---

export const workers = sqliteTable('workers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  avatarSeed: text('avatar_seed').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isPartTime: integer('is_part_time', { mode: 'boolean' }).notNull().default(false),
  hireDate: text('hire_date').notNull(),
  phone: text('phone').notNull(),
  notes: text('notes'),
});

export const availability = sqliteTable('availability', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull().references(() => workers.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Mon … 6=Sun
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
});

export const availabilityOverrides = sqliteTable('availability_overrides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull().references(() => workers.id),
  date: text('date').notNull(), // ISO date
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull(),
  reason: text('reason'),
});

export const scheduleTemplates = sqliteTable('schedule_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dayType: text('day_type').notNull(), // weekday / weekend / holiday
});

export const templateSlots = sqliteTable('template_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').notNull().references(() => scheduleTemplates.id),
  role: text('role').notNull(),
  shift: text('shift').notNull(), // morning / afternoon / night
  requiredCount: integer('required_count').notNull(),
});

export const assignments = sqliteTable('assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull().references(() => workers.id),
  date: text('date').notNull(), // ISO date
  shift: text('shift').notNull(), // morning / afternoon / night
  role: text('role').notNull(),
}, (table) => ({
  uniqueWorkerDateShift: uniqueIndex('idx_assignments_worker_date_shift').on(
    table.workerId,
    table.date,
    table.shift,
  ),
}));
