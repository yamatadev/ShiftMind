import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, ArrowLeft } from 'lucide-react';
import { fetchWorkersWithAvailability, updateWorkerApi, deleteWorkerApi } from '../../api/workers';
import { ROLE_CONFIG, ALL_ROLES } from '../../lib/roles';
import type { Role, Worker } from '../../types';
import WorkerRow from './WorkerRow';
import WorkerModal from './WorkerModal';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type StatusFilter = 'active' | 'inactive' | 'all';
type WorkerWithAvailability = Worker & { weeklyAvailability: boolean[] };

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<WorkerWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dayFilter, setDayFilter] = useState<number[]>([]);
  const [editingWorker, setEditingWorker] = useState<WorkerWithAvailability | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Worker | null>(null);

  const loadWorkers = useCallback(() => {
    setLoading(true);
    fetchWorkersWithAvailability(true) // always fetch all, filter on client
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  function toggleDay(dayIndex: number) {
    setDayFilter((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  }

  async function handleToggleActive(worker: Worker) {
    try {
      await updateWorkerApi(worker.id, { isActive: !worker.isActive });
      setToast({
        message: `${worker.name} ${worker.isActive ? 'deactivated' : 'activated'} successfully`,
        type: 'success',
      });
      loadWorkers();
    } catch {
      setToast({ message: 'Failed to update worker status', type: 'error' });
    }
  }

  async function handleDelete(worker: Worker) {
    try {
      await deleteWorkerApi(worker.id);
      setToast({ message: `${worker.name} deleted successfully`, type: 'success' });
      setConfirmDelete(null);
      loadWorkers();
    } catch {
      setToast({ message: 'Failed to delete worker', type: 'error' });
      setConfirmDelete(null);
    }
  }

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      // Status filter
      if (statusFilter === 'active' && !w.isActive) return false;
      if (statusFilter === 'inactive' && w.isActive) return false;
      if (roleFilter && w.role !== roleFilter) return false;
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (dayFilter.length > 0) {
        const allMatch = dayFilter.every((day) => w.weeklyAvailability[day]);
        if (!allMatch) return false;
      }
      return true;
    });
  }, [workers, search, roleFilter, statusFilter, dayFilter]);

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Back to Schedule */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Schedule
      </button>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-heading font-semibold text-primary">Workers</h2>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-border-light text-secondary">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search workers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent w-56"
            />
          </div>

          {/* Add Worker */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Worker
          </button>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_CONFIG[role].display}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All Workers</option>
          </select>
        </div>
      </div>

      {/* Availability day filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">
          Available on:
        </span>
        <div className="flex items-center gap-1">
          {DAY_LABELS.map((label, i) => {
            const isActive = dayFilter.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-secondary hover:text-primary hover:border-primary/30'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {dayFilter.length > 0 && (
          <button
            onClick={() => setDayFilter([])}
            className="text-xs text-secondary hover:text-primary transition-colors underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-base/50">
              <th className="px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Availability</th>
              <th className="px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-secondary">
                  Loading workers…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-secondary">
                  No workers found.
                </td>
              </tr>
            ) : (
              filtered.map((worker) => (
                <WorkerRow
                  key={worker.id}
                  worker={worker}
                  onEdit={setEditingWorker}
                  onToggleActive={handleToggleActive}
                  onDelete={(w) => setConfirmDelete(w)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingWorker) && (
        <WorkerModal
          worker={editingWorker ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingWorker(null);
          }}
          onSave={(message) => {
            setShowAddModal(false);
            setEditingWorker(null);
            setToast({ message, type: 'success' });
            loadWorkers();
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Worker"
          message={`Are you sure you want to permanently delete ${confirmDelete.name}? This will also remove all their assignments and availability data. This action cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
