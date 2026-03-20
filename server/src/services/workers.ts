import { eq, and, like } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  workers,
  availability,
  availabilityOverrides,
  assignments,
} from '../db/schema.js';
import type { Role, Shift, Worker, Availability, AvailabilityOverride } from '../types.js';

/**
 * Convert an ISO date string to our day-of-week convention (0=Mon … 6=Sun).
 */
function dateToDayOfWeek(date: string): number {
  const jsDay = new Date(date).getUTCDay(); // 0=Sun … 6=Sat
  // Map: Sun(0)→6, Mon(1)→0, Tue(2)→1, … Sat(6)→5
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * List all active workers, optionally filtered by role.
 */
export function getAllWorkers(role?: Role): Worker[] {
  if (role) {
    return db
      .select()
      .from(workers)
      .where(and(eq(workers.isActive, true), eq(workers.role, role)))
      .all();
  }
  return db.select().from(workers).where(eq(workers.isActive, true)).all();
}

/**
 * Get a single worker by ID, along with their availability data.
 */
export function getWorkerById(id: number): {
  worker: Worker;
  availability: Availability[];
  overrides: AvailabilityOverride[];
} | null {
  const worker = db.select().from(workers).where(eq(workers.id, id)).get();
  if (!worker) return null;

  const avail = db
    .select()
    .from(availability)
    .where(eq(availability.workerId, id))
    .all();

  const overrides = db
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.workerId, id))
    .all();

  return { worker, availability: avail, overrides };
}

/**
 * Get workers eligible for a specific date + shift + role.
 * Checks: active, correct role, available on that day (weekly pattern + overrides),
 * and not already assigned to that date + shift.
 */
export function getAvailableWorkers(date: string, shift: Shift, role: Role): Worker[] {
  // 1. Get all active workers with the given role
  const candidates = db
    .select()
    .from(workers)
    .where(and(eq(workers.isActive, true), eq(workers.role, role)))
    .all();

  if (candidates.length === 0) return [];

  // 2. Filter out workers who are already assigned to this date + shift
  const assignedWorkerIds = db
    .select({ workerId: assignments.workerId })
    .from(assignments)
    .where(and(eq(assignments.date, date), eq(assignments.shift, shift)))
    .all()
    .map((a) => a.workerId);

  const assignedSet = new Set(assignedWorkerIds);

  // 3. Check availability for each remaining candidate
  return candidates.filter((worker) => {
    if (assignedSet.has(worker.id)) return false;
    return isWorkerAvailable(worker.id, date);
  });
}

/**
 * Fuzzy (case-insensitive partial) name lookup.
 */
export function getWorkerByName(name: string): Worker[] {
  return db
    .select()
    .from(workers)
    .where(like(workers.name, `%${name}%`))
    .all();
}

/**
 * Check whether a worker is available on a given date.
 * Override for that specific date wins over the weekly pattern.
 */
export function isWorkerAvailable(workerId: number, date: string): boolean {
  // 1. Check for an override on this specific date
  const override = db
    .select()
    .from(availabilityOverrides)
    .where(
      and(
        eq(availabilityOverrides.workerId, workerId),
        eq(availabilityOverrides.date, date),
      ),
    )
    .get();

  if (override) return override.isAvailable;

  // 2. Fall back to the weekly availability pattern
  const dayOfWeek = dateToDayOfWeek(date);
  const pattern = db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.workerId, workerId),
        eq(availability.dayOfWeek, dayOfWeek),
      ),
    )
    .get();

  // If no pattern row exists, assume available
  if (!pattern) return true;

  return pattern.isAvailable;
}

/**
 * Get a worker's full availability info: weekly pattern + all overrides.
 */
export function getWorkerAvailability(workerId: number): {
  weekly: Availability[];
  overrides: AvailabilityOverride[];
} {
  const weekly = db
    .select()
    .from(availability)
    .where(eq(availability.workerId, workerId))
    .all();

  const overrides = db
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.workerId, workerId))
    .all();

  return { weekly, overrides };
}

/**
 * Add an availability override for a specific date.
 */
export function addAvailabilityOverride(
  workerId: number,
  date: string,
  isAvailable: boolean,
  reason?: string,
): AvailabilityOverride {
  return db
    .insert(availabilityOverrides)
    .values({ workerId, date, isAvailable, reason: reason ?? null })
    .returning()
    .get();
}

/**
 * Remove an availability override by its ID.
 */
export function removeAvailabilityOverride(overrideId: number): void {
  db.delete(availabilityOverrides)
    .where(eq(availabilityOverrides.id, overrideId))
    .run();
}

/**
 * Create a new worker.
 */
export function createWorker(data: {
  name: string;
  role: Role;
  isPartTime: boolean;
  phone: string;
  hireDate: string;
  notes?: string;
}): Worker {
  const worker = db
    .insert(workers)
    .values({
      name: data.name,
      role: data.role,
      avatarSeed: data.name.toLowerCase().replace(/[^a-z]/g, ''),
      isActive: true,
      isPartTime: data.isPartTime,
      hireDate: data.hireDate,
      phone: data.phone,
      notes: data.notes ?? null,
    })
    .returning()
    .get();

  // Create default availability (all 7 days available for full-time, Mon-Fri for part-time)
  for (let day = 0; day < 7; day++) {
    db.insert(availability).values({
      workerId: worker.id,
      dayOfWeek: day,
      isAvailable: data.isPartTime ? day < 5 : true,
    }).run();
  }

  return worker;
}

/**
 * Update a worker's information.
 */
export function updateWorker(id: number, data: {
  name?: string;
  role?: Role;
  isPartTime?: boolean;
  phone?: string;
  notes?: string | null;
  isActive?: boolean;
}): Worker | null {
  const existing = db.select().from(workers).where(eq(workers.id, id)).get();
  if (!existing) return null;

  const updated = db
    .update(workers)
    .set({
      ...(data.name !== undefined && { name: data.name, avatarSeed: data.name.toLowerCase().replace(/[^a-z]/g, '') }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.isPartTime !== undefined && { isPartTime: data.isPartTime }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(eq(workers.id, id))
    .returning()
    .get();

  return updated ?? null;
}
