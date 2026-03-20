import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAssignments } from '../api/assignments';
import { fetchGaps } from '../api/schedule';
import type { Assignment, Gap } from '../types';

export function useSchedule(weekDates: string[]) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAssignmentIds, setNewAssignmentIds] = useState<Set<number>>(new Set());
  const prevAssignmentIdsRef = useRef<Set<number>>(new Set());

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

      // Detect newly added assignments
      const currentIds = prevAssignmentIdsRef.current;
      if (currentIds.size > 0) {
        const added = new Set(
          assignmentData
            .filter((a) => !currentIds.has(a.id))
            .map((a) => a.id)
        );
        if (added.size > 0) {
          setNewAssignmentIds(added);
          // Clear shimmer after animation completes
          setTimeout(() => setNewAssignmentIds(new Set()), 650);
        }
      }

      prevAssignmentIdsRef.current = new Set(assignmentData.map((a) => a.id));
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

  return { assignments, gaps, loading, refetch, newAssignmentIds };
}
