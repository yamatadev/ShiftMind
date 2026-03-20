export type Role = 'RN' | 'CNA' | 'MED_TECH' | 'ACTIVITIES' | 'KITCHEN' | 'HOUSEKEEPING' | 'SECURITY' | 'SUPERVISOR';
export type Shift = 'morning' | 'afternoon' | 'night';
export type DayType = 'weekday' | 'weekend' | 'holiday';

export interface Worker {
  id: number;
  name: string;
  role: Role;
  avatarSeed: string;
  isActive: boolean;
  isPartTime: boolean;
  hireDate: string;
  phone: string;
  notes: string | null;
}

export interface Assignment {
  id: number;
  workerId: number;
  workerName: string;
  date: string;
  shift: Shift;
  role: Role;
}

export interface Template {
  id: number;
  name: string;
  dayType: DayType;
  slots: TemplateSlot[];
}

export interface TemplateSlot {
  id: number;
  role: Role;
  shift: Shift;
  requiredCount: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  actions: Array<{ type: string; summary: string }>;
}

export interface Gap {
  date: string;
  shift: Shift;
  role: Role;
  required: number;
  assigned: number;
}
