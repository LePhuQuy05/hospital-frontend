import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as usersApi from '../../api/usersApi';
import { useToast } from '../../components/ToastContainer';
import FormInput from '../../components/FormInput';
import LoadingState from '../../components/LoadingState';

const roleOptions = ['ADMIN', 'DOCTOR', 'NURSE', 'CASHIER'];

const UserFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    roleNames: [],
    doctorId: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const loadUser = async () => {
      setIsLoading(true);
      try {
        const response = await usersApi.getUserById(id);
        const user = response.data?.data || {};
        setFormData({
          username: user.username || '',
          password: '',
          email: user.email || '',
          fullName: user.fullName || '',
          roleNames: user.roles || [],
          doctorId: user.doctorId ?? '',
        });
      } catch (error) {
        addToast(error.response?.data?.message || 'Failed to load user', 'error');
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id, isEditMode, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'roleNames') {
      setFormData((prev) => {
        const next = prev.roleNames.includes(value)
          ? prev.roleNames.filter((role) => role !== value)
          : [...prev.roleNames, value];
        return { ...prev, roleNames: next };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? value : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = {};
    if (!formData.username.trim()) validationErrors.username = 'Username is required.';
    if (!isEditMode && !formData.password.trim()) validationErrors.password = 'Password is required.';
    if (!formData.email.trim()) validationErrors.email = 'Email is required.';
    if (!formData.fullName.trim()) validationErrors.fullName = 'Full name is required.';
    if (!formData.roleNames.length) validationErrors.roleNames = 'At least one role is required.';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        roleNames: formData.roleNames,
        doctorId: formData.doctorId ? Number(formData.doctorId) : null,
      };

      if (!isEditMode) {
        payload.password = formData.password;
        await usersApi.createUser(payload);
        addToast('User created successfully', 'success');
      } else {
        await usersApi.updateUser(id, payload);
        addToast('User updated successfully', 'success');
      }
      navigate('/users');
    } catch (error) {
      if (error.response?.data?.data) {
        setErrors(error.response.data.data);
      } else {
        addToast(error.response?.data?.message || 'Failed to save user', 'error');
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
          onClick={() => navigate('/users')}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isEditMode ? 'Edit User' : 'Create User'}</h1>
          <p className="mt-1 text-slate-500">
            {isEditMode ? 'Update user account information' : 'Create a new user account'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormInput
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              required
              placeholder="doctor01"
            />
            {!isEditMode && (
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                placeholder="123456"
              />
            )}
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="doctor01@example.com"
            />
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
              placeholder="Doctor One"
            />
            <div className="sm:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Roles</label>
                {errors.roleNames && <span className="text-sm text-rose-600">{errors.roleNames}</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {roleOptions.map((role) => (
                  <label key={role} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      name="roleNames"
                      value={role}
                      checked={formData.roleNames.includes(role)}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    />
                    <span className="text-sm font-medium text-slate-900">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            <FormInput
              label="Doctor ID"
              name="doctorId"
              type="number"
              value={formData.doctorId}
              onChange={handleChange}
              error={errors.doctorId}
              placeholder="1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/users')}
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

export default UserFormPage;
