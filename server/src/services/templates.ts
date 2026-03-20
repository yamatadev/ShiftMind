import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { scheduleTemplates, templateSlots } from '../db/schema.js';
import type { Role, Shift, DayType, ScheduleTemplate, TemplateSlot } from '../types.js';

/**
 * List all schedule templates with their slots.
 */
export function getAllTemplates(): (ScheduleTemplate & { slots: TemplateSlot[] })[] {
  const templates = db.select().from(scheduleTemplates).all();
  const allSlots = db.select().from(templateSlots).all();

  const slotsByTemplate = new Map<number, TemplateSlot[]>();
  for (const slot of allSlots) {
    if (!slotsByTemplate.has(slot.templateId)) {
      slotsByTemplate.set(slot.templateId, []);
    }
    slotsByTemplate.get(slot.templateId)!.push(slot);
  }

  return templates.map((t) => ({
    ...t,
    slots: slotsByTemplate.get(t.id) ?? [],
  }));
}

/**
 * Get a single template by ID, including its slots.
 */
export function getTemplateById(id: number): {
  template: ScheduleTemplate;
  slots: TemplateSlot[];
} | null {
  const template = db
    .select()
    .from(scheduleTemplates)
    .where(eq(scheduleTemplates.id, id))
    .get();

  if (!template) return null;

  const slots = db
    .select()
    .from(templateSlots)
    .where(eq(templateSlots.templateId, id))
    .all();

  return { template, slots };
}

/**
 * Auto-select a template based on a date string.
 * Mon-Fri → 'weekday', Sat-Sun → 'weekend'.
 */
export function getTemplateForDate(date: string): {
  template: ScheduleTemplate;
  slots: TemplateSlot[];
} | null {
  const jsDay = new Date(date).getUTCDay(); // 0=Sun … 6=Sat
  const dayType: DayType = jsDay === 0 || jsDay === 6 ? 'weekend' : 'weekday';

  const template = db
    .select()
    .from(scheduleTemplates)
    .where(eq(scheduleTemplates.dayType, dayType))
    .get();

  if (!template) return null;

  const slots = db
    .select()
    .from(templateSlots)
    .where(eq(templateSlots.templateId, template.id))
    .all();

  return { template, slots };
}

/**
 * Update a specific slot's required count in a template.
 * Matches on templateId + role + shift.
 */
export function updateTemplateSlot(
  templateId: number,
  role: Role,
  shift: Shift,
  requiredCount: number,
): TemplateSlot | null {
  const result = db
    .update(templateSlots)
    .set({ requiredCount })
    .where(
      and(
        eq(templateSlots.templateId, templateId),
        eq(templateSlots.role, role),
        eq(templateSlots.shift, shift),
      ),
    )
    .returning()
    .get();

  return result ?? null;
}
