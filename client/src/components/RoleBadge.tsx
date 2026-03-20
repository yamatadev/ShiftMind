import type { Role } from '../types';
import { ROLE_CONFIG } from '../lib/roles';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export default function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${className}`}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
    >
      {config.display}
    </span>
  );
}
