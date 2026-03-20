import WeekNavigator from './WeekNavigator';
import CalendarGrid from './CalendarGrid';
import RoleLegend from '../../components/RoleLegend';
import { useScheduleContext } from '../../contexts/ScheduleContext';

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 animate-pulse">
      <div />
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="h-6 bg-border-light rounded" />
      ))}
      {Array.from({ length: 3 }, (_, row) => (
        <>
          <div key={`label-${row}`} className="h-16 bg-border-light rounded" />
          {Array.from({ length: 7 }, (_, col) => (
            <div key={`${row}-${col}`} className="h-16 bg-border-light rounded" />
          ))}
        </>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const { weekDates, assignments, gaps, loading } = useScheduleContext();

  return (
    <>
      <WeekNavigator />
      <RoleLegend />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <CalendarGrid
            weekDates={weekDates}
            assignments={assignments}
            gaps={gaps}
          />
        )}
      </div>
    </>
  );
}
