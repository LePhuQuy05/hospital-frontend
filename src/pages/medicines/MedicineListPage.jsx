import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import * as medicinesApi from '../../api/medicinesApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { formatCurrency } from '../../utils/formatters';

const MedicineListPage = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { addToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = roles.some((role) => role === 'ADMIN');

  const loadMedicines = async (keyword = '', category = '') => {
    setIsLoading(true);
    try {
      let response;
      if (keyword.trim()) {
        response = await medicinesApi.searchMedicines(keyword);
      } else if (category) {
        response = await medicinesApi.getMedicinesByCategory(category);
      } else {
        response = await medicinesApi.getMedicines();
      }

      let list = response.data?.data || [];
      if (keyword.trim() && category) {
        list = list.filter((item) => item.category === category);
      }

      setMedicines(list);
      if (!keyword.trim()) {
        const uniqueCategories = Array.from(
          new Set(list.map((item) => item.category).filter(Boolean))
        );
        setCategories(uniqueCategories);
      }
    } catch (error) {
      addToast('Failed to fetch medicines', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadMedicines(searchKeyword, selectedCategory);
  };

  const handleCategoryChange = async (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    await loadMedicines(searchKeyword, value);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await medicinesApi.deleteMedicine(deleteId);
      addToast('Medicine deleted successfully', 'success');
      setDeleteId(null);
      await loadMedicines(searchKeyword, selectedCategory);
    } catch (error) {
      addToast('Failed to delete medicine', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'medicineName', label: 'Medicine Name', sortable: true },
    { key: 'genericName', label: 'Generic Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'unit', label: 'Unit', sortable: true },
    {
      key: 'unitPrice',
      label: 'Price (VND)',
      sortable: true,
      render: (item) => formatCurrency(item.unitPrice),
    },
    {
      key: 'insuranceCovered',
      label: 'BHYT',
      sortable: false,
      render: (item) => (item.insuranceCovered ? '✓' : '✗'),
    },
    {
      key: 'active',
      label: 'Active',
      sortable: false,
      render: (item) => (item.active ? 'Yes' : 'No'),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/medicines/${item.id}/edit`)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/medicines/${item.id}/edit`)}
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

  if (isLoading && medicines.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medicines</h1>
          <p className="mt-1 text-slate-500">Manage medicines and insurance coverage</p>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate('/medicines/new')}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        )}
      </div>

      <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search by medicine name or generic name..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">All categories</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {medicines.length === 0 ? (
        <EmptyState message="No medicines found. Adjust your search or add a new medicine." />
      ) : (
        <DataTable columns={columns} data={medicines} loading={isLoading} emptyText="No medicines available." />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message="Are you sure you want to delete this medicine? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default MedicineListPage;
