import { eq, and, between } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { assignments, workers } from '../db/schema.js';
import type { Role, Shift, Assignment } from '../types.js';

export type AssignmentWithWorker = Assignment & { workerName: string };

/**
 * Get all assignments in a date range, joined with worker names.
 */
export function getAssignments(startDate: string, endDate: string): AssignmentWithWorker[] {
  const rows = db
    .select({
      id: assignments.id,
      workerId: assignments.workerId,
      date: assignments.date,
      shift: assignments.shift,
      role: assignments.role,
      workerName: workers.name,
    })
    .from(assignments)
    .innerJoin(workers, eq(assignments.workerId, workers.id))
    .where(between(assignments.date, startDate, endDate))
    .all();

  return rows;
}

/**
 * Create a new assignment. Returns the created assignment or an error
 * object with status 409 if the unique constraint is violated.
 */
export function createAssignment(
  workerId: number,
  date: string,
  shift: Shift,
  role: Role,
): Assignment | { error: string; status: 409 } {
  try {
    return db
      .insert(assignments)
      .values({ workerId, date, shift, role })
      .returning()
      .get();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed') || message.includes('SQLITE_CONSTRAINT')) {
      return {
        error: `Worker ${workerId} is already assigned to ${shift} shift on ${date}`,
        status: 409,
      };
    }
    throw err;
  }
}

/**
 * Delete an assignment by ID. Returns the gap info (date, shift, role)
 * or null if not found.
 */
export function deleteAssignment(
  assignmentId: number,
): { date: string; shift: string; role: string } | null {
  const existing = db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .get();

  if (!existing) return null;

  db.delete(assignments).where(eq(assignments.id, assignmentId)).run();

  return { date: existing.date, shift: existing.shift, role: existing.role };
}
