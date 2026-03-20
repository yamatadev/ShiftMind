import { fetchApi } from './client';
import type { Role, Worker } from '../types';

export function fetchWorkers(role?: Role): Promise<Worker[]> {
  const params = role ? `?role=${role}` : '';
  return fetchApi<Worker[]>(`/api/workers${params}`);
}

export function fetchWorkersWithAvailability(includeInactive?: boolean): Promise<(Worker & { weeklyAvailability: boolean[] })[]> {
  const params = includeInactive ? '?includeInactive=true' : '';
  return fetchApi<(Worker & { weeklyAvailability: boolean[] })[]>(`/api/workers/with-availability${params}`);
}

export function fetchWorkerById(id: number): Promise<Worker> {
  return fetchApi<Worker>(`/api/workers/${id}`);
}

export function fetchAvailableWorkers(date: string, shift: string, role: Role): Promise<Worker[]> {
  return fetchApi<Worker[]>(`/api/workers/available?date=${date}&shift=${shift}&role=${role}`);
}

export function fetchWorkerAvailability(id: number): Promise<{ date: string; available: boolean }[]> {
  return fetchApi<{ date: string; available: boolean }[]>(`/api/workers/${id}/availability`);
}

export function createWorkerApi(data: {
  name: string;
  role: string;
  isPartTime: boolean;
  phone: string;
  hireDate: string;
  notes?: string;
}): Promise<Worker> {
  return fetchApi<Worker>('/api/workers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateWorkerApi(id: number, data: Partial<{
  name: string;
  role: string;
  isPartTime: boolean;
  phone: string;
  notes: string | null;
  isActive: boolean;
  weeklyAvailability: boolean[];
}>): Promise<Worker> {
  return fetchApi<Worker>(`/api/workers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteWorkerApi(id: number): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/api/workers/${id}`, {
    method: 'DELETE',
  });
}
