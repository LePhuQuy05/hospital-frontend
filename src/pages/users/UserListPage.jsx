import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, ShieldCheck, RefreshCcw, Search } from 'lucide-react';
import * as usersApi from '../../api/usersApi';
import { useToast } from '../../components/ToastContainer';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';

const UserListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmToggleId, setConfirmToggleId] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async (currentPage = 0) => {
    setIsLoading(true);
    try {
      const response = await usersApi.getUsers({
        keyword,
        isActive: isActiveFilter,
        page: currentPage,
        size: 10,
      });
      const pageData = response.data?.data;
      setUsers(pageData?.content || []);
      setTotalPages(pageData?.totalPages ?? 1);
      setPage(pageData?.number ?? currentPage);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchUsers(0);
  };

  const handlePageChange = async (newPage) => {
    await fetchUsers(newPage);
  };

  const handleToggleActive = async () => {
    if (!confirmToggleId) return;
    setIsLoading(true);
    try {
      await usersApi.toggleUserActive(confirmToggleId);
      addToast('User status updated', 'success');
      setConfirmToggleId(null);
      await fetchUsers(page);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser?.id) return;
    setIsResetting(true);
    try {
      await usersApi.resetUserPassword(resetPasswordUser.id, { password: resetPasswordValue });
      addToast('Password reset successfully', 'success');
      setResetPasswordUser(null);
      setResetPasswordValue('');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const columns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          {(item.roles || []).map((role) => (
            <Badge key={role} variant="info">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'doctorId', label: 'Doctor ID', sortable: true },
    {
      key: 'isActive',
      label: 'Active',
      sortable: true,
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'danger'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/users/${item.id}/edit`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmToggleId(item.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
          >
            <RefreshCcw className="h-4 w-4" />
            {item.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => setResetPasswordUser(item)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="h-4 w-4" />
            Reset Password
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-slate-500">Manage application users, roles, and account status.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/users/new')}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Create User
        </button>
      </div>

      <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by username, email, or name..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <Search className="mr-2 h-4 w-4" />
          Search
        </button>
      </form>

      {isLoading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState message="No users found. Try adjusting your search or filters." />
      ) : (
        <DataTable columns={columns} data={users} loading={isLoading} emptyText="No users available." />
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => handlePageChange(page - 1)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => handlePageChange(page + 1)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmToggleId)}
        onClose={() => setConfirmToggleId(null)}
        onConfirm={handleToggleActive}
        title="Change User Status"
        message="Are you sure you want to toggle this user's active status?"
        confirmText="Confirm"
        confirmVariant="danger"
      />

      <Modal isOpen={Boolean(resetPasswordUser)} onClose={() => setResetPasswordUser(null)} title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Enter a new password for user {resetPasswordUser?.username}.</p>
          <input
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="New password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setResetPasswordUser(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetting || !resetPasswordValue.trim()}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;
