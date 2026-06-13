import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  Home,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'] },
  { to: '/patients', label: 'Patients', icon: ClipboardList, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'] },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['ADMIN'] },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/reception', label: 'Reception', icon: ClipboardCheck, roles: ['ADMIN', 'NURSE'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/lab-tests', label: 'Lab Tests', icon: FlaskConical, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/medicines', label: 'Medicines', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/invoices', label: 'Invoices', icon: CreditCard, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['ADMIN'] },
];

const Sidebar = () => {
  const { roles } = useAuth();
  const allowedItems = menuItems.filter((item) => item.roles.some((role) => roles.includes(role)));

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-10 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
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
                isActive ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : 'text-slate-600 hover:bg-slate-50'
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
