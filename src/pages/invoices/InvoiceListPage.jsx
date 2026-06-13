import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import * as invoicesApi from '../../api/invoicesApi';
import * as patientsApi from '../../api/patientsApi';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import SearchSelectInput from '../../components/SearchSelectInput';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const InvoiceListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Patient search (primary flow)
  const [patientId, setPatientId] = useState('');
  const [patientLabel, setPatientLabel] = useState('');

  // Direct invoice ID lookup (secondary / fallback)
  const [invoiceId, setInvoiceId] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const fetchPatientOptions = useCallback(async (keyword) => {
    try {
      const response = await patientsApi.searchPatients(keyword);
      const patients = response.data?.data || [];
      return patients.map((p) => ({
        id: p.id,
        label: p.fullName || `Patient #${p.id}`,
        sub: `ID: ${p.id}${p.phone ? ` · ${p.phone}` : ''}${p.cccd ? ` · CCCD: ${p.cccd}` : ''}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const handlePatientSelect = (id, item) => {
    setPatientId(String(id));
    setPatientLabel(item.label);
    // Navigate directly to patient invoice history
    navigate(`/patients/${id}/invoices`);
  };

  const handlePatientClear = () => {
    setPatientId('');
    setPatientLabel('');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setSearchError('');
    setInvoice(null);

    if (!invoiceId.trim()) {
      setSearchError('Please enter an invoice ID.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await invoicesApi.getInvoiceById(invoiceId.trim());
      setInvoice(response.data?.data || null);
    } catch (error) {
      setInvoice(null);
      addToast(error.response?.data?.message || 'Invoice not found', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Invoice ID', sortable: true },
    { key: 'patientName', label: 'Patient', sortable: true },
    { key: 'medicalRecordId', label: 'Medical Record', sortable: true },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (item) => formatCurrency(item.totalAmount),
    },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'paidAt',
      label: 'Paid At',
      sortable: true,
      render: (item) => formatDateTime(item.paidAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <button
          type="button"
          onClick={() => navigate(`/invoices/${item.id}`)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          View
          <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
        <p className="mt-1 text-slate-500">Search by patient name to view invoice history, or look up a specific invoice by ID.</p>
      </div>

      {/* Primary: Patient name search */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Search by Patient</h2>
        <SearchSelectInput
          placeholder="Type patient name, phone, or CCCD..."
          value={patientId}
          selectedLabel={patientLabel}
          onSelect={handlePatientSelect}
          onClear={handlePatientClear}
          fetchOptions={fetchPatientOptions}
        />
        <p className="mt-2 text-xs text-slate-500">
          Selecting a patient will open their full invoice history.
        </p>
      </div>

      {/* Secondary: Direct Invoice ID lookup */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Lookup by Invoice ID</h2>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <div className="space-y-2">
            <input
              id="invoiceId"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID"
              className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                searchError ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
            {searchError && <p className="text-sm text-rose-600">{searchError}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : invoice ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Invoice #{invoice.id}</h2>
                <p className="mt-1 text-sm text-slate-500">Patient: {invoice.patientName || '—'}</p>
              </div>
              {invoice.patientId && (
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${invoice.patientId}/invoices`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  View patient history
                </button>
              )}
            </div>
          </div>
          <DataTable columns={columns} data={[invoice]} emptyText="No invoice found." />
        </div>
      ) : (
        <EmptyState message="Search by patient name or invoice ID above." />
      )}
    </div>
  );
};

export default InvoiceListPage;
