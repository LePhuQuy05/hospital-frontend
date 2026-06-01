import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import * as invoicesApi from '../../api/invoicesApi';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PatientInvoicesPage = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await invoicesApi.getInvoicesByPatientId(patientId);
        setInvoices(response.data?.data || []);
      } catch (error) {
        addToast(error.response?.data?.message || 'Failed to load invoices', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, [patientId, addToast]);

  const columns = [
    { key: 'id', label: 'Invoice ID', sortable: true },
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Invoices</h1>
          <p className="mt-1 text-slate-500">Invoice history for patient ID {patientId}.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to invoices
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : invoices.length === 0 ? (
        <EmptyState message="No invoices found for this patient." />
      ) : (
        <DataTable columns={columns} data={invoices} loading={isLoading} emptyText="No invoices found." />
      )}
    </div>
  );
};

export default PatientInvoicesPage;
