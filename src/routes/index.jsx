import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardPage from '../pages/DashboardPage';
import PatientListPage from '../pages/patients/PatientListPage';
import PatientFormPage from '../pages/patients/PatientFormPage';
import PatientDetailPage from '../pages/patients/PatientDetailPage';
import MedicineListPage from '../pages/medicines/MedicineListPage';
import MedicineFormPage from '../pages/medicines/MedicineFormPage';
import InvoiceListPage from '../pages/invoices/InvoiceListPage';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import PatientInvoicesPage from '../pages/invoices/PatientInvoicesPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import LoginPage from '../pages/LoginPage';

const Router = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/patients" element={<PatientListPage />} />
      <Route path="/patients/new" element={<PatientFormPage />} />
      <Route path="/patients/:id" element={<PatientDetailPage />} />
      <Route path="/patients/:id/edit" element={<PatientFormPage />} />
      <Route path="/medicines" element={<MedicineListPage />} />
      <Route path="/medicines/new" element={<MedicineFormPage />} />
      <Route path="/medicines/:id/edit" element={<MedicineFormPage />} />
      <Route path="/invoices" element={<InvoiceListPage />} />
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      <Route path="/patients/:patientId/invoices" element={<PatientInvoicesPage />} />
      <Route
        path="/users"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <PlaceholderPage title="User Management" />
          </RoleGuard>
        }
      />
      <Route
        path="/users/new"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <PlaceholderPage title="Create User" />
          </RoleGuard>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <PlaceholderPage title="Edit User" />
          </RoleGuard>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <PlaceholderPage title="Audit Logs" />
          </RoleGuard>
        }
      />
    </Route>
    <Route path="/403" element={<ForbiddenPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default Router;
