import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Badge from '../components/Badge';

const Topbar = ({ onToggleSidebar }) => {
  const { user, roles, logout } = useAuth();

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">Welcome back, {user?.username || 'User'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="info">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
};

export default Topbar;
