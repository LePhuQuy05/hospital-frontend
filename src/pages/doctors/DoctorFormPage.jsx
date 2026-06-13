import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as doctorsApi from '../../api/doctorsApi';
import * as departmentsApi from '../../api/departmentsApi';
import { useToast } from '../../components/ToastContainer';
import FormInput from '../../components/FormInput';
import LoadingState from '../../components/LoadingState';
import { getErrorMessage, getFieldErrors } from '../../utils/http';

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  licenseNumber: '',
  hireDate: '',
  departmentId: '',
};

const omitEmptyValues = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const DoctorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        id: department.id,
        label: department.deptName || department.name || `Department #${department.id}`,
      })),
    [departments]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [doctorResult, departmentResult] = await Promise.allSettled([
          isEditMode ? doctorsApi.getDoctorById(id) : Promise.resolve(null),
          departmentsApi.getDepartments(),
        ]);

        if (departmentResult.status === 'fulfilled') {
          setDepartments(departmentResult.value.data?.data || []);
        }

        if (doctorResult.status === 'fulfilled' && doctorResult.value) {
          const doctor = doctorResult.value.data?.data || {};
          setFormData({
            fullName: doctor.fullName || '',
            phone: doctor.phone || '',
            email: doctor.email || '',
            licenseNumber: doctor.licenseNumber || '',
            hireDate: doctor.hireDate ? String(doctor.hireDate).slice(0, 10) : '',
            departmentId: doctor.departmentId ? String(doctor.departmentId) : String(doctor.department?.id || ''),
          });
        } else if (doctorResult.status === 'rejected' && isEditMode) {
          addToast(getErrorMessage(doctorResult.reason, 'Failed to load doctor'), 'error');
          navigate('/doctors');
        }
      } catch (error) {
        addToast(getErrorMessage(error, 'Failed to load doctor form'), 'error');
        navigate('/doctors');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [addToast, id, isEditMode, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const validationErrors = {};
    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Full name is required.';
    }
    if (!formData.departmentId) {
      validationErrors.departmentId = 'Department is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = omitEmptyValues({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        hireDate: formData.hireDate,
        departmentId: Number(formData.departmentId),
      });

      if (isEditMode) {
        await doctorsApi.updateDoctor(id, payload);
        addToast('Doctor updated successfully', 'success');
      } else {
        await doctorsApi.createDoctor(payload);
        addToast('Doctor created successfully', 'success');
      }

      navigate('/doctors');
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        addToast(getErrorMessage(error, 'Failed to save doctor'), 'error');
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
          onClick={() => navigate('/doctors')}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isEditMode ? 'Edit Doctor' : 'Add Doctor'}</h1>
          <p className="mt-1 text-slate-500">
            {isEditMode ? 'Update doctor profile and department assignment' : 'Create a new doctor profile'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Doctor Information</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
              placeholder="Dr. Nguyen Van A"
            />
            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="0909123456"
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="doctor@example.com"
            />
            <FormInput
              label="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              error={errors.licenseNumber}
              placeholder="MED12345"
            />
            <FormInput
              label="Hire Date"
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleChange}
              error={errors.hireDate}
            />
            <div className="space-y-2">
              <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.departmentId ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <option value="">Select department</option>
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.label}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-sm text-rose-600">{errors.departmentId}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
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

export default DoctorFormPage;
