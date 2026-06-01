import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import * as auditLogsApi from '../../api/auditLogsApi';
import { useToast } from '../../components/ToastContainer';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import Modal from '../../components/Modal';
import { formatDateTime } from '../../utils/formatters';

const actionOptions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
const actionVariant = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'info',
  LOGOUT: 'info',
};

const formatDetailValue = (value) => {
  if (value == null) return '-';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

const AuditLogPage = () => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    fromDate: '',
    toDate: '',
  });
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchLogs = async (pageIndex = 0) => {
    setIsLoading(true);
    try {
      const response = await auditLogsApi.getAuditLogs({ ...filters, page: pageIndex, size: 20 });
      const pageData = response.data?.data;
      setLogs(pageData?.content || []);
      setTotalPages(pageData?.totalPages ?? 1);
      setPage(pageData?.number ?? pageIndex);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await fetchLogs(0);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    await fetchLogs(newPage);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await auditLogsApi.exportAuditLogs(filters);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit-logs-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Audit logs exported successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to export audit logs', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectLog = async (id) => {
    setSelectedLogId(id);
    setSelectedLog(null);
    setIsDetailLoading(true);
    try {
      const response = await auditLogsApi.getAuditLogById(id);
      setSelectedLog(response.data?.data || null);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to load audit log details', 'error');
      setSelectedLogId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedLogId(null);
    setSelectedLog(null);
    setIsDetailLoading(false);
  };

  const tableRows = useMemo(() => logs, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-slate-500">Review activity history and export audit records for administrators.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1.5fr_1fr] md:grid-cols-[1fr_1fr_1fr_1fr]">
        <div className="space-y-2">
          <label htmlFor="userId" className="text-sm font-medium text-slate-700">
            User ID
          </label>
          <input
            id="userId"
            name="userId"
            type="number"
            value={filters.userId}
            onChange={handleFilterChange}
            placeholder="e.g. 1"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="action" className="text-sm font-medium text-slate-700">
            Action
          </label>
          <select
            id="action"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">All actions</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="entityType" className="text-sm font-medium text-slate-700">
            Entity Type
          </label>
          <input
            id="entityType"
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
            placeholder="e.g. Patient"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fromDate" className="text-sm font-medium text-slate-700">
              From date
            </label>
            <input
              id="fromDate"
              name="fromDate"
              type="date"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="toDate" className="text-sm font-medium text-slate-700">
              To date
            </label>
            <input
              id="toDate"
              name="toDate"
              type="date"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="flex items-end justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Search className="mr-2 h-4 w-4" />
            Filter
          </button>
        </div>
      </form>

      {isLoading ? (
        <LoadingState />
      ) : tableRows.length === 0 ? (
        <EmptyState message="No audit records found. Adjust filters to search again." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Entity ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">IP Address</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {tableRows.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleSelectLog(log.id)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-slate-700">{log.id}</td>
                    <td className="px-4 py-4 text-slate-700">{log.userId ?? '-'}</td>
                    <td className="px-4 py-4">
                      <Badge variant={actionVariant[log.action] || 'default'}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{log.entityType || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{log.entityId ?? '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div>
          Page {page + 1} of {totalPages}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 0}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedLogId)}
        onClose={closeModal}
        title={`Audit Log #${selectedLogId}`}
        size="lg"
      >
        {isDetailLoading ? (
          <LoadingState />
        ) : selectedLog ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Action</p>
                <div className="mt-2">
                  <Badge variant={actionVariant[selectedLog.action] || 'default'}>{selectedLog.action}</Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Created At</p>
                <p className="mt-2 text-slate-700">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">User ID</p>
                <p className="mt-2 text-slate-700">{selectedLog.userId ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Entity</p>
                <p className="mt-2 text-slate-700">{selectedLog.entityType || '-'} #{selectedLog.entityId ?? '-'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">Old Value</p>
                <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950/5 p-4 text-sm text-slate-700">
                  {formatDetailValue(selectedLog.oldValue)}
                </pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">New Value</p>
                <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950/5 p-4 text-sm text-slate-700">
                  {formatDetailValue(selectedLog.newValue)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No audit log data available.</p>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;
