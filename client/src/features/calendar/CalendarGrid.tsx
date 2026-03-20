import type { Assignment, Gap, Shift } from '../../types';
import { formatDateHeader, isToday } from '../../lib/dates';
import ShiftRow from './ShiftRow';

interface CalendarGridProps {
  weekDates: string[];
  assignments: Assignment[];
  gaps: Gap[];
}

const SHIFTS: Shift[] = ['morning', 'afternoon', 'night'];

export default function CalendarGrid({ weekDates, assignments, gaps }: CalendarGridProps) {
  return (
    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1">
      {/* Header row */}
      <div /> {/* Empty corner cell */}
      {weekDates.map((date) => {
        const today = isToday(date);
        return (
          <div
            key={date}
            className={`text-center text-xs font-semibold py-2 rounded-t-lg ${
              today
                ? 'bg-today text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            {formatDateHeader(date)}
          </div>
        );
      })}

      {/* Shift rows */}
      {SHIFTS.map((shift) => (
        <ShiftRow
          key={shift}
          shift={shift}
          weekDates={weekDates}
          assignments={assignments}
          gaps={gaps}
        />
      ))}
    </div>
  );
}
