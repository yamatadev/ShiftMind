import { fetchApi } from './client';
import type { Assignment } from '../types';

export function fetchAssignments(startDate: string, endDate: string): Promise<Assignment[]> {
  return fetchApi<Assignment[]>(`/api/assignments?startDate=${startDate}&endDate=${endDate}`);
}

export function createAssignment(data: { workerId: number; date: string; shift: string; role: string }): Promise<Assignment> {
  return fetchApi<Assignment>('/api/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAssignment(id: number): Promise<void> {
  return fetchApi<void>(`/api/assignments/${id}`, { method: 'DELETE' });
}
