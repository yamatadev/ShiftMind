import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ClipboardList, LogOut } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import NavItem from './NavItem';

export default function Sidebar() {
  const { logout } = useSession();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-[220px] bg-sidebar text-white flex flex-col shrink-0 h-full">
      {/* Logo & subtitle */}
      <div className="p-5 pb-4">
        <img src="/logo-white.svg" alt="ShiftMind" className="h-8 mb-1" />
        <p className="text-xs text-text-secondary font-body">Sunrise Senior Living</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 space-y-0.5">
        <NavItem to="/" icon={Calendar} label="Schedule" />
        <NavItem to="/workers" icon={Users} label="Workers" />
        <NavItem to="/templates" icon={ClipboardList} label="Templates" />
      </nav>

      {/* User badge */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-white shrink-0">
          DM
        </div>
        <span className="text-sm text-white/90 font-medium flex-1 truncate">
          Demo Manager
        </span>
        <button
          onClick={handleLogout}
          className="text-text-secondary hover:text-white transition-colors"
          aria-label="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
