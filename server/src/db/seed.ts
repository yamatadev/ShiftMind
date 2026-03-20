import { db, sqlite } from './connection.js';
import {
  workers,
  availability,
  availabilityOverrides,
  scheduleTemplates,
  templateSlots,
  assignments,
  type Role,
  type Shift,
  ROLES,
} from './schema.js';
import { count } from 'drizzle-orm';

// ─── Helpers ─────────────────────────────────────────────────────────

function phone(seed: number): string {
  const n = ((seed * 9301 + 49297) % 899) + 100;
  const m = ((seed * 7919 + 10007) % 9000) + 1000;
  return `(555) ${String(n).padStart(3, '0')}-${String(m).padStart(4, '0')}`;
}

function hireDate(seed: number): string {
  // Hire dates spread over 2020-2025
  const year = 2020 + (seed % 6);
  const month = (seed * 3 + 1) % 12 + 1;
  const day = (seed * 7 + 1) % 28 + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 0=Mon..6=Sun from an ISO date string */
function dayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z');
  // JS: 0=Sun, 1=Mon ... 6=Sat  =>  Our: 0=Mon ... 6=Sun
  return (d.getUTCDay() + 6) % 7;
}

/** Generate ISO dates from start to end inclusive */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T12:00:00Z');
  const last = new Date(end + 'T12:00:00Z');
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// ─── Worker Data ─────────────────────────────────────────────────────

interface WorkerSeed {
  name: string;
  role: Role;
  isPartTime: boolean;
}

const WORKER_DATA: WorkerSeed[] = [
  // RN — 8
  { name: 'Maria Santos', role: 'RN', isPartTime: false },
  { name: 'James Washington', role: 'RN', isPartTime: false },
  { name: 'Priya Patel', role: 'RN', isPartTime: false },
  { name: 'Sarah Olsen', role: 'RN', isPartTime: true },
  { name: 'Tomoko Yamada', role: 'RN', isPartTime: false },
  { name: 'Fatima Al-Rashid', role: 'RN', isPartTime: false },
  { name: 'David Chen', role: 'RN', isPartTime: true },
  { name: 'Grace Okonkwo', role: 'RN', isPartTime: false },

  // CNA — 14
  { name: 'Carlos Rivera', role: 'CNA', isPartTime: false },
  { name: 'Aisha Johnson', role: 'CNA', isPartTime: false },
  { name: 'Mikhail Petrov', role: 'CNA', isPartTime: true },
  { name: 'Lena Nguyen', role: 'CNA', isPartTime: true },
  { name: 'Marcus Thompson', role: 'CNA', isPartTime: false },
  { name: 'Sofia Hernandez', role: 'CNA', isPartTime: false },
  { name: 'Kenji Takahashi', role: 'CNA', isPartTime: true },
  { name: 'Amara Diop', role: 'CNA', isPartTime: false },
  { name: 'Ryan O\'Brien', role: 'CNA', isPartTime: false },
  { name: 'Mei-Lin Chang', role: 'CNA', isPartTime: true },
  { name: 'Olga Kowalski', role: 'CNA', isPartTime: false },
  { name: 'Derek Williams', role: 'CNA', isPartTime: false },
  { name: 'Jasmine Robinson', role: 'CNA', isPartTime: true },
  { name: 'Hassan Ibrahim', role: 'CNA', isPartTime: false },

  // MED_TECH — 4
  { name: 'Linda Park', role: 'MED_TECH', isPartTime: false },
  { name: 'Robert Garcia', role: 'MED_TECH', isPartTime: false },
  { name: 'Nadia Volkov', role: 'MED_TECH', isPartTime: true },
  { name: 'Timothy Foster', role: 'MED_TECH', isPartTime: false },

  // ACTIVITIES — 4
  { name: 'Angela Martinez', role: 'ACTIVITIES', isPartTime: false },
  { name: 'Kwame Asante', role: 'ACTIVITIES', isPartTime: false },
  { name: 'Rachel Kim', role: 'ACTIVITIES', isPartTime: true },
  { name: 'Patrick Dubois', role: 'ACTIVITIES', isPartTime: false },

  // KITCHEN — 8
  { name: 'Elena Rossi', role: 'KITCHEN', isPartTime: false },
  { name: 'Jerome Jackson', role: 'KITCHEN', isPartTime: false },
  { name: 'Yuki Tanaka', role: 'KITCHEN', isPartTime: true },
  { name: 'Beatrice Nkomo', role: 'KITCHEN', isPartTime: false },
  { name: 'Sam Adeyemi', role: 'KITCHEN', isPartTime: true },
  { name: 'Hannah Mueller', role: 'KITCHEN', isPartTime: false },
  { name: 'Diego Morales', role: 'KITCHEN', isPartTime: true },
  { name: 'Lydia Abrams', role: 'KITCHEN', isPartTime: false },

  // HOUSEKEEPING — 5
  { name: 'Rosa Gutierrez', role: 'HOUSEKEEPING', isPartTime: false },
  { name: 'Victor Osei', role: 'HOUSEKEEPING', isPartTime: false },
  { name: 'Tanya Sokolov', role: 'HOUSEKEEPING', isPartTime: true },
  { name: 'Mohammed Farah', role: 'HOUSEKEEPING', isPartTime: false },
  { name: 'Claire Bouchard', role: 'HOUSEKEEPING', isPartTime: false },

  // SECURITY — 4
  { name: 'Andre Williams', role: 'SECURITY', isPartTime: false },
  { name: 'Suki Ramirez', role: 'SECURITY', isPartTime: false },
  { name: 'Ivan Horvat', role: 'SECURITY', isPartTime: true },
  { name: 'Nkechi Eze', role: 'SECURITY', isPartTime: false },

  // SUPERVISOR — 6
  { name: 'Margaret Liu', role: 'SUPERVISOR', isPartTime: false },
  { name: 'Daniel Abubakar', role: 'SUPERVISOR', isPartTime: false },
  { name: 'Karen Johansson', role: 'SUPERVISOR', isPartTime: false },
  { name: 'Paul Nakamura', role: 'SUPERVISOR', isPartTime: true },
  { name: 'Sharon Baptiste', role: 'SUPERVISOR', isPartTime: true },
  { name: 'Frank Novak', role: 'SUPERVISOR', isPartTime: false },
];

