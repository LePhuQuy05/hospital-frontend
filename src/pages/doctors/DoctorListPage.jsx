import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import * as doctorsApi from '../../api/doctorsApi';
import * as departmentsApi from '../../api/departmentsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/http';

const DoctorListPage = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { addToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = roles.includes('ADMIN');

  const departmentMap = useMemo(
    () =>
      Object.fromEntries(
        departments.map((department) => [
          String(department.id),
          department.deptName || department.name || `Department #${department.id}`,
        ])
      ),
    [departments]
  );

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const [doctorResult, departmentResult] = await Promise.allSettled([
        doctorsApi.getDoctors(),
        departmentsApi.getDepartments(),
      ]);

      if (doctorResult.status === 'fulfilled') {
        setDoctors(doctorResult.value.data?.data || []);
      } else {
        addToast(getErrorMessage(doctorResult.reason, 'Failed to load doctors'), 'error');
      }

      if (departmentResult.status === 'fulfilled') {
        setDepartments(departmentResult.value.data?.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDoctors = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const resolvedDepartmentId = String(doctor.departmentId || doctor.department?.id || '');
      const resolvedDepartmentName =
        doctor.departmentName ||
        doctor.department?.deptName ||
        departmentMap[resolvedDepartmentId] ||
        '';
      const matchesKeyword =
        !keyword ||
        [doctor.fullName, doctor.phone, doctor.email, doctor.licenseNumber, resolvedDepartmentName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesDepartment = !departmentFilter || resolvedDepartmentId === departmentFilter;

      return matchesKeyword && matchesDepartment;
    });
  }, [departmentFilter, departmentMap, doctors, searchKeyword]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await doctorsApi.deleteDoctor(deleteTarget);
      addToast('Doctor deleted successfully', 'success');
      setDeleteTarget(null);
      await loadDoctors();
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to delete doctor'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'licenseNumber', label: 'License No.', sortable: true },
    {
      key: 'hireDate',
      label: 'Hire Date',
      sortable: true,
      render: (item) => formatDate(item.hireDate) || '—',
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (item) => {
        const resolvedDepartmentId = String(item.departmentId || item.department?.id || '');
        return (
          item.departmentName ||
          item.department?.deptName ||
          departmentMap[resolvedDepartmentId] ||
          `#${resolvedDepartmentId || '—'}`
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/doctors/${item.id}/edit`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && doctors.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Management</h1>
          <p className="mt-1 text-slate-500">Manage doctors and department assignments.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => navigate('/doctors/new')}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add Doctor
          </button>
        )}
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_260px]">
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Search by name, phone, email, or license number..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.deptName || department.name || `Department #${department.id}`}
            </option>
          ))}
        </select>
      </div>

      {filteredDoctors.length === 0 ? (
        <EmptyState message="No doctors found. Try adjusting your filters or add a new doctor." />
      ) : (
        <DataTable columns={columns} data={filteredDoctors} loading={isLoading} emptyText="No doctors available." />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
      />
    </div>
  );
};

export default DoctorListPage;
