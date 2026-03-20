import { useState, useMemo, useCallback } from 'react';
import { getMonday, getWeekDates, addWeeks } from '../lib/dates';

export function useWeek() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const prevWeek = useCallback(() => {
    setWeekStart(prev => addWeeks(prev, -1));
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart(prev => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setWeekStart(getMonday(new Date()));
  }, []);

  return { weekStart, weekDates, prevWeek, nextWeek, goToToday };
}
