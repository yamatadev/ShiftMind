import { ROLE_CONFIG, ALL_ROLES } from '../lib/roles';

export default function RoleLegend() {
  return (
    <div className="flex items-center gap-4 px-6 py-2 border-b border-border bg-surface/80">
      <span className="text-[10px] font-medium text-secondary uppercase tracking-wider shrink-0">
        Roles
      </span>
      <div className="flex items-center gap-3 flex-wrap">
        {ALL_ROLES.map((role) => {
          const { display, color } = ROLE_CONFIG[role];
          return (
            <div key={role} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-text-secondary whitespace-nowrap">
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
