import { fetchApi } from './client';
import type { Template } from '../types';

export function fetchTemplates(): Promise<Template[]> {
  return fetchApi<Template[]>('/api/templates');
}

export function fetchTemplateById(id: number): Promise<Template> {
  return fetchApi<Template>(`/api/templates/${id}`);
}

export function updateTemplateSlot(
  templateId: number,
  data: { role: string; shift: string; requiredCount: number },
): Promise<void> {
  return fetchApi<void>(`/api/templates/${templateId}/slots`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