// ─── Template Slot Data ──────────────────────────────────────────────

type SlotDef = { role: Role; shift: Shift; requiredCount: number };

const WEEKDAY_SLOTS: SlotDef[] = [
  // Morning: 2 RN, 4 CNA, 1 Med, 1 Act, 2 Kitchen, 1 Hsk, 0 Sec, 1 Sup = 12
  { role: 'RN', shift: 'morning', requiredCount: 2 },
  { role: 'CNA', shift: 'morning', requiredCount: 4 },
  { role: 'MED_TECH', shift: 'morning', requiredCount: 1 },
  { role: 'ACTIVITIES', shift: 'morning', requiredCount: 1 },
  { role: 'KITCHEN', shift: 'morning', requiredCount: 2 },
  { role: 'HOUSEKEEPING', shift: 'morning', requiredCount: 1 },
  { role: 'SECURITY', shift: 'morning', requiredCount: 0 },
  { role: 'SUPERVISOR', shift: 'morning', requiredCount: 1 },
  // Afternoon: 2 RN, 3 CNA, 1 Med, 1 Act, 2 Kitchen, 1 Hsk, 1 Sec, 0 Sup = 11
  { role: 'RN', shift: 'afternoon', requiredCount: 2 },
  { role: 'CNA', shift: 'afternoon', requiredCount: 3 },
  { role: 'MED_TECH', shift: 'afternoon', requiredCount: 1 },
  { role: 'ACTIVITIES', shift: 'afternoon', requiredCount: 1 },
  { role: 'KITCHEN', shift: 'afternoon', requiredCount: 2 },
  { role: 'HOUSEKEEPING', shift: 'afternoon', requiredCount: 1 },
  { role: 'SECURITY', shift: 'afternoon', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'afternoon', requiredCount: 0 },
  // Night: 1 RN, 2 CNA, 0 Med, 0 Act, 0 Kitchen, 0 Hsk, 1 Sec, 1 Sup = 5
  { role: 'RN', shift: 'night', requiredCount: 1 },
  { role: 'CNA', shift: 'night', requiredCount: 2 },
  { role: 'MED_TECH', shift: 'night', requiredCount: 0 },
  { role: 'ACTIVITIES', shift: 'night', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'night', requiredCount: 0 },
  { role: 'HOUSEKEEPING', shift: 'night', requiredCount: 0 },
  { role: 'SECURITY', shift: 'night', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'night', requiredCount: 1 },
];

