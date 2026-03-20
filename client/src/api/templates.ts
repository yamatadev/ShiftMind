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
  data: { slotId: number; requiredCount: number }
): Promise<Template> {
  return fetchApi<Template>(`/api/templates/${templateId}/slots`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
