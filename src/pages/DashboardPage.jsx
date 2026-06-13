import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  DollarSign,
  ShieldCheck,
  Stethoscope,
  Users,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  Pill,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Badge from '../components/Badge';
import { getAppointments } from '../api/appointmentsApi';
import { getPatients } from '../api/patientsApi';
import { getTodayRevenue } from '../api/reportsApi';

const DashboardPage = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes('ADMIN');

  const [stats, setStats] = useState({
    patientsToday: null,
    appointmentsToday: null,
    revenueToday: null,
    totalPatients: null,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, apptRes] = await Promise.all([
          getPatients().catch(() => null),
          getAppointments().catch(() => null),
        ]);

        const allPatients = patientsRes?.data?.data || patientsRes?.data || [];
        const allAppts = apptRes?.data?.data || apptRes?.data || [];

        const today = new Date().toISOString().slice(0, 10);

        const patientsToday = Array.isArray(allPatients)
          ? allPatients.filter((p) => p.createdAt && p.createdAt.startsWith(today)).length
          : null;

        const appointmentsToday = Array.isArray(allAppts)
          ? allAppts.filter((a) => a.apptDatetime && a.apptDatetime.startsWith(today)).length
          : null;

        const totalPatients = Array.isArray(allPatients) ? allPatients.length : null;

        const sorted = Array.isArray(allAppts)
          ? [...allAppts]
              .sort((a, b) => new Date(b.apptDatetime) - new Date(a.apptDatetime))
              .slice(0, 5)
          : [];
        setRecentAppointments(sorted);

        let revenueToday = null;
        if (isAdmin) {
          try {
            const revRes = await getTodayRevenue();
            const raw = revRes?.data?.data ?? revRes?.data;
            revenueToday = raw != null ? raw : null;
          } catch (_) {}
        }

        setStats({ patientsToday, appointmentsToday, revenueToday, totalPatients });
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  const formatCurrency = (val) => {
    if (val == null) return '--';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatVal = (val) => (val == null ? '--' : val);

  const statCards = [
    {
      label: 'Patients Today',
      value: formatVal(stats.patientsToday),
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
      sub: stats.totalPatients != null ? stats.totalPatients + ' total registered' : '',
    },
    {
      label: 'Appointments Today',
      value: formatVal(stats.appointmentsToday),
      icon: CalendarDays,
      gradient: 'from-emerald-500 to-teal-600',
      sub: 'Scheduled for today',
    },
    {
      label: 'Revenue Today',
      value: isAdmin ? formatCurrency(stats.revenueToday) : 'N/A',
      icon: DollarSign,
      gradient: 'from-amber-500 to-orange-500',
      sub: isAdmin ? 'Admin only' : 'No access',
    },
    {
      label: 'Total Patients',
      value: formatVal(stats.totalPatients),
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      sub: 'All time registered',
    },
  ];

  const quickLinks = [
    {
      to: '/patients',
      label: 'Patients',
      icon: ClipboardList,
      desc: 'Manage patient records',
      color: 'bg-sky-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'],
    },
    {
      to: '/appointments',
      label: 'Appointments',
      icon: CalendarRange,
      desc: 'Schedule & track visits',
      color: 'bg-emerald-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      to: '/reception',
      label: 'Reception',
      icon: ClipboardCheck,
      desc: 'Check-in patients',
      color: 'bg-teal-500',
      roles: ['ADMIN', 'NURSE'],
    },
    {
      to: '/prescriptions',
      label: 'Prescriptions',
      icon: FileText,
      desc: 'Issue & view prescriptions',
      color: 'bg-indigo-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      to: '/lab-tests',
      label: 'Lab Tests',
      icon: FlaskConical,
      desc: 'Order & review lab work',
      color: 'bg-cyan-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      to: '/medicines',
      label: 'Medicines',
      icon: Pill,
      desc: 'Medicine inventory',
      color: 'bg-lime-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      to: '/invoices',
      label: 'Invoices',
      icon: CreditCard,
      desc: 'Billing & payments',
      color: 'bg-amber-500',
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'],
    },
    {
      to: '/doctors',
      label: 'Doctors',
      icon: Stethoscope,
      desc: 'Doctor profiles',
      color: 'bg-rose-500',
      roles: ['ADMIN'],
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: BarChart3,
      desc: 'Revenue & analytics',
      color: 'bg-orange-500',
      roles: ['ADMIN'],
    },
    {
      to: '/users',
      label: 'Users',
      icon: Users,
      desc: 'Manage system users',
      color: 'bg-slate-500',
      roles: ['ADMIN'],
    },
    {
      to: '/audit-logs',
      label: 'Audit Logs',
      icon: ShieldCheck,
      desc: 'System activity log',
      color: 'bg-red-500',
      roles: ['ADMIN'],
    },
  ];

  const links = quickLinks.filter((link) => link.roles.some((role) => roles.includes(role)));

  const statusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-sky-100 text-sky-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '--';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-sky-200">{greeting()},</p>
          <h1 className="mt-1 text-4xl font-bold">
            {user?.username || 'User'} 👋
          </h1>
          <p className="mt-2 text-sky-100">Welcome back to Hospital Management System</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
                    ) : (
                      s.value
                    )}
                  </p>
                  {s.sub && <p className="mt-1 text-xs text-slate-400">{s.sub}</p>}
                </div>
                <div className={"rounded-2xl bg-gradient-to-br p-3 shadow-sm " + s.gradient}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className={"absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r opacity-60 " + s.gradient} />
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Links */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Quick Access</h2>
            <span className="text-xs text-slate-400">{links.length} modules available</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm " + link.color}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{link.label}</p>
                    <p className="text-xs text-slate-400 truncate">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-500 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Appointments */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Appointments</h2>
            <Link to="/appointments" className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 mb-2" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No appointments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {appt.patientName || ('Patient #' + appt.patientId)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(appt.apptDatetime)}
                        </span>
                        <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + statusColor(appt.status)}>
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