const WEEKEND_SLOTS: SlotDef[] = [
  // Morning: 1 RN, 2 CNA, 1 Med, 1 Act, 1 Kitchen, 1 Hsk, 0 Sec, 1 Sup
  { role: 'RN', shift: 'morning', requiredCount: 1 },
  { role: 'CNA', shift: 'morning', requiredCount: 2 },
  { role: 'MED_TECH', shift: 'morning', requiredCount: 1 },
  { role: 'ACTIVITIES', shift: 'morning', requiredCount: 1 },
  { role: 'KITCHEN', shift: 'morning', requiredCount: 1 },
  { role: 'HOUSEKEEPING', shift: 'morning', requiredCount: 1 },
  { role: 'SECURITY', shift: 'morning', requiredCount: 0 },
  { role: 'SUPERVISOR', shift: 'morning', requiredCount: 1 },
  // Afternoon: 1 RN, 2 CNA, 0 Med, 0 Act, 1 Kitchen, 0 Hsk, 1 Sec, 0 Sup
  { role: 'RN', shift: 'afternoon', requiredCount: 1 },
  { role: 'CNA', shift: 'afternoon', requiredCount: 2 },
  { role: 'MED_TECH', shift: 'afternoon', requiredCount: 0 },
  { role: 'ACTIVITIES', shift: 'afternoon', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'afternoon', requiredCount: 1 },
  { role: 'HOUSEKEEPING', shift: 'afternoon', requiredCount: 0 },
  { role: 'SECURITY', shift: 'afternoon', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'afternoon', requiredCount: 0 },
  // Night: 1 RN, 1 CNA, 0 Med, 0 Act, 0 Kitchen, 0 Hsk, 1 Sec, 0 Sup
  { role: 'RN', shift: 'night', requiredCount: 1 },
  { role: 'CNA', shift: 'night', requiredCount: 1 },
  { role: 'MED_TECH', shift: 'night', requiredCount: 0 },
  { role: 'ACTIVITIES', shift: 'night', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'night', requiredCount: 0 },
  { role: 'HOUSEKEEPING', shift: 'night', requiredCount: 0 },
  { role: 'SECURITY', shift: 'night', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'night', requiredCount: 0 },
];

const HOLIDAY_SLOTS: SlotDef[] = [
  // Morning: 1 RN, 2 CNA, 1 Med, 0 Act, 1 Kitchen, 0 Hsk, 0 Sec, 1 Sup
  { role: 'RN', shift: 'morning', requiredCount: 1 },
  { role: 'CNA', shift: 'morning', requiredCount: 2 },
  { role: 'MED_TECH', shift: 'morning', requiredCount: 1 },
  { role: 'ACTIVITIES', shift: 'morning', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'morning', requiredCount: 1 },
  { role: 'HOUSEKEEPING', shift: 'morning', requiredCount: 0 },
  { role: 'SECURITY', shift: 'morning', requiredCount: 0 },
  { role: 'SUPERVISOR', shift: 'morning', requiredCount: 1 },
  // Afternoon: 1 RN, 1 CNA, 0 Med, 0 Act, 1 Kitchen, 0 Hsk, 1 Sec, 0 Sup
  { role: 'RN', shift: 'afternoon', requiredCount: 1 },
  { role: 'CNA', shift: 'afternoon', requiredCount: 1 },
  { role: 'MED_TECH', shift: 'afternoon', requiredCount: 0 },
  { role: 'ACTIVITIES', shift: 'afternoon', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'afternoon', requiredCount: 1 },
  { role: 'HOUSEKEEPING', shift: 'afternoon', requiredCount: 0 },
  { role: 'SECURITY', shift: 'afternoon', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'afternoon', requiredCount: 0 },
  // Night: 1 RN, 1 CNA, 0 Med, 0 Act, 0 Kitchen, 0 Hsk, 1 Sec, 0 Sup
  { role: 'RN', shift: 'night', requiredCount: 1 },
  { role: 'CNA', shift: 'night', requiredCount: 1 },
  { role: 'MED_TECH', shift: 'night', requiredCount: 0 },
  { role: 'ACTIVITIES', shift: 'night', requiredCount: 0 },
  { role: 'KITCHEN', shift: 'night', requiredCount: 0 },
  { role: 'HOUSEKEEPING', shift: 'night', requiredCount: 0 },
  { role: 'SECURITY', shift: 'night', requiredCount: 1 },
  { role: 'SUPERVISOR', shift: 'night', requiredCount: 0 },
];

