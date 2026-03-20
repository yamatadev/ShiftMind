import { fetchApi } from './client';
import type { Gap } from '../types';

export function autoFillSchedule(data: { startDate: string; endDate: string }): Promise<{ filled: number }> {
  return fetchApi<{ filled: number }>('/api/schedule/auto-fill', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fillGap(data: { date: string; shift: string; role: string; workerId: number }): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>('/api/schedule/fill-gap', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchGaps(startDate: string, endDate: string): Promise<Gap[]> {
  return fetchApi<Gap[]>(`/api/schedule/gaps?startDate=${startDate}&endDate=${endDate}`);
}
