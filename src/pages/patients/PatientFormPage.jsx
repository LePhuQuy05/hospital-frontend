import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as patientsApi from '../../api/patientsApi';
import { useToast } from '../../components/ToastContainer';
import FormInput from '../../components/FormInput';
import LoadingState from '../../components/LoadingState';

const PatientFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'MALE',
    cccd: '',
    phone: '',
    address: '',
    bloodType: '',
    insuranceNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchPatient = async () => {
        try {
          const response = await patientsApi.getPatientById(id);
          setFormData(response.data?.data || {});
        } catch (error) {
          addToast('Failed to load patient', 'error');
          navigate('/patients');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, isEditMode, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const requiredFields = ['fullName', 'dob', 'gender', 'cccd', 'phone', 'address', 'bloodType'];
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await patientsApi.updatePatient(id, formData);
        addToast('Patient updated successfully', 'success');
      } else {
        await patientsApi.createPatient(formData);
        addToast('Patient created successfully', 'success');
      }
      navigate('/patients');
    } catch (error) {
      if (error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else {
        addToast(error.response?.data?.message || 'Failed to save patient', 'error');
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
          onClick={() => navigate('/patients')}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditMode ? 'Edit Patient' : 'Add Patient'}
          </h1>
          <p className="mt-1 text-slate-500">
            {isEditMode ? 'Update patient information' : 'Create a new patient record'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Personal Information</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
              placeholder="Nguyen Van A"
            />
            <FormInput
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              error={errors.dob}
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.gender ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <p className="text-sm text-rose-600">{errors.gender}</p>}
            </div>
            <FormInput
              label="CCCD"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              error={errors.cccd}
              required
              placeholder="012345678901"
            />
            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              placeholder="0909123456"
            />
            <FormInput
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
              placeholder="TP.HCM"
            />
            <FormInput
              label="Blood Type"
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              error={errors.bloodType}
              required
              placeholder="O+"
            />
            <FormInput
              label="Insurance Number"
              name="insuranceNumber"
              value={formData.insuranceNumber}
              onChange={handleChange}
              error={errors.insuranceNumber}
              placeholder="BH123456"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="rounded-2xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientFormPage;
