import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import LoadingState from '../../components/LoadingState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import * as invoicesApi from '../../api/invoicesApi';

const statusVariant = {
  PENDING: 'warning',
  PAID: 'success',
  CANCELLED: 'danger',
};

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canPay = invoice?.status === 'PENDING' && roles.some((role) => ['ADMIN', 'NURSE'].includes(role));

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        const response = await invoicesApi.getInvoiceById(id);
        setInvoice(response.data?.data || null);
      } catch (error) {
        addToast(error.response?.data?.message || 'Failed to load invoice', 'error');
        navigate('/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate, addToast]);

  const handlePay = async () => {
    setIsPaying(true);
    try {
      await invoicesApi.payInvoice({ invoiceId: Number(id), paymentMethod });
      addToast('Invoice paid successfully', 'success');
      setIsModalOpen(false);
      const response = await invoicesApi.getInvoiceById(id);
      setInvoice(response.data?.data || null);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  const summaryRows = useMemo(() => {
    if (!invoice) return [];
    return [
      { label: 'Patient', value: invoice.patientName || '—' },
      { label: 'Medical Record', value: invoice.medicalRecordId || '—' },
      { label: 'Status', value: <Badge variant={statusVariant[invoice.status] || 'default'}>{invoice.status || 'Unknown'}</Badge> },
      { label: 'Payment Method', value: invoice.paymentMethod || '—' },
      { label: 'Paid At', value: invoice.paidAt ? formatDateTime(invoice.paidAt) : '—' },
      { label: 'Created At', value: formatDateTime(invoice.createdAt) },
      { label: 'Updated At', value: formatDateTime(invoice.updatedAt) },
    ];
  }, [invoice]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice Details</h1>
          <p className="mt-1 text-slate-500">Review the invoice breakdown and payment information.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to invoices
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Invoice #{invoice.id}</h2>
              <p className="mt-1 text-sm text-slate-500">Patient ID: {invoice.patientId || '—'}</p>
            </div>
            <Badge variant={statusVariant[invoice.status] || 'default'}>{invoice.status}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Examination Fee</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.examinationFee)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Medicine Fee</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.medicineFee)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Lab Fee</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.labFee)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Insurance Amount</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.insuranceAmount)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-3xl bg-white px-4 py-4 shadow-sm">
              <span className="text-sm text-slate-500">Amount Paid</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.paidAmount)}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Details</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {summaryRows.map((row) => (
                <div key={row.label} className="space-y-1 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{row.label}</p>
                  <div className="text-sm font-semibold text-slate-900">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Billing Breakdown</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Examination</span>
                <span>{formatCurrency(invoice.examinationFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Medicine</span>
                <span>{formatCurrency(invoice.medicineFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Lab</span>
                <span>{formatCurrency(invoice.labFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
                <div className="flex items-center justify-between">
                  <span>Insurance Discount</span>
                  <span>-{formatCurrency(invoice.insuranceAmount)}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900">
                <div className="flex items-center justify-between">
                  <span>Amount Due</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {canPay && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Pay Invoice
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Payment" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Choose a payment method for this invoice.</p>
          <div className="space-y-3">
            {['CASH', 'TRANSFER', 'INSURANCE'].map((method) => (
              <label key={method} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-sky-600"
                />
                <span className="text-sm font-medium text-slate-900">{method}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={isPaying}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPaying ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceDetailPage;
