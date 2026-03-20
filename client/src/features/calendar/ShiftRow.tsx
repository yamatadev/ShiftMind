import { Sun, CloudSun, Moon, type LucideIcon } from 'lucide-react';
import type { Assignment, Gap, Shift } from '../../types';
import DayCell from './DayCell';

interface ShiftRowProps {
  shift: Shift;
  weekDates: string[];
  assignments: Assignment[];
  gaps: Gap[];
}

interface ShiftMeta {
  label: string;
  time: string;
  Icon: LucideIcon;
}

const SHIFT_META: Record<Shift, ShiftMeta> = {
  morning: { label: 'Morning', time: '6a–2p', Icon: Sun },
  afternoon: { label: 'Afternoon', time: '2p–10p', Icon: CloudSun },
  night: { label: 'Night', time: '10p–6a', Icon: Moon },
};

export default function ShiftRow({ shift, weekDates, assignments, gaps }: ShiftRowProps) {
  const { label, time, Icon } = SHIFT_META[shift];

  return (
    <>
      {/* Shift label cell */}
      <div className="flex flex-col items-center justify-center gap-1 py-2 text-text-secondary">
        <Icon size={16} />
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="text-[10px]">{time}</span>
      </div>

      {/* Day cells */}
      {weekDates.map((date) => {
        const cellAssignments = assignments.filter(
          (a) => a.date === date && a.shift === shift
        );
        const cellGaps = gaps.filter(
          (g) => g.date === date && g.shift === shift
        );

        return (
          <DayCell
            key={date}
            date={date}
            shift={shift}
            assignments={cellAssignments}
            gaps={cellGaps}
          />
        );
      })}
    </>
  );
}
