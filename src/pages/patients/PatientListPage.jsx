import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import * as patientsApi from '../../api/patientsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';

const PatientListPage = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = roles.some((role) => ['ADMIN', 'NURSE'].includes(role));

  const fetchPatients = async (keyword = '') => {
    setIsLoading(true);
    try {
      let response;
      if (keyword.trim()) {
        response = await patientsApi.searchPatients(keyword);
      } else {
        response = await patientsApi.getPatients();
      }
      setPatients(response.data?.data || []);
    } catch (error) {
      addToast('Failed to fetch patients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(searchKeyword);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await patientsApi.deletePatient(deleteId);
      addToast('Patient deleted successfully', 'success');
      setDeleteId(null);
      fetchPatients(searchKeyword);
    } catch (error) {
      addToast('Failed to delete patient', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'dob', label: 'DOB', sortable: true },
    { key: 'gender', label: 'Gender', sortable: true },
    { key: 'cccd', label: 'CCCD', sortable: false },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'insuranceNumber', label: 'Insurance', sortable: false },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patients/${item.id}`)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/patients/${item.id}/edit`)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(item.id)}
                className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading && patients.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
          <p className="mt-1 text-slate-500">Manage patient records</p>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate('/patients/new')}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add Patient
          </button>
        )}
      </div>

      <form className="flex gap-3" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search by name, CCCD, or phone..."
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {patients.length === 0 ? (
        <EmptyState message="No patients found. Click 'Add Patient' to create one." />
      ) : (
        <DataTable columns={columns} data={patients} loading={isLoading} emptyText="No patients found." />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Patient"
        message="Are you sure you want to delete this patient? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PatientListPage;
