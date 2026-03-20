import type Anthropic from '@anthropic-ai/sdk';

export const ARIA_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_schedule',
    description:
      'Retrieve all staff assignments for a date range. Returns a list of assignments with worker names, dates, shifts, and roles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_workers_on_shift',
    description:
      'Get the list of workers currently assigned to a specific date and shift.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to check',
        },
      },
      required: ['date', 'shift'],
    },
  },
  {
    name: 'get_available_workers',
    description:
      'Find workers who are available and not yet assigned for a specific date, shift, and role. Useful for finding replacements or fill-ins.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to check availability for',
        },
        role: {
          type: 'string',
          enum: [
            'RN',
            'CNA',
            'MED_TECH',
            'ACTIVITIES',
            'KITCHEN',
            'HOUSEKEEPING',
            'SECURITY',
            'SUPERVISOR',
          ],
          description: 'The role to filter by',
        },
      },
      required: ['date', 'shift', 'role'],
    },
  },
  {
    name: 'auto_fill_schedule',
    description:
      'Automatically fill all open shifts in a date range using the best available workers based on fairness, full-time preference, and seniority scoring. Optionally use a specific template.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        templateId: {
          type: 'number',
          description: 'Optional template ID to use instead of auto-detecting by day type',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'remove_worker_from_shift',
    description:
      'Remove a specific worker from a shift on a given date. The worker is looked up by name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workerName: {
          type: 'string',
          description: 'The name (or partial name) of the worker to remove',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to remove the worker from',
        },
      },
      required: ['workerName', 'date', 'shift'],
    },
  },
  {
    name: 'fill_gap',
    description:
      'Find and assign the best available worker to fill a single open slot for a specific date, shift, and role. Supports excluding specific workers (e.g., when replacing someone).',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to fill',
        },
        role: {
          type: 'string',
          enum: [
            'RN',
            'CNA',
            'MED_TECH',
            'ACTIVITIES',
            'KITCHEN',
            'HOUSEKEEPING',
            'SECURITY',
            'SUPERVISOR',
          ],
          description: 'The role needed for this slot',
        },
        excludeWorkerNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of workers to exclude from consideration (e.g., the worker being replaced). Use this when replacing a worker so they are not reassigned back.',
        },
      },
      required: ['date', 'shift', 'role'],
    },
  },
  {
    name: 'assign_worker_to_shift',
    description:
      'Assign a specific worker (by name) to a shift on a given date. Use this when the user requests a specific person for a slot, rather than auto-filling.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workerName: {
          type: 'string',
          description: 'The name (or partial name) of the worker to assign',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to assign the worker to',
        },
        role: {
          type: 'string',
          enum: [
            'RN',
            'CNA',
            'MED_TECH',
            'ACTIVITIES',
            'KITCHEN',
            'HOUSEKEEPING',
            'SECURITY',
            'SUPERVISOR',
          ],
          description: 'The role for this assignment',
        },
      },
      required: ['workerName', 'date', 'shift', 'role'],
    },
  },
  {
    name: 'clear_schedule',
    description:
      'Remove ALL assignments in a date range. Use this when the user asks to clear or reset a week or date range. This is a bulk operation — much faster than removing workers one by one.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_gaps',
    description:
      'Find all understaffed shifts in a date range by comparing assignments against template requirements. Returns each gap with date, shift, role, required count, assigned count, and gap size.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'adjust_template_requirement',
    description:
      'Change the required number of workers for a specific role and shift in a schedule template. Affects future auto-fill and gap detection.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dayType: {
          type: 'string',
          enum: ['weekday', 'weekend', 'holiday'],
          description: 'The day type of the template to adjust',
        },
        shift: {
          type: 'string',
          enum: ['morning', 'afternoon', 'night'],
          description: 'The shift to adjust',
        },
        role: {
          type: 'string',
          enum: [
            'RN',
            'CNA',
            'MED_TECH',
            'ACTIVITIES',
            'KITCHEN',
            'HOUSEKEEPING',
            'SECURITY',
            'SUPERVISOR',
          ],
          description: 'The role to adjust',
        },
        requiredCount: {
          type: 'number',
          description: 'The new required number of workers for this slot',
        },
      },
      required: ['dayType', 'shift', 'role', 'requiredCount'],
    },
  },
  {
    name: 'get_worker_info',
    description:
      'Look up a worker by name to see their profile: role, employment type, hire date, phone, active status, and weekly availability. Use this when asked about a specific worker.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workerName: {
          type: 'string',
          description: 'The name (or partial name) of the worker to look up',
        },
      },
      required: ['workerName'],
    },
  },
];
