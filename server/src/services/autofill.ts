import { eq, and, between, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { assignments } from '../db/schema.js';
import type { Role, Shift, Worker, TemplateSlot } from '../types.js';
import { getAvailableWorkers } from './workers.js';
import { getTemplateForDate, getTemplateById } from './templates.js';
import { createAssignment } from './assignments.js';

// --- Types ---

export interface GapDetail {
  date: string;
  shift: string;
  role: string;
  required: number;
  assigned: number;
  gap: number;
}

export interface AutoFillResult {
  filled: number;
  gaps: number;
  details: Array<{ date: string; shift: string; role: string; workerName?: string }>;
}

// --- Scoring ---

/**
 * Score a worker for assignment priority.
 * Weights: fairness 50%, full-time preference 30%, seniority 20%.
 */
function scoreWorker(
  worker: Worker,
  shiftsThisWeek: number,
  maxShiftsThisWeek: number,
  oldestHireDate: string,
  newestHireDate: string,
): number {
  const fairness =
    maxShiftsThisWeek === 0 ? 1.0 : 1 - shiftsThisWeek / maxShiftsThisWeek;

  const fulltime = worker.isPartTime ? 0.3 : 1.0;

  const seniorityRange =
    new Date(newestHireDate).getTime() - new Date(oldestHireDate).getTime();
  const seniority =
    seniorityRange === 0
      ? 1.0
      : 1 -
        (new Date(worker.hireDate).getTime() -
          new Date(oldestHireDate).getTime()) /
          seniorityRange;

  return 0.5 * fairness + 0.3 * fulltime + 0.2 * seniority;
}

// --- Helper: get ISO week boundaries (Mon–Sun) for a date ---

function getWeekBounds(date: string): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  const jsDay = d.getUTCDay(); // 0=Sun … 6=Sat
  const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}

// --- Helper: count shifts per worker in a week ---

function getShiftsPerWorkerInWeek(
  date: string,
): Map<number, number> {
  const { weekStart, weekEnd } = getWeekBounds(date);
  const rows = db
    .select({
      workerId: assignments.workerId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(assignments)
    .where(between(assignments.date, weekStart, weekEnd))
    .groupBy(assignments.workerId)
    .all();

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.workerId, row.count);
  }
  return map;
}

// --- Helper: date iteration ---

function eachDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

// --- Gap detection ---

/**
 * Compare template slot requirements against actual assignments
 * for each date/shift/role combination. A gap exists when assigned < required.
 */
export function getGaps(startDate: string, endDate: string): GapDetail[] {
  const gaps: GapDetail[] = [];
  const dates = eachDate(startDate, endDate);

  for (const date of dates) {
    const templateData = getTemplateForDate(date);
    if (!templateData) continue;

    const { slots } = templateData;

    for (const slot of slots) {
      // Count existing assignments for this date/shift/role
      const assignedCount = db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(assignments)
        .where(
          and(
            eq(assignments.date, date),
            eq(assignments.shift, slot.shift),
            eq(assignments.role, slot.role),
          ),
        )
        .get()!.count;

      if (assignedCount < slot.requiredCount) {
        gaps.push({
          date,
          shift: slot.shift,
          role: slot.role,
          required: slot.requiredCount,
          assigned: assignedCount,
          gap: slot.requiredCount - assignedCount,
        });
      }
    }
  }

  return gaps;
}

// --- Fill a single gap ---

/**
 * Find the best available worker for a single gap and assign them.
 * Returns the assigned worker name, or null if no one is available.
 */
export function fillGap(
  date: string,
  shift: Shift,
  role: Role,
  excludeWorkerIds?: number[],
): { workerId: number; workerName: string } | null {
  let available = getAvailableWorkers(date, shift, role);

  if (excludeWorkerIds && excludeWorkerIds.length > 0) {
    const excluded = new Set(excludeWorkerIds);
    available = available.filter((w) => !excluded.has(w.id));
  }

  if (available.length === 0) return null;

  // Gather scoring context
  const shiftsMap = getShiftsPerWorkerInWeek(date);
  const maxShifts = Math.max(0, ...Array.from(shiftsMap.values()));

  const hireDates = available.map((w) => w.hireDate).sort();
  const oldestHireDate = hireDates[0];
  const newestHireDate = hireDates[hireDates.length - 1];

  // Score and sort descending
  const scored = available
    .map((w) => ({
      worker: w,
      score: scoreWorker(
        w,
        shiftsMap.get(w.id) ?? 0,
        maxShifts,
        oldestHireDate,
        newestHireDate,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0].worker;

  const result = createAssignment(best.id, date, shift, role);
  if ('error' in result) return null;

  return { workerId: best.id, workerName: best.name };
}

// --- Auto-fill schedule ---

/**
 * Iterate each date in range, get the template, find gaps, fill them
 * with the highest-scoring available workers.
 */
export function autoFillSchedule(
  startDate: string,
  endDate: string,
  templateId?: number,
): AutoFillResult {
  const dates = eachDate(startDate, endDate);
  let filled = 0;
  let gaps = 0;
  const details: AutoFillResult['details'] = [];

  for (const date of dates) {
    // Determine template: use explicit templateId or auto-detect
    let slots: TemplateSlot[];
    if (templateId != null) {
      const tmpl = getTemplateById(templateId);
      if (!tmpl) continue;
      slots = tmpl.slots;
    } else {
      const tmpl = getTemplateForDate(date);
      if (!tmpl) continue;
      slots = tmpl.slots;
    }

    for (const slot of slots) {
      // How many already assigned for this date/shift/role?
      const assignedCount = db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(assignments)
        .where(
          and(
            eq(assignments.date, date),
            eq(assignments.shift, slot.shift),
            eq(assignments.role, slot.role),
          ),
        )
        .get()!.count;

      const needed = slot.requiredCount - assignedCount;
      if (needed <= 0) continue;

      for (let i = 0; i < needed; i++) {
        const result = fillGap(date, slot.shift as Shift, slot.role as Role);
        if (result) {
          filled++;
          details.push({
            date,
            shift: slot.shift,
            role: slot.role,
            workerName: result.workerName,
          });
        } else {
          gaps++;
          details.push({
            date,
            shift: slot.shift,
            role: slot.role,
          });
        }
      }
    }
  }

  return { filled, gaps, details };
}
