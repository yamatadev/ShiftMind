import type { Worker } from '../../types';
import RoleBadge from '../../components/RoleBadge';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatHireDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface WorkerRowProps {
  worker: Worker;
}

export default function WorkerRow({ worker }: WorkerRowProps) {
  const initials = getInitials(worker.name);

  // Simplified availability: full-time = all 7 days green, part-time = weekdays green, weekends gray
  const availability = DAY_LABELS.map((_, i) => {
    if (!worker.isPartTime) return true; // full-time: all available
    return i < 5; // part-time: Mon–Fri available, Sat–Sun not
  });

  return (
    <tr className="border-t border-border hover:bg-base/50 transition-colors">
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-border-light flex items-center justify-center text-secondary text-sm font-medium shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-primary">{worker.name}</p>
            <p className="text-xs text-secondary">
              Hired {formatHireDate(worker.hireDate)} · {worker.isPartTime ? 'Part-time' : 'Full-time'}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={worker.role} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {worker.isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
            On Leave
          </span>
        )}
      </td>

      {/* Availability */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-secondary leading-none">{label}</span>
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: availability[i] ? '#2D5A3D' : '#E0DCD5',
                }}
              />
            </div>
          ))}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button className="px-3 py-1 text-xs font-medium text-secondary border border-border rounded-lg hover:bg-base transition-colors">
          View
        </button>
      </td>
    </tr>
  );
}
