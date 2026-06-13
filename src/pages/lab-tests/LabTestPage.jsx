import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Upload, FileText, ExternalLink } from 'lucide-react';
import * as labTestsApi from '../../api/labTestsApi';
import * as patientsApi from '../../api/patientsApi';
import * as medicalRecordsApi from '../../api/medicalRecordsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import DataTable from '../../components/DataTable';
import SearchSelectInput from '../../components/SearchSelectInput';
import { formatDateTime } from '../../utils/formatters';
import { getErrorMessage, getFieldErrors } from '../../utils/http';

const statusVariant = {
  ORDERED: 'warning',
  SAMPLE_COLLECTED: 'info',
  COMPLETED: 'success',
};

const LabTestPage = () => {
  const { roles } = useAuth();
  const { addToast } = useToast();
  const canCreate = roles.some((role) => ['ADMIN', 'DOCTOR'].includes(role));
  const canUpdateResult = roles.some((role) => ['ADMIN', 'NURSE'].includes(role));

  const [pendingTests, setPendingTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Medical Record selection
  const [medicalRecordId, setMedicalRecordId] = useState('');
  const [medicalRecordLabel, setMedicalRecordLabel] = useState('');
  const [createErrors, setCreateErrors] = useState({});

  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultText, setResultText] = useState('');
  const [resultFile, setResultFile] = useState(null);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [lastCompletedTest, setLastCompletedTest] = useState(null);

  const loadPendingTests = async () => {
    setIsLoading(true);
    try {
      const response = await labTestsApi.getPendingLabTests();
      setPendingTests(response.data?.data || []);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to load lab tests'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch medical records by searching patients
  const fetchMedicalRecordOptions = useCallback(async (keyword) => {
    try {
      const patientRes = await patientsApi.searchPatients(keyword);
      const patients = patientRes.data?.data || [];
      const results = [];
      await Promise.all(
        patients.slice(0, 5).map(async (patient) => {
          try {
            const recRes = await medicalRecordsApi.getMedicalRecordsByPatientId(patient.id);
            const records = recRes.data?.data || [];
            records.forEach((rec) => {
              results.push({
                id: rec.id,
                label: rec.patientName || patient.fullName,
                sub: `Record #${rec.id} · Visit: ${rec.visitDate || '—'} · ${rec.doctorName || ''}`,
              });
            });
          } catch {
            // skip
          }
        })
      );
      return results;
    } catch {
      return [];
    }
  }, []);

  const handleMedicalRecordSelect = (id, item) => {
    setMedicalRecordId(String(id));
    setMedicalRecordLabel(item.label);
    setCreateErrors((current) => { const next = { ...current }; delete next.medicalRecordId; return next; });
  };

  const handleMedicalRecordClear = () => {
    setMedicalRecordId('');
    setMedicalRecordLabel('');
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateErrors({});

    const validationErrors = {};
    if (!medicalRecordId.trim()) validationErrors.medicalRecordId = 'Medical record is required.';
    if (!testName.trim()) validationErrors.testName = 'Test name is required.';

    if (Object.keys(validationErrors).length > 0) {
      setCreateErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await labTestsApi.createLabTest({
        medicalRecordId: Number(medicalRecordId),
        testName: testName.trim(),
        description: description.trim() || undefined,
      });
      addToast('Lab test created successfully', 'success');
      setMedicalRecordId('');
      setMedicalRecordLabel('');
      setTestName('');
      setDescription('');
      await loadPendingTests();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setCreateErrors(fieldErrors);
      } else {
        addToast(getErrorMessage(error, 'Failed to create lab test'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResultModal = (test) => {
    setSelectedTest(test);
    setResultText('');
    setResultFile(null);
    setIsResultModalOpen(true);
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setSelectedTest(null);
    setResultText('');
    setResultFile(null);
  };

  const handleSaveResult = async () => {
    if (!selectedTest) return;
    if (!resultText.trim()) {
      addToast('Result text is required.', 'warning');
      return;
    }
    setIsSavingResult(true);
    try {
      const response = await labTestsApi.updateLabTestResult(
        selectedTest.id,
        { result: resultText.trim() },
        resultFile
      );
      const completedTest = response.data?.data || null;
      setLastCompletedTest(completedTest);
      addToast('Lab result saved successfully', 'success');
      closeResultModal();
      await loadPendingTests();
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to save lab result'), 'error');
    } finally {
      setIsSavingResult(false);
    }
  };

  const pendingColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      {
        key: 'patientName',
        label: 'Patient',
        sortable: true,
        render: (item) => item.patientName || `Patient #${item.patientId || '—'}`,
      },
      {
        key: 'doctorName',
        label: 'Doctor',
        sortable: true,
        render: (item) => item.doctorName || `Doctor #${item.doctorId || '—'}`,
      },
      { key: 'testName', label: 'Test Name', sortable: true },
      { key: 'description', label: 'Description', sortable: false },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (item) => <Badge variant={statusVariant[item.status] || 'default'}>{item.status}</Badge>,
      },
      {
        key: 'createdAt',
        label: 'Created At',
        sortable: true,
        render: (item) => formatDateTime(item.createdAt),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        render: (item) => (
          <button
            type="button"
            onClick={() => openResultModal(item)}
            disabled={!canUpdateResult}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            Update Result
          </button>
        ),
      },
    ],
    [canUpdateResult]
  );

  if (isLoading && pendingTests.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lab Tests</h1>
          <p className="mt-1 text-slate-500">
            Create lab test orders, review pending tests, and upload result files.
          </p>
        </div>
        {!canCreate && <Badge variant="info">View / update result only</Badge>}
      </div>

      {canCreate ? (
        <form onSubmit={handleCreateSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Lab Test</h2>
              <p className="text-sm text-slate-500">Create a new lab test order for a medical record.</p>
            </div>
            <Badge variant="info">Order</Badge>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SearchSelectInput
              label="Medical Record"
              placeholder="Search patient name to find records..."
              value={medicalRecordId}
              selectedLabel={medicalRecordLabel}
              onSelect={handleMedicalRecordSelect}
              onClear={handleMedicalRecordClear}
              fetchOptions={fetchMedicalRecordOptions}
              error={createErrors.medicalRecordId}
              required
            />
            <div className="space-y-2">
              <label htmlFor="testName" className="block text-sm font-medium text-slate-700">
                Test Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="testName"
                value={testName}
                onChange={(e) => {
                  setTestName(e.target.value);
                  if (createErrors.testName) setCreateErrors((c) => { const n = { ...c }; delete n.testName; return n; });
                }}
                placeholder="Blood test, X-ray, ..."
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  createErrors.testName ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {createErrors.testName && <p className="text-sm text-rose-600">{createErrors.testName}</p>}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Optional description"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Create Lab Test'}
            </button>
          </div>
        </form>
      ) : (
        <EmptyState message="Your role can review pending tests and update results, but cannot create new test orders." />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Lab Tests</h2>
            <p className="text-sm text-slate-500">Load pending tests and update results when ready.</p>
          </div>
          <button
            type="button"
            onClick={loadPendingTests}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {pendingTests.length === 0 ? (
          <EmptyState message="No pending lab tests found." />
        ) : (
          <DataTable columns={pendingColumns} data={pendingTests} loading={isLoading} emptyText="No pending lab tests." />
        )}
      </div>

      {lastCompletedTest && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">Latest completed result</h2>
              <p className="text-sm text-emerald-800">The most recently updated test result is shown below.</p>
            </div>
            {lastCompletedTest.resultFileUrl && (
              <button
                type="button"
                onClick={() => window.open(lastCompletedTest.resultFileUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <ExternalLink className="h-4 w-4" />
                Open File
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniInfo label="Lab Test ID" value={lastCompletedTest.id} />
            <MiniInfo label="Patient" value={lastCompletedTest.patientName || '—'} />
            <MiniInfo label="Doctor" value={lastCompletedTest.doctorName || '—'} />
            <MiniInfo label="Status" value={lastCompletedTest.status || '—'} />
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Result</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{lastCompletedTest.result || '—'}</p>
          </div>
        </div>
      )}

      <Modal isOpen={isResultModalOpen} onClose={closeResultModal} title="Update Lab Result" size="md">
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Selected Test</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {selectedTest?.testName || '—'} {selectedTest?.id ? `(#${selectedTest.id})` : ''}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="resultText" className="block text-sm font-medium text-slate-700">
              Result Text
            </label>
            <textarea
              id="resultText"
              value={resultText}
              onChange={(event) => setResultText(event.target.value)}
              rows={5}
              placeholder="Enter the result summary..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="resultFile" className="block text-sm font-medium text-slate-700">
              Optional result file
            </label>
            <input
              id="resultFile"
              type="file"
              onChange={(event) => setResultFile(event.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeResultModal}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveResult}
              disabled={isSavingResult || !canUpdateResult}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {isSavingResult ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const MiniInfo = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value || '—'}</p>
  </div>
);

export default LabTestPage;
