import type { Assignment, Gap, Shift } from '../../types';
import { isToday } from '../../lib/dates';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import WorkerChip from './WorkerChip';
import EmptySlot from './EmptySlot';

interface DayCellProps {
  date: string;
  shift: Shift;
  assignments: Assignment[];
  gaps: Gap[];
}

export default function DayCell({ date, shift, assignments, gaps }: DayCellProps) {
  const today = isToday(date);
  const { newAssignmentIds } = useScheduleContext();

  const hasShimmer = assignments.some((a) => newAssignmentIds.has(a.id));

  return (
    <div
      className={`rounded-lg border p-1.5 min-h-[60px] flex flex-wrap gap-1 content-start ${
        today ? 'bg-today border-border' : 'bg-surface border-border-light'
      }${hasShimmer ? ' shimmer' : ''}`}
    >
      {assignments.map((a) => (
        <WorkerChip key={a.id} workerName={a.workerName} role={a.role} />
      ))}
      {gaps.map((gap) => {
        const count = Math.max(0, gap.required - gap.assigned);
        return Array.from({ length: count }, (_, i) => (
          <EmptySlot key={`${gap.role}-${i}`} role={gap.role} date={date} shift={shift} />
        ));
      })}
    </div>
  );
}
