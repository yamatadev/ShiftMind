import type { Role, Shift } from '../../types';
import { ROLE_CONFIG } from '../../lib/roles';
import { useChatContext } from '../../contexts/ChatContext';

interface EmptySlotProps {
  role: Role;
  date: string;
  shift: Shift;
}

const SHIFT_LABELS: Record<Shift, string> = {
  morning: 'morning',
  afternoon: 'afternoon',
  night: 'night',
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function EmptySlot({ role, date, shift }: EmptySlotProps) {
  const config = ROLE_CONFIG[role];
  const { sendMessage, toggleOpen, isOpen } = useChatContext();

  const handleClick = () => {
    const dateLabel = formatDateLabel(date);
    const shiftLabel = SHIFT_LABELS[shift];
    const message = `Can you fill the ${config.display} gap on ${dateLabel} ${shiftLabel} shift?`;

    if (!isOpen) {
      toggleOpen();
    }
    sendMessage(message);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer border border-dashed transition-opacity hover:opacity-80 border-gap-border bg-gap-bg text-gap-text"
    >
      {config.abbrev} &middot; Unfilled
    </button>
  );
}
