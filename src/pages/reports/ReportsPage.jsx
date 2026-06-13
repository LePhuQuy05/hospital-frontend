import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import * as reportsApi from '../../api/reportsApi';
import { useToast } from '../../components/ToastContainer';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { downloadBlob } from '../../utils/download';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/http';

const toDateInputValue = (date) => {
  const local = new Date(date);
  if (Number.isNaN(local.getTime())) return '';
  const adjusted = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
};

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const normalizeRevenue = (payload) => {
  if (payload == null) return 0;
  if (typeof payload === 'number') return payload;
  if (typeof payload === 'object') {
    return Number(payload.totalRevenue ?? payload.revenue ?? payload.amount ?? 0);
  }
  return Number(payload) || 0;
};

const normalizeBreakdown = (payload) => {
  if (!payload || typeof payload !== 'object') return [];
  return payload.dailyBreakdown || payload.dailySummary || payload.breakdown || [];
};

const ReportsPage = () => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    from: toDateInputValue(getMonthStart()),
    to: toDateInputValue(new Date()),
  });
  const [report, setReport] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [monthRevenue, setMonthRevenue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const [reportResponse, todayResponse, monthResponse] = await Promise.allSettled([
        reportsApi.getRevenueReport(filters),
        reportsApi.getTodayRevenue(),
        reportsApi.getThisMonthRevenue(),
      ]);

      if (reportResponse.status === 'fulfilled') {
        setReport(reportResponse.value.data?.data || null);
      } else {
        addToast(getErrorMessage(reportResponse.reason, 'Failed to load revenue report'), 'error');
      }

      if (todayResponse.status === 'fulfilled') {
        setTodayRevenue(todayResponse.value.data?.data ?? null);
      }

      if (monthResponse.status === 'fulfilled') {
        setMonthRevenue(monthResponse.value.data?.data ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleRefresh = async () => {
    await loadSummary();
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadSummary();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await reportsApi.exportRevenueReport(filters);
      downloadBlob(response, `revenue-report-${filters.from || 'from'}-${filters.to || 'to'}.xlsx`);
      addToast('Revenue report exported successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to export revenue report'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const dailyBreakdown = useMemo(() => normalizeBreakdown(report), [report]);
  const totalRevenue = normalizeRevenue(report?.totalRevenue ?? report);
  const totalInsurance = normalizeRevenue(report?.totalInsuranceAmount);
  const totalVisits = Number(report?.totalVisits ?? 0);
  const maxRevenue = Math.max(...dailyBreakdown.map((item) => normalizeRevenue(item.revenue)), 0);

  if (isLoading && !report) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Revenue Reports</h1>
          <p className="mt-1 text-slate-500">
            Track revenue, insurance coverage, and daily visit trends across a selected date range.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <label htmlFor="from" className="text-sm font-medium text-slate-700">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            value={filters.from}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="to" className="text-sm font-medium text-slate-700">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            value={filters.to}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Filter
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} accent="bg-sky-100 text-sky-700" />
        <StatCard label="Insurance Coverage" value={formatCurrency(totalInsurance)} accent="bg-emerald-100 text-emerald-700" />
        <StatCard label="Visits" value={totalVisits} accent="bg-amber-100 text-amber-700" />
        <StatCard
          label="Today / Month"
          value={`${formatCurrency(normalizeRevenue(todayRevenue))} / ${formatCurrency(normalizeRevenue(monthRevenue))}`}
          accent="bg-rose-100 text-rose-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daily Breakdown</h2>
              <p className="text-sm text-slate-500">
                {report?.fromDate || filters.from} - {report?.toDate || filters.to}
              </p>
            </div>
            <Badge variant="info">{dailyBreakdown.length} days</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {dailyBreakdown.length === 0 ? (
              <EmptyState message="No revenue data for the selected range." />
            ) : (
              dailyBreakdown.map((item) => {
                const revenue = normalizeRevenue(item.revenue);
                const barWidth = maxRevenue > 0 ? `${Math.max((revenue / maxRevenue) * 100, 4)}%` : '4%';
                return (
                  <div key={item.date} className="grid gap-3 md:grid-cols-[120px_1fr_120px] md:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.date}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                        style={{ width: barWidth }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(revenue)}</p>
                      <p className="text-xs text-slate-500">{item.visits ?? 0} visits</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Report Summary</h2>
            <div className="mt-4 space-y-3">
              <SummaryLine label="From date" value={report?.fromDate || filters.from || '—'} />
              <SummaryLine label="To date" value={report?.toDate || filters.to || '—'} />
              <SummaryLine label="Total revenue" value={formatCurrency(totalRevenue)} />
              <SummaryLine label="Insurance amount" value={formatCurrency(totalInsurance)} />
              <SummaryLine label="Total visits" value={totalVisits} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The chart is rendered with simple proportional bars so it remains lightweight and easy to maintain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <div className={`mt-3 inline-flex rounded-2xl px-3 py-2 text-base font-semibold ${accent}`}>{value}</div>
  </div>
);

const SummaryLine = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-900">{value}</span>
  </div>
);

export default ReportsPage;
