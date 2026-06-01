import { BarChart3, Calendar, DollarSign, Users, ClipboardList, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Badge from '../components/Badge';

const DashboardPage = () => {
  const { user, roles } = useAuth();

  const stats = [
    {
      label: 'Patients Today',
      value: '--',
      icon: Users,
      color: 'bg-sky-100 text-sky-600',
    },
    {
      label: 'Appointments Today',
      value: '--',
      icon: Calendar,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Revenue Today',
      value: '--',
      icon: DollarSign,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'New Patients (Month)',
      value: '--',
      icon: BarChart3,
      color: 'bg-rose-100 text-rose-600',
    },
  ];

  const quickLinks = {
    ADMIN: [
      { to: '/patients', label: 'Patients', icon: ClipboardList },
      { to: '/medicines', label: 'Medicines', icon: FileText },
      { to: '/invoices', label: 'Invoices', icon: CreditCard },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    ],
    DOCTOR: [
      { to: '/patients', label: 'Patients', icon: ClipboardList },
      { to: '/medicines', label: 'Medicines', icon: FileText },
      { to: '/invoices', label: 'Invoices', icon: CreditCard },
    ],
    NURSE: [
      { to: '/patients', label: 'Patients', icon: ClipboardList },
      { to: '/medicines', label: 'Medicines', icon: FileText },
      { to: '/invoices', label: 'Invoices', icon: CreditCard },
    ],
  };

  const links = roles.length > 0 && quickLinks[roles[0]] ? quickLinks[roles[0]] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Xin chào, <span className="text-sky-600">{user?.username || 'User'}</span>
        </h1>
        <p className="mt-2 text-slate-500">Welcome back to Hospital Management System</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role} variant="info">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-center text-sm font-semibold text-slate-900">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
