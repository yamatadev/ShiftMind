import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { fetchWorkers } from '../../api/workers';
import { ROLE_CONFIG, ALL_ROLES } from '../../lib/roles';
import type { Role, Worker } from '../../types';
import WorkerRow from './WorkerRow';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  useEffect(() => {
    setLoading(true);
    fetchWorkers()
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (roleFilter && w.role !== roleFilter) return false;
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [workers, search, roleFilter]);

  return (
    <div className="flex-1 overflow-auto p-6">
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
        </div>
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
                <WorkerRow key={worker.id} worker={worker} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
