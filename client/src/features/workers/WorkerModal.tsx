import { useState } from 'react';
import { X } from 'lucide-react';
import { createWorkerApi, updateWorkerApi } from '../../api/workers';
import { ALL_ROLES, ROLE_CONFIG } from '../../lib/roles';
import type { Role, Worker } from '../../types';

interface WorkerModalProps {
  worker?: Worker;
  onClose: () => void;
  onSave: () => void;
}

export default function WorkerModal({ worker, onClose, onSave }: WorkerModalProps) {
  const isEdit = !!worker;

  const [name, setName] = useState(worker?.name ?? '');
  const [role, setRole] = useState<Role>(worker?.role ?? ALL_ROLES[0]);
  const [phone, setPhone] = useState(worker?.phone ?? '');
  const [hireDate, setHireDate] = useState(worker?.hireDate ?? new Date().toISOString().slice(0, 10));
  const [isPartTime, setIsPartTime] = useState(worker?.isPartTime ?? false);
  const [notes, setNotes] = useState(worker?.notes ?? '');
  const [isActive, setIsActive] = useState(worker?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateWorkerApi(worker.id, {
          name,
          role,
          isPartTime,
          phone,
          notes: notes || null,
          isActive,
        });
      } else {
        await createWorkerApi({
          name,
          role,
          isPartTime,
          phone,
          hireDate,
          notes: notes || undefined,
        });
      }
      onSave();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save worker';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-lg border border-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-primary">
            {isEdit ? 'Edit Worker' : 'Add Worker'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-secondary hover:bg-base transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_CONFIG[r].display}
                </option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {/* Hire Date (add mode only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Hire Date</label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          )}

          {/* Part-time */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPartTime}
              onChange={(e) => setIsPartTime(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent/30"
            />
            <span className="text-sm text-primary">Part-time</span>
          </label>

          {/* Active (edit mode only) */}
          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent/30"
              />
              <span className="text-sm text-primary">Active</span>
            </label>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary border border-border rounded-lg hover:bg-base transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !phone.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
