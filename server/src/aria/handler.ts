import Anthropic from '@anthropic-ai/sdk';
import { getAriaSystemPrompt } from './system-prompt.js';
import { ARIA_TOOLS } from './tools.js';

import { getAssignments, createAssignment, deleteAssignment, clearAssignments } from '../services/assignments.js';
import { getAvailableWorkers, getWorkerByName, getWorkerAvailability } from '../services/workers.js';
import { getTemplateForDate, updateTemplateSlot, getAllTemplates } from '../services/templates.js';
import { autoFillSchedule, fillGap, getGaps } from '../services/autofill.js';
import type { Role, Shift, DayType } from '../types.js';

const MAX_ITERATIONS = 10;

interface ChatAction {
  type: string;
  summary: string;
}

interface ChatResult {
  reply: string;
  actions: ChatAction[];
}

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

function executeTool(
  name: string,
  input: Record<string, unknown>,
  actions: ChatAction[],
): string {
  switch (name) {
    // ---- Read-only tools ----

    case 'get_schedule': {
      const rows = getAssignments(
        input.startDate as string,
        input.endDate as string,
      );
      return JSON.stringify(rows);
    }

    case 'get_workers_on_shift': {
      // Re-use getAssignments for a single day and filter by shift
      const all = getAssignments(input.date as string, input.date as string);
      const filtered = all.filter((a) => a.shift === input.shift);
      return JSON.stringify(filtered);
    }

    case 'get_available_workers': {
      const workers = getAvailableWorkers(
        input.date as string,
        input.shift as Shift,
        input.role as Role,
      );
      return JSON.stringify(
        workers.map((w) => ({ id: w.id, name: w.name, role: w.role })),
      );
    }

    case 'get_gaps': {
      const gaps = getGaps(
        input.startDate as string,
        input.endDate as string,
      );
      return JSON.stringify(gaps);
    }

    // ---- Mutation tools ----

    case 'clear_schedule': {
      const count = clearAssignments(
        input.startDate as string,
        input.endDate as string,
      );
      actions.push({
        type: 'assignments_changed',
        summary: `Cleared ${count} assignment${count !== 1 ? 's' : ''} from ${input.startDate} to ${input.endDate}`,
      });
      return JSON.stringify({ success: true, removed: count });
    }

    case 'auto_fill_schedule': {
      const result = autoFillSchedule(
        input.startDate as string,
        input.endDate as string,
        input.templateId as number | undefined,
      );
      actions.push({
        type: 'assignments_changed',
        summary: `Filled ${result.filled} slot${result.filled !== 1 ? 's' : ''}${result.gaps > 0 ? `, ${result.gaps} gap${result.gaps !== 1 ? 's' : ''} remaining` : ''}`,
      });
      return JSON.stringify(result);
    }

    case 'remove_worker_from_shift': {
      const workerName = input.workerName as string;
      const date = input.date as string;
      const shift = input.shift as string;

      // Look up worker by name
      const matches = getWorkerByName(workerName);
      if (matches.length === 0) {
        return JSON.stringify({ error: `No worker found matching "${workerName}"` });
      }
      if (matches.length > 1) {
        return JSON.stringify({
          error: `Multiple workers match "${workerName}": ${matches.map((w) => w.name).join(', ')}. Please be more specific.`,
        });
      }

      const worker = matches[0];

      // Find their assignment for that date + shift
      const dayAssignments = getAssignments(date, date);
      const assignment = dayAssignments.find(
        (a) => a.workerId === worker.id && a.shift === shift,
      );

      if (!assignment) {
        return JSON.stringify({
          error: `${worker.name} is not assigned to the ${shift} shift on ${date}`,
        });
      }

      const deleted = deleteAssignment(assignment.id);
      actions.push({
        type: 'assignments_changed',
        summary: `Removed ${worker.name} from ${shift} shift on ${date}`,
      });
      return JSON.stringify({ success: true, removed: deleted });
    }

    case 'fill_gap': {
      // Resolve excluded worker names to IDs
      let excludeIds: number[] | undefined;
      const excludeNames = input.excludeWorkerNames as string[] | undefined;
      if (excludeNames && excludeNames.length > 0) {
        excludeIds = [];
        for (const name of excludeNames) {
          const matches = getWorkerByName(name);
          for (const m of matches) excludeIds.push(m.id);
        }
      }

      const result = fillGap(
        input.date as string,
        input.shift as Shift,
        input.role as Role,
        excludeIds,
      );
      if (result) {
        actions.push({
          type: 'assignments_changed',
          summary: `Assigned ${result.workerName} to ${input.shift} ${input.role} on ${input.date}`,
        });
        return JSON.stringify({ success: true, assigned: result });
      }
      return JSON.stringify({
        error: `No available ${input.role} workers for ${input.shift} shift on ${input.date}`,
      });
    }

    case 'assign_worker_to_shift': {
      const workerName = input.workerName as string;
      const date = input.date as string;
      const shift = input.shift as Shift;
      const role = input.role as Role;

      const matches = getWorkerByName(workerName);
      if (matches.length === 0) {
        return JSON.stringify({ error: `No worker found matching "${workerName}"` });
      }
      if (matches.length > 1) {
        return JSON.stringify({
          error: `Multiple workers match "${workerName}": ${matches.map((w) => w.name).join(', ')}. Please be more specific.`,
        });
      }

      const worker = matches[0];
      const result = createAssignment(worker.id, date, shift, role);
      if ('error' in result) {
        return JSON.stringify({ error: result.error });
      }

      actions.push({
        type: 'assignments_changed',
        summary: `Assigned ${worker.name} to ${shift} ${role} on ${date}`,
      });
      return JSON.stringify({ success: true, assigned: { workerId: worker.id, workerName: worker.name } });
    }

    case 'adjust_template_requirement': {
      const dayType = input.dayType as DayType;
      const shift = input.shift as Shift;
      const role = input.role as Role;
      const requiredCount = input.requiredCount as number;

      // Find the template for this day type
      const templates = getAllTemplates();
      const template = templates.find((t) => t.dayType === dayType);
      if (!template) {
        return JSON.stringify({ error: `No template found for day type "${dayType}"` });
      }

      const updated = updateTemplateSlot(template.id, role, shift, requiredCount);
      if (!updated) {
        return JSON.stringify({
          error: `No slot found for ${role} on ${shift} shift in ${dayType} template`,
        });
      }

      actions.push({
        type: 'template_changed',
        summary: `Updated ${dayType} ${shift} ${role} to ${requiredCount}`,
      });
      return JSON.stringify({ success: true, slot: updated });
    }

    case 'get_worker_info': {
      const workerName = input.workerName as string;
      const matches = getWorkerByName(workerName);
      if (matches.length === 0) {
        return JSON.stringify({ error: `No worker found matching "${workerName}"` });
      }
      if (matches.length > 1) {
        return JSON.stringify({
          workers: matches.map((w) => ({ id: w.id, name: w.name, role: w.role })),
          note: `Multiple workers match "${workerName}". Please be more specific.`,
        });
      }

      const worker = matches[0];
      const avail = getWorkerAvailability(worker.id);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const availableDays = avail.weekly
        .filter((a) => a.isAvailable)
        .map((a) => dayNames[a.dayOfWeek])
        .join(', ');

      return JSON.stringify({
        id: worker.id,
        name: worker.name,
        role: worker.role,
        isPartTime: worker.isPartTime,
        isActive: worker.isActive,
        hireDate: worker.hireDate,
        phone: worker.phone,
        availableDays: availableDays || 'None',
        upcomingOverrides: avail.overrides.map((o) => ({
          date: o.date,
          available: o.isAvailable,
          reason: o.reason,
        })),
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Chat handler
// ---------------------------------------------------------------------------

export async function handleChat(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      reply: 'The Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment.',
      actions: [],
    };
  }

  const client = new Anthropic({ apiKey });
  const actions: ChatAction[] = [];

  // Build messages from conversation history + new message
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  let currentMessages = messages;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: getAriaSystemPrompt(),
      tools: ARIA_TOOLS,
      messages: currentMessages,
    });

    // Check if we have tool use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use',
    );

    // If no tool use, extract text and return
    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );
      const reply = textBlocks.map((b) => b.text).join('\n') || 'I processed your request.';
      return { reply, actions };
    }

    // Execute each tool and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      (toolBlock) => {
        const result = executeTool(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>,
          actions,
        );
        return {
          type: 'tool_result' as const,
          tool_use_id: toolBlock.id,
          content: result,
        };
      },
    );

    // Feed tool results back into the conversation
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  // If we exhausted iterations, be honest about what happened
  const actionSummary = actions.length > 0
    ? `\n\nWhat I managed to do:\n${actions.map((a) => `- ${a.summary}`).join('\n')}`
    : '';

  return {
    reply: `I wasn't able to fully complete your request — it required more steps than I can handle in one go.${actionSummary}\n\nPlease try breaking the task into smaller steps, or let me know what's still needed and I'll continue.`,
    actions,
  };
}