// ─── Availability Override Data ──────────────────────────────────────

// ~10 workers with vacation/sick days scattered through March 2026
const OVERRIDE_DATA: { workerIndex: number; date: string; reason: string }[] = [
  { workerIndex: 2, date: '2026-03-03', reason: 'Vacation' },
  { workerIndex: 2, date: '2026-03-04', reason: 'Vacation' },
  { workerIndex: 2, date: '2026-03-05', reason: 'Vacation' },
  { workerIndex: 7, date: '2026-03-10', reason: 'Sick leave' },
  { workerIndex: 7, date: '2026-03-11', reason: 'Sick leave' },
  { workerIndex: 12, date: '2026-03-09', reason: 'Personal day' },
  { workerIndex: 15, date: '2026-03-16', reason: 'Vacation' },
  { workerIndex: 15, date: '2026-03-17', reason: 'Vacation' },
  { workerIndex: 15, date: '2026-03-18', reason: 'Vacation' },
  { workerIndex: 15, date: '2026-03-19', reason: 'Vacation' },
  { workerIndex: 15, date: '2026-03-20', reason: 'Vacation' },
  { workerIndex: 20, date: '2026-03-12', reason: 'Sick leave' },
  { workerIndex: 25, date: '2026-03-18', reason: 'Medical appointment' },
  { workerIndex: 30, date: '2026-03-13', reason: 'Jury duty' },
  { workerIndex: 30, date: '2026-03-14', reason: 'Jury duty' },
  { workerIndex: 35, date: '2026-03-20', reason: 'Vacation' },
  { workerIndex: 35, date: '2026-03-21', reason: 'Vacation' },
  { workerIndex: 40, date: '2026-03-11', reason: 'Sick leave' },
  { workerIndex: 45, date: '2026-03-19', reason: 'Personal day' },
  { workerIndex: 50, date: '2026-03-17', reason: 'Family emergency' },
  { workerIndex: 50, date: '2026-03-18', reason: 'Family emergency' },
];

// ─── Part-time availability patterns ─────────────────────────────────

// Part-time workers get 3-4 days. We'll use deterministic patterns.
const PART_TIME_PATTERNS: number[][] = [
  [0, 1, 2],       // Mon, Tue, Wed (3 days)
  [0, 2, 4, 5],    // Mon, Wed, Fri, Sat (4 days)
  [1, 3, 5],       // Tue, Thu, Sat (3 days)
  [0, 1, 3, 4],    // Mon, Tue, Thu, Fri (4 days)
  [2, 3, 4],       // Wed, Thu, Fri (3 days)
  [0, 2, 4, 6],    // Mon, Wed, Fri, Sun (4 days)
];

// ─── Seed Function ───────────────────────────────────────────────────

/**
 * Seed the database with demo data. Idempotent — skips if workers already exist.
 * Can be called from server startup (init.ts) or as a standalone CLI script.
 */
