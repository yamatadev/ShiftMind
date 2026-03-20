import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import { useChatContext } from '../../contexts/ChatContext';
import { getMonday } from '../../lib/dates';

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const startDay = weekStart.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

export default function WeekNavigator() {
  const { weekStart, prevWeek, nextWeek, goToToday } = useScheduleContext();
  const { toggleOpen } = useChatContext();

  const isCurrentWeek = useMemo(() => {
    const todayMonday = getMonday(new Date());
    return weekStart.getTime() === todayMonday.getTime();
  }, [weekStart]);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-md hover:bg-base transition-colors text-text-secondary"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-sm font-heading font-semibold text-text-primary min-w-[200px] text-center">
          {formatWeekRange(weekStart)}
        </span>

        <button
          onClick={nextWeek}
          className="p-1.5 rounded-md hover:bg-base transition-colors text-text-secondary"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={goToToday}
          disabled={isCurrentWeek}
          className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            isCurrentWeek
              ? 'bg-border text-secondary cursor-default'
              : 'bg-primary text-white hover:bg-primary-light'
          }`}
        >
          Today
        </button>
      </div>

      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary-light transition-colors"
      >
        <MessageCircle size={14} />
        Ask Aria
      </button>
    </div>
  );
}
