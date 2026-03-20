import { createContext, useContext, type ReactNode } from 'react';
import { useWeek } from '../hooks/useWeek';
import { useSchedule } from '../hooks/useSchedule';
import type { Assignment, Gap } from '../types';

interface ScheduleContextValue {
  weekStart: Date;
  weekDates: string[];
  prevWeek: () => void;
  nextWeek: () => void;
  goToToday: () => void;
  assignments: Assignment[];
  gaps: Gap[];
  loading: boolean;
  refetch: () => Promise<void>;
  newAssignmentIds: Set<number>;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const week = useWeek();
  const schedule = useSchedule(week.weekDates);

  return (
    <ScheduleContext.Provider
      value={{
        weekStart: week.weekStart,
        weekDates: week.weekDates,
        prevWeek: week.prevWeek,
        nextWeek: week.nextWeek,
        goToToday: week.goToToday,
        assignments: schedule.assignments,
        gaps: schedule.gaps,
        loading: schedule.loading,
        refetch: schedule.refetch,
        newAssignmentIds: schedule.newAssignmentIds,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useScheduleContext must be used within ScheduleProvider');
  return ctx;
}
