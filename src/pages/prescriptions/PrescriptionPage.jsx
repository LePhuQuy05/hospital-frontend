import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Printer, Trash2 } from 'lucide-react';
import * as medicinesApi from '../../api/medicinesApi';
import * as prescriptionsApi from '../../api/prescriptionsApi';
import * as patientsApi from '../../api/patientsApi';
import * as medicalRecordsApi from '../../api/medicalRecordsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import SearchSelectInput from '../../components/SearchSelectInput';
import { downloadBlob } from '../../utils/download';
import { formatDateTime } from '../../utils/formatters';
import { getErrorMessage, getFieldErrors } from '../../utils/http';

const emptyItem = () => ({
  medicationId: '',
  quantity: 1,
  dosage: '',
});

const PrescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const { roles } = useAuth();
  const { addToast } = useToast();

  const canCreate = roles.some((role) => ['ADMIN', 'DOCTOR'].includes(role));

  const [medicines, setMedicines] = useState([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [isMedicinesLoading, setIsMedicinesLoading] = useState(true);

  // Medical Record ID selection
  const [medicalRecordId, setMedicalRecordId] = useState(searchParams.get('medicalRecordId') || '');
  const [medicalRecordLabel, setMedicalRecordLabel] = useState(
    searchParams.get('medicalRecordId') ? `Medical Record #${searchParams.get('medicalRecordId')}` : ''
  );

  const [formData, setFormData] = useState({
    doctorNotes: '',
    items: [emptyItem()],
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prescription lookup selection
  const [prescriptionLookupId, setPrescriptionLookupId] = useState('');
  const [prescriptionLookupLabel, setPrescriptionLookupLabel] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  useEffect(() => {
    const loadMedicines = async () => {
      setIsMedicinesLoading(true);
      try {
        const response = await medicinesApi.getMedicines();
        setMedicines(response.data?.data || []);
      } catch (error) {
        addToast(getErrorMessage(error, 'Failed to load medicines'), 'error');
      } finally {
        setIsMedicinesLoading(false);
      }
    };
    loadMedicines();
  }, [addToast]);

  const filteredMedicines = useMemo(() => {
    const keyword = medicineSearch.trim().toLowerCase();
    return medicines.filter((medicine) => {
      if (!keyword) return true;
      return [medicine.medicineName, medicine.genericName, medicine.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [medicineSearch, medicines]);

  // Fetch medical records by searching patients first
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
            // skip patient with no records
          }
        })
      );
      return results;
    } catch {
      return [];
    }
  }, []);

  // Fetch prescriptions by searching patients first
  const fetchPrescriptionOptions = useCallback(async (keyword) => {
    try {
      const patientRes = await patientsApi.searchPatients(keyword);
      const patients = patientRes.data?.data || [];
      const results = [];
      await Promise.all(
        patients.slice(0, 5).map(async (patient) => {
          try {
            const presRes = await prescriptionsApi.getPrescriptionsByPatientId(patient.id);
            const prescriptions = presRes.data?.data || [];
            prescriptions.forEach((pres) => {
              results.push({
                id: pres.id,
                label: pres.patientName || patient.fullName,
                sub: `Prescription #${pres.id} · ${formatDateTime(pres.createdAt)} · Dr. ${pres.doctorName || '—'}`,
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
    setFormErrors((current) => { const next = { ...current }; delete next.medicalRecordId; return next; });
  };

  const handleMedicalRecordClear = () => {
    setMedicalRecordId('');
    setMedicalRecordLabel('');
  };

  const handlePrescriptionSelect = async (id, item) => {
    setPrescriptionLookupId(String(id));
    setPrescriptionLookupLabel(item.label);
    setIsLoadingPrescription(true);
    try {
      const response = await prescriptionsApi.getPrescriptionById(id);
      setSelectedPrescription(response.data?.data || null);
    } catch (error) {
      setSelectedPrescription(null);
      addToast(getErrorMessage(error, 'Failed to load prescription'), 'error');
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  const handlePrescriptionClear = () => {
    setPrescriptionLookupId('');
    setPrescriptionLookupLabel('');
    setSelectedPrescription(null);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((current) => { const next = { ...current }; delete next[name]; return next; });
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData((current) => {
      const nextItems = [...current.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...current, items: nextItems };
    });
    const errorKey = `items.${index}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((current) => { const next = { ...current }; delete next[errorKey]; return next; });
    }
  };

  const addItem = () => {
    setFormData((current) => ({ ...current, items: [...current.items, emptyItem()] }));
  };

  const removeItem = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const submitPrescription = async (event) => {
    event.preventDefault();
    setFormErrors({});

    const validationErrors = {};
    if (!medicalRecordId.trim()) validationErrors.medicalRecordId = 'Medical record is required.';
    if (!formData.items.length) validationErrors.items = 'At least one medicine is required.';

    formData.items.forEach((item, index) => {
      if (!item.medicationId) validationErrors[`items.${index}.medicationId`] = 'Select a medicine.';
      if (!item.quantity || Number(item.quantity) <= 0) validationErrors[`items.${index}.quantity`] = 'Quantity must be greater than zero.';
      if (!item.dosage.trim()) validationErrors[`items.${index}.dosage`] = 'Dosage is required.';
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        medicalRecordId: Number(medicalRecordId),
        doctorNotes: formData.doctorNotes.trim() || undefined,
        items: formData.items.map((item) => ({
          medicationId: Number(item.medicationId),
          quantity: Number(item.quantity),
          dosage: item.dosage.trim(),
        })),
      };

      const response = await prescriptionsApi.createPrescription(payload);
      const createdPrescription = response.data?.data || null;
      addToast('Prescription created successfully', 'success');
      if (createdPrescription?.id) {
        setPrescriptionLookupId(String(createdPrescription.id));
        setPrescriptionLookupLabel(createdPrescription.patientName || '');
        setSelectedPrescription(createdPrescription);
      } else {
        setSelectedPrescription(createdPrescription);
      }
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors);
      } else {
        addToast(getErrorMessage(error, 'Failed to save prescription'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportPrescriptionPdf = async () => {
    if (!selectedPrescription?.id) {
      addToast('Load a prescription first.', 'warning');
      return;
    }
    try {
      const response = await prescriptionsApi.exportPrescriptionPdf(selectedPrescription.id);
      downloadBlob(response, `prescription-${selectedPrescription.id}.pdf`);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to export prescription PDF'), 'error');
    }
  };

  if (isMedicinesLoading && !medicines.length) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Prescriptions</h1>
          <p className="mt-1 text-slate-500">
            Create a prescription from a medical record, then look it up and export a PDF.
          </p>
        </div>
        {!canCreate && (
          <Badge variant="info">View only for your role</Badge>
        )}
      </div>

      {canCreate ? (
        <form onSubmit={submitPrescription} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Prescription Form</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <SearchSelectInput
                label="Medical Record"
                placeholder="Search patient name to find records..."
                value={medicalRecordId}
                selectedLabel={medicalRecordLabel}
                onSelect={handleMedicalRecordSelect}
                onClear={handleMedicalRecordClear}
                fetchOptions={fetchMedicalRecordOptions}
                error={formErrors.medicalRecordId}
                required
              />
              <div className="space-y-2">
                <label htmlFor="doctorNotes" className="block text-sm font-medium text-slate-700">
                  Doctor Notes
                </label>
                <input
                  id="doctorNotes"
                  name="doctorNotes"
                  value={formData.doctorNotes}
                  onChange={handleFieldChange}
                  placeholder="Optional notes"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Medicine Items</h2>
                <p className="text-sm text-slate-500">Add one or more medicines to the prescription.</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <input
                type="text"
                value={medicineSearch}
                onChange={(event) => setMedicineSearch(event.target.value)}
                placeholder="Filter medicines by name, generic name, or category..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              {formData.items.map((item, index) => (
                <div key={index} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.5fr_0.5fr_1fr_auto]">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Medicine</label>
                    <select
                      value={item.medicationId}
                      onChange={(event) => handleItemChange(index, 'medicationId', event.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                        formErrors[`items.${index}.medicationId`] ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <option value="">Select medicine</option>
                      {filteredMedicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.medicineName} {medicine.genericName ? `(${medicine.genericName})` : ''}
                        </option>
                      ))}
                    </select>
                    {formErrors[`items.${index}.medicationId`] && (
                      <p className="text-sm text-rose-600">{formErrors[`items.${index}.medicationId`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                        formErrors[`items.${index}.quantity`] ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
                      }`}
                    />
                    {formErrors[`items.${index}.quantity`] && (
                      <p className="text-sm text-rose-600">{formErrors[`items.${index}.quantity`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(event) => handleItemChange(index, 'dosage', event.target.value)}
                      placeholder="1 tablet x 2/day"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                        formErrors[`items.${index}.dosage`] ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
                      }`}
                    />
                    {formErrors[`items.${index}.dosage`] && (
                      <p className="text-sm text-rose-600">{formErrors[`items.${index}.dosage`]}</p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {formErrors.items && <p className="text-sm text-rose-600">{formErrors.items}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setMedicalRecordId(searchParams.get('medicalRecordId') || '');
                setMedicalRecordLabel(searchParams.get('medicalRecordId') ? `Medical Record #${searchParams.get('medicalRecordId')}` : '');
                setFormData({ doctorNotes: '', items: [emptyItem()] });
              }}
              className="rounded-2xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      ) : (
        <EmptyState message="Your role can view and export prescriptions but cannot create new ones." />
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Lookup Prescription</h2>
          <p className="mt-1 text-sm text-slate-500">Search by patient name to find and export prescriptions.</p>
          <div className="mt-4">
            <SearchSelectInput
              placeholder="Type patient name..."
              value={prescriptionLookupId}
              selectedLabel={prescriptionLookupLabel}
              onSelect={handlePrescriptionSelect}
              onClear={handlePrescriptionClear}
              fetchOptions={fetchPrescriptionOptions}
            />
            {isLoadingPrescription && (
              <p className="mt-2 text-sm text-slate-500">Loading prescription...</p>
            )}
          </div>
          {selectedPrescription?.id && (
            <button
              type="button"
              onClick={exportPrescriptionPdf}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Printer className="h-4 w-4" />
              Export PDF
            </button>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Prescription Detail</h2>
              <p className="text-sm text-slate-500">View the prescription and its medicine items.</p>
            </div>
            {selectedPrescription?.id && <Badge variant="info">#{selectedPrescription.id}</Badge>}
          </div>

          {!selectedPrescription ? (
            <EmptyState message="Search a patient name to find and view a prescription." />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label="Medical Record ID" value={selectedPrescription.medicalRecordId} />
                <InfoCard label="Doctor" value={selectedPrescription.doctorName || `Doctor #${selectedPrescription.doctorId || '—'}`} />
                <InfoCard label="Patient" value={selectedPrescription.patientName || `Patient #${selectedPrescription.patientId || '—'}`} />
                <InfoCard label="Created At" value={formatDateTime(selectedPrescription.createdAt)} />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Doctor Notes</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedPrescription.doctorNotes || '—'}</p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Medicine</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Quantity</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Dosage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(selectedPrescription.items || []).map((item) => (
                        <tr key={item.id || `${item.medicationId}-${item.dosage}`}>
                          <td className="px-4 py-4 text-slate-700">
                            {item.medicationName || `Medicine #${item.medicationId || '—'}`}
                          </td>
                          <td className="px-4 py-4 text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-4 text-slate-700">{item.dosage || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value || '—'}</p>
  </div>
);

export default PrescriptionPage;