export function seedDatabase(): boolean {
  const existingWorkers = db.select({ cnt: count() }).from(workers).get();
  if (existingWorkers && existingWorkers.cnt > 0) {
    console.log(`[seed] Workers table already has ${existingWorkers.cnt} rows. Skipping.`);
    return false;
  }

  console.log('[seed] Starting seed...');

  const runSeed = sqlite.transaction(() => {
  console.log('Inserting 53 workers...');
  const insertedWorkers: { id: number; role: Role }[] = [];

  for (let i = 0; i < WORKER_DATA.length; i++) {
    const w = WORKER_DATA[i];
    const result = db.insert(workers).values({
      name: w.name,
      role: w.role,
      avatarSeed: w.name.toLowerCase().replace(/[^a-z]/g, ''),
      isActive: true,
      isPartTime: w.isPartTime,
      hireDate: hireDate(i),
      phone: phone(i),
      notes: null,
    }).returning({ id: workers.id }).get();

    insertedWorkers.push({ id: result.id, role: w.role });
  }

  console.log(`Inserted ${insertedWorkers.length} workers.`);

  // --- Step 2: Availability ---
  console.log('Inserting availability...');
  let availCount = 0;

  let partTimeIdx = 0;
  for (let i = 0; i < WORKER_DATA.length; i++) {
    const w = WORKER_DATA[i];
    const workerId = insertedWorkers[i].id;

    if (w.isPartTime) {
      const pattern = PART_TIME_PATTERNS[partTimeIdx % PART_TIME_PATTERNS.length];
      partTimeIdx++;
      for (let day = 0; day <= 6; day++) {
        db.insert(availability).values({
          workerId,
          dayOfWeek: day,
          isAvailable: pattern.includes(day),
        }).run();
        availCount++;
      }
    } else {
      // Full-time: available all 7 days
      for (let day = 0; day <= 6; day++) {
        db.insert(availability).values({
          workerId,
          dayOfWeek: day,
          isAvailable: true,
        }).run();
        availCount++;
      }
    }
  }

  console.log(`Inserted ${availCount} availability rows.`);

  // --- Step 3: Availability Overrides ---
  console.log('Inserting availability overrides...');

  for (const o of OVERRIDE_DATA) {
    const workerId = insertedWorkers[o.workerIndex].id;
    db.insert(availabilityOverrides).values({
      workerId,
      date: o.date,
      isAvailable: false,
      reason: o.reason,
    }).run();
  }

  console.log(`Inserted ${OVERRIDE_DATA.length} availability overrides.`);

  // --- Step 4: Schedule Templates ---
  console.log('Inserting schedule templates...');

  const weekdayTemplate = db.insert(scheduleTemplates).values({
    name: 'Standard Weekday',
    dayType: 'weekday',
  }).returning({ id: scheduleTemplates.id }).get();

  const weekendTemplate = db.insert(scheduleTemplates).values({
    name: 'Standard Weekend',
    dayType: 'weekend',
  }).returning({ id: scheduleTemplates.id }).get();

  const holidayTemplate = db.insert(scheduleTemplates).values({
    name: 'Holiday',
    dayType: 'holiday',
  }).returning({ id: scheduleTemplates.id }).get();

  console.log(`Inserted 3 templates (IDs: ${weekdayTemplate.id}, ${weekendTemplate.id}, ${holidayTemplate.id}).`);

  // --- Step 5: Template Slots ---
  console.log('Inserting template slots...');

  const insertSlots = (templateId: number, slots: SlotDef[]) => {
    for (const s of slots) {
      db.insert(templateSlots).values({
        templateId,
        role: s.role,
        shift: s.shift,
        requiredCount: s.requiredCount,
      }).run();
    }
  };

  insertSlots(weekdayTemplate.id, WEEKDAY_SLOTS);
  insertSlots(weekendTemplate.id, WEEKEND_SLOTS);
  insertSlots(holidayTemplate.id, HOLIDAY_SLOTS);

  console.log(`Inserted ${WEEKDAY_SLOTS.length + WEEKEND_SLOTS.length + HOLIDAY_SLOTS.length} template slot rows.`);

  // --- Step 6: Assignments (2 weeks) ---
  console.log('Generating 2 weeks of assignments...');

  // Last week: 2026-03-09 (Mon) to 2026-03-15 (Sun)
  // Current week: 2026-03-16 (Mon) to 2026-03-22 (Sun)
  const allDates = dateRange('2026-03-09', '2026-03-22');

  // Build lookup: worker availability by role
  // Map<Role, workerId[]> — ordered list for round-robin
  const workersByRole = new Map<Role, number[]>();
  for (const role of ROLES) {
    workersByRole.set(
      role,
      insertedWorkers.filter((w) => w.role === role).map((w) => w.id),
    );
  }

  // Build availability lookup: Map<workerId, Set<dayOfWeek>>
  const availMap = new Map<number, Set<number>>();
  for (let i = 0; i < WORKER_DATA.length; i++) {
    const workerId = insertedWorkers[i].id;
    const days = new Set<number>();
    if (WORKER_DATA[i].isPartTime) {
      const pattern = PART_TIME_PATTERNS[(function() {
        // Recalculate partTimeIdx for this worker
        let idx = 0;
        for (let j = 0; j < i; j++) {
          if (WORKER_DATA[j].isPartTime) idx++;
        }
        return idx % PART_TIME_PATTERNS.length;
      })()];
      for (const d of pattern) days.add(d);
    } else {
      for (let d = 0; d <= 6; d++) days.add(d);
    }
    availMap.set(workerId, days);
  }

  // Build override lookup: Set of "workerId:date"
  const overrideSet = new Set<string>();
  for (const o of OVERRIDE_DATA) {
    overrideSet.add(`${insertedWorkers[o.workerIndex].id}:${o.date}`);
  }

  // Round-robin cursors per role per shift
  const cursors = new Map<string, number>();

  function isEligible(workerId: number, dateStr: string): boolean {
    const dow = dayOfWeek(dateStr);
    const avail = availMap.get(workerId);
    if (!avail || !avail.has(dow)) return false;
    if (overrideSet.has(`${workerId}:${dateStr}`)) return false;
    return true;
  }

  let assignmentCount = 0;
  // Track which workers are already assigned on a given date+shift to avoid conflicts
  const assignedOnDateShift = new Map<string, Set<number>>();

  for (const dateStr of allDates) {
    const dow = dayOfWeek(dateStr);
    const isWeekend = dow >= 5; // 5=Sat, 6=Sun
    const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS;

    for (const slot of slots) {
      if (slot.requiredCount === 0) continue;

      const roleWorkers = workersByRole.get(slot.role)!;
      const cursorKey = `${slot.role}:${slot.shift}`;
      let cursor = cursors.get(cursorKey) ?? 0;

      let assigned = 0;
      let attempts = 0;
      const maxAttempts = roleWorkers.length;

      while (assigned < slot.requiredCount && attempts < maxAttempts) {
        const workerId = roleWorkers[cursor % roleWorkers.length];
        cursor++;
        attempts++;

        if (!isEligible(workerId, dateStr)) continue;

        // Check not already assigned on this date+shift
        const dsKey = `${dateStr}:${slot.shift}`;
        let dsSet = assignedOnDateShift.get(dsKey);
        if (!dsSet) {
          dsSet = new Set();
          assignedOnDateShift.set(dsKey, dsSet);
        }
        if (dsSet.has(workerId)) continue;

        // Also check unique constraint: worker can only have one shift per date
        // Actually the constraint is worker_date_shift, so a worker CAN work multiple shifts
        // but let's keep it realistic — don't assign same worker to multiple shifts same day
        const dayKey1 = `${dateStr}:morning`;
        const dayKey2 = `${dateStr}:afternoon`;
        const dayKey3 = `${dateStr}:night`;
        const alreadyOnDay =
          (assignedOnDateShift.get(dayKey1)?.has(workerId) ?? false) ||
          (assignedOnDateShift.get(dayKey2)?.has(workerId) ?? false) ||
          (assignedOnDateShift.get(dayKey3)?.has(workerId) ?? false);
        if (alreadyOnDay) continue;

        db.insert(assignments).values({
          workerId,
          date: dateStr,
          shift: slot.shift,
          role: slot.role,
        }).run();

        dsSet.add(workerId);
        assigned++;
        assignmentCount++;
      }

      cursors.set(cursorKey, cursor);
    }
  }

  console.log(`Inserted ${assignmentCount} assignments.`);
  }); // end transaction

  runSeed();
  console.log('[seed] Seed complete!');
  return true;
}

// --- CLI entry point ---
// When run directly via `tsx src/db/seed.ts`, execute and close connection.
const isDirectRun = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');
if (isDirectRun) {
  try {
    seedDatabase();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}
