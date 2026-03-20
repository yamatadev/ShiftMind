import { fetchApi } from './client';
import type { Role, Worker } from '../types';

export function fetchWorkers(role?: Role): Promise<Worker[]> {
  const params = role ? `?role=${role}` : '';
  return fetchApi<Worker[]>(`/api/workers${params}`);
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
