import type { Role } from '../../types';
import { ROLE_CONFIG } from '../../lib/roles';
import Tooltip from '../../components/Tooltip';

interface WorkerChipProps {
  workerName: string;
  role: Role;
  phone?: string;
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

export default function WorkerChip({ workerName, role, phone }: WorkerChipProps) {
  const config = ROLE_CONFIG[role];
  const lastName = getLastName(workerName);

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{workerName}</span>
          <span>{config.display}</span>
          {phone && <span>{phone}</span>}
        </div>
      }
    >
      <span
        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer transition-opacity hover:opacity-80"
        style={{
          backgroundColor: `${config.color}18`,
          color: config.color,
        }}
      >
        {config.abbrev} &middot; {lastName}
      </span>
    </Tooltip>
  );
}
