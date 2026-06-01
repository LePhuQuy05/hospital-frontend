import { NavLink } from 'react-router-dom';
import { Users, ClipboardList, FileText, CreditCard, ShieldCheck, Home } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/patients', label: 'Patients', icon: ClipboardList, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/medicines', label: 'Medicines', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/invoices', label: 'Invoices', icon: CreditCard, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
];

const Sidebar = () => {
  const { roles } = useAuth();
  const allowedItems = menuItems.filter((item) => item.roles.some((role) => roles.includes(role)));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white">
          H
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Hospital System</p>
          <p className="text-xs text-slate-400">Admin panel</p>
        </div>
      </div>

      <nav className="space-y-1">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
