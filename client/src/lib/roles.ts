import type { Role } from '../types';

export interface RoleConfig {
  display: string;
  color: string;
  abbrev: string;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  RN: { display: 'Registered Nurse', color: '#3B82F6', abbrev: 'RN' },
  CNA: { display: 'Certified Nursing Asst', color: '#8B5CF6', abbrev: 'CNA' },
  MED_TECH: { display: 'Med Tech', color: '#EC4899', abbrev: 'Med' },
  ACTIVITIES: { display: 'Activities', color: '#F59E0B', abbrev: 'Act' },
  KITCHEN: { display: 'Kitchen', color: '#EF4444', abbrev: 'Kit' },
  HOUSEKEEPING: { display: 'Housekeeping', color: '#6366F1', abbrev: 'Hsk' },
  SECURITY: { display: 'Security', color: '#64748B', abbrev: 'Sec' },
  SUPERVISOR: { display: 'Supervisor', color: '#2D5A3D', abbrev: 'Sup' },
};

export const ALL_ROLES: Role[] = Object.keys(ROLE_CONFIG) as Role[];
