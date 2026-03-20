import { useState, useEffect, useCallback } from 'react';
import { fetchAssignments } from '../api/assignments';
import { fetchGaps } from '../api/schedule';
import type { Assignment, Gap } from '../types';

export function useSchedule(weekDates: string[]) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(false);

  const startDate = weekDates[0];
  const endDate = weekDates[weekDates.length - 1];

  const refetch = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [assignmentData, gapData] = await Promise.all([
        fetchAssignments(startDate, endDate),
        fetchGaps(startDate, endDate),
      ]);
      setAssignments(assignmentData);
      setGaps(gapData);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assignments, gaps, loading, refetch };
}
