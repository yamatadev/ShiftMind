import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  workers,
  availability,
  availabilityOverrides,
  scheduleTemplates,
  templateSlots,
  assignments,
} from './db/schema.js';

// Re-export enum types
export type { Role, Shift, DayType } from './db/schema.js';
export { ROLES, SHIFTS, DAY_TYPES } from './db/schema.js';

// --- Select (read) types ---
export type Worker = InferSelectModel<typeof workers>;
export type Availability = InferSelectModel<typeof availability>;
export type AvailabilityOverride = InferSelectModel<typeof availabilityOverrides>;
export type ScheduleTemplate = InferSelectModel<typeof scheduleTemplates>;
export type TemplateSlot = InferSelectModel<typeof templateSlots>;
export type Assignment = InferSelectModel<typeof assignments>;

// --- Insert (write) types ---
export type NewWorker = InferInsertModel<typeof workers>;
export type NewAvailability = InferInsertModel<typeof availability>;
export type NewAvailabilityOverride = InferInsertModel<typeof availabilityOverrides>;
export type NewScheduleTemplate = InferInsertModel<typeof scheduleTemplates>;
export type NewTemplateSlot = InferInsertModel<typeof templateSlots>;
export type NewAssignment = InferInsertModel<typeof assignments>;
