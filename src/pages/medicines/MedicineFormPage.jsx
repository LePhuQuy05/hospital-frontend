import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as medicinesApi from '../../api/medicinesApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import FormInput from '../../components/FormInput';
import LoadingState from '../../components/LoadingState';

const MedicineFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { roles } = useAuth();
  const { addToast } = useToast();
  const isEditMode = Boolean(id);
  const canEdit = roles.some((role) => role === 'ADMIN');

  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: '',
    unit: '',
    unitPrice: '',
    insuranceCovered: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchMedicine = async () => {
        try {
          const response = await medicinesApi.getMedicineById(id);
          const data = response.data?.data || {};
          setFormData({
            medicineName: data.medicineName || '',
            genericName: data.genericName || '',
            category: data.category || '',
            unit: data.unit || '',
            unitPrice: data.unitPrice ?? '',
            insuranceCovered: Boolean(data.insuranceCovered),
          });
        } catch (error) {
          addToast('Failed to load medicine', 'error');
          navigate('/medicines');
        } finally {
          setIsLoading(false);
        }
      };
      fetchMedicine();
    }
  }, [id, isEditMode, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    const requiredFields = ['medicineName', 'genericName', 'category', 'unit', 'unitPrice'];
    const validationErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        validationErrors[field] = 'This field is required';
      }
    });

    if (formData.unitPrice && Number(formData.unitPrice) <= 0) {
      validationErrors.unitPrice = 'Price must be greater than 0';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        medicineName: formData.medicineName,
        genericName: formData.genericName,
        category: formData.category,
        unit: formData.unit,
        unitPrice: Number(formData.unitPrice),
        insuranceCovered: formData.insuranceCovered,
      };

      if (isEditMode) {
        await medicinesApi.updateMedicine(id, payload);
        addToast('Medicine updated successfully', 'success');
      } else {
        await medicinesApi.createMedicine(payload);
        addToast('Medicine created successfully', 'success');
      }
      navigate('/medicines');
    } catch (error) {
      if (error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else {
        addToast(error.response?.data?.message || 'Failed to save medicine', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/medicines')}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditMode ? (canEdit ? 'Edit Medicine' : 'View Medicine') : 'Add Medicine'}
          </h1>
          <p className="mt-1 text-slate-500">
            {isEditMode
              ? canEdit
                ? 'Update medicine information'
                : 'Review medicine details'
              : 'Create a new medicine record'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Medicine Information</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormInput
              label="Medicine Name"
              name="medicineName"
              value={formData.medicineName}
              onChange={handleChange}
              error={errors.medicineName}
              required
              placeholder="Paracetamol"
            />
            <FormInput
              label="Generic Name"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
              error={errors.genericName}
              required
              placeholder="Acetaminophen"
            />
            <FormInput
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              required
              placeholder="Painkiller"
            />
            <FormInput
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={errors.unit}
              required
              placeholder="tablet"
            />
            <FormInput
              label="Unit Price"
              name="unitPrice"
              type="number"
              value={formData.unitPrice}
              onChange={handleChange}
              error={errors.unitPrice}
              required
              placeholder="5000"
            />
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="insuranceCovered"
                  checked={formData.insuranceCovered}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Covered by insurance (BHYT)
              </label>
              {errors.insuranceCovered && <p className="text-sm text-rose-600">{errors.insuranceCovered}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="rounded-2xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
          {canEdit && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MedicineFormPage;
