import { Power, Trash2 } from 'lucide-react';
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

type WorkerWithAvailability = Worker & { weeklyAvailability: boolean[] };

interface WorkerRowProps {
  worker: WorkerWithAvailability;
  onEdit: (worker: WorkerWithAvailability) => void;
  onToggleActive: (worker: WorkerWithAvailability) => void;
  onDelete: (worker: WorkerWithAvailability) => void;
}

export default function WorkerRow({ worker, onEdit, onToggleActive, onDelete }: WorkerRowProps) {
  const initials = getInitials(worker.name);

  const availability = worker.weeklyAvailability;

  return (
    <tr className={`border-t border-border transition-colors ${worker.isActive ? 'hover:bg-base/50' : 'opacity-60 bg-base/30'}`}>
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
            Inactive
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(worker)}
            className="px-3 py-1 text-xs font-medium text-secondary border border-border rounded-lg hover:bg-base transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleActive(worker)}
            title={worker.isActive ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg border transition-colors ${
              worker.isActive
                ? 'border-border text-secondary hover:text-amber-600 hover:border-amber-300'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(worker)}
            title="Delete worker"
            className="p-1.5 rounded-lg border border-border text-secondary hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
