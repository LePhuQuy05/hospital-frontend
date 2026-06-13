import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardPage from '../pages/DashboardPage';
import DoctorListPage from '../pages/doctors/DoctorListPage';
import DoctorFormPage from '../pages/doctors/DoctorFormPage';
import AppointmentPage from '../pages/appointments/AppointmentPage';
import ReceptionPage from '../pages/reception/ReceptionPage';
import PrescriptionPage from '../pages/prescriptions/PrescriptionPage';
import LabTestPage from '../pages/lab-tests/LabTestPage';
import ReportsPage from '../pages/reports/ReportsPage';
import PatientListPage from '../pages/patients/PatientListPage';
import PatientFormPage from '../pages/patients/PatientFormPage';
import PatientDetailPage from '../pages/patients/PatientDetailPage';
import MedicineListPage from '../pages/medicines/MedicineListPage';
import MedicineFormPage from '../pages/medicines/MedicineFormPage';
import InvoiceListPage from '../pages/invoices/InvoiceListPage';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import PatientInvoicesPage from '../pages/invoices/PatientInvoicesPage';
import AuditLogPage from '../pages/audit/AuditLogPage';
import UserListPage from '../pages/users/UserListPage';
import UserFormPage from '../pages/users/UserFormPage';
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
      <Route
        path="/doctors"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <DoctorListPage />
          </RoleGuard>
        }
      />
      <Route
        path="/doctors/new"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <DoctorFormPage />
          </RoleGuard>
        }
      />
      <Route
        path="/doctors/:id/edit"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <DoctorFormPage />
          </RoleGuard>
        }
      />
      <Route
        path="/appointments"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'DOCTOR', 'NURSE']}>
            <AppointmentPage />
          </RoleGuard>
        }
      />
      <Route
        path="/reception"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'NURSE']}>
            <ReceptionPage />
          </RoleGuard>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'DOCTOR', 'NURSE']}>
            <PrescriptionPage />
          </RoleGuard>
        }
      />
      <Route
        path="/lab-tests"
        element={
          <RoleGuard allowedRoles={['ADMIN', 'DOCTOR', 'NURSE']}>
            <LabTestPage />
          </RoleGuard>
        }
      />
      <Route path="/medicines" element={<MedicineListPage />} />
      <Route path="/medicines/new" element={<MedicineFormPage />} />
      <Route path="/medicines/:id/edit" element={<MedicineFormPage />} />
      <Route path="/invoices" element={<InvoiceListPage />} />
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      <Route path="/patients/:patientId/invoices" element={<PatientInvoicesPage />} />
      <Route
        path="/reports"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <ReportsPage />
          </RoleGuard>
        }
      />
      <Route
        path="/users"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <UserListPage />
          </RoleGuard>
        }
      />
      <Route
        path="/users/new"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <UserFormPage />
          </RoleGuard>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <UserFormPage />
          </RoleGuard>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <AuditLogPage />
          </RoleGuard>
        }
      />
    </Route>
    <Route path="/403" element={<ForbiddenPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default Router;
