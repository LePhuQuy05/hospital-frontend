import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Printer } from 'lucide-react';
import * as appointmentsApi from '../../api/appointmentsApi';
import * as patientsApi from '../../api/patientsApi';
import * as doctorsApi from '../../api/doctorsApi';
import * as departmentsApi from '../../api/departmentsApi';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ToastContainer';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SearchSelectInput from '../../components/SearchSelectInput';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { downloadBlob } from '../../utils/download';
import { formatDateTime } from '../../utils/formatters';
import { getErrorMessage, getFieldErrors } from '../../utils/http';

const statusOptions = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'];
const statusVariant = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const nextStatusMap = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'CHECKED_IN',
  CHECKED_IN: 'COMPLETED',
};

const pad2 = (value) => String(value).padStart(2, '0');

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toMonthKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
};

const currentMonthKey = () => toMonthKey(new Date());

const toLocalDateTimeValue = (value) => {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
};

const getDayCells = (monthValue, appointments) => {
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return [];

  const firstDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDate.getDay();
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
    const dayAppointments = appointments.filter((appointment) => toDateKey(appointment.apptDatetime) === dateKey);
    cells.push({
      day,
      dateKey,
      count: dayAppointments.length,
    });
  }

  return cells;
};

const getAppointmentLabel = (appointment) =>
  appointment.patientName ||
  appointment.patient?.fullName ||
  appointment.patient?.name ||
  `Patient #${appointment.patientId || '—'}`;

const getDoctorLabel = (appointment, doctorDirectory) => {
  if (appointment.doctorName) return appointment.doctorName;
  if (appointment.doctor?.fullName) return appointment.doctor.fullName;
  const doctor = doctorDirectory.find((item) => String(item.id) === String(appointment.doctorId));
  return doctor?.fullName || `Doctor #${appointment.doctorId || '—'}`;
};

const getDepartmentLabel = (appointment) =>
  appointment.departmentName ||
  appointment.department?.deptName ||
  appointment.department?.name ||
  `#${appointment.departmentId || '—'}`;

const emptyForm = {
  patientId: '',
  doctorId: '',
  apptDatetime: '',
  email: '',
  notes: '',
};

const AppointmentPage = () => {
  const { roles } = useAuth();
  const { addToast } = useToast();
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const canManageAppointments = roles.some((role) => ['ADMIN', 'NURSE'].includes(role));
  const canViewAllAppointments = canManageAppointments;
  const isDoctorOnly = roles.includes('DOCTOR') && !canManageAppointments;
  const isAdmin = roles.includes('ADMIN');

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(canViewAllAppointments);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [selectedDate, setSelectedDate] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
  });
  const [patientLookupId, setPatientLookupId] = useState('');
  const [patientLookupLabel, setPatientLookupLabel] = useState('');
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [isPatientLookupLoading, setIsPatientLookupLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

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

  const loadAppointments = async () => {
    if (!canViewAllAppointments) return;

    setIsLoading(true);
    try {
      const response = await appointmentsApi.getAppointments();
      setAppointments(response.data?.data || []);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to load appointments'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    if (!canManageAppointments) return;

    try {
      const response = await patientsApi.getPatients();
      setPatients(response.data?.data || []);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to load patients'), 'error');
    }
  };

  const loadDoctors = async () => {
    if (!canManageAppointments) return;

    setIsDoctorsLoading(true);
    try {
      const [doctorResponse, departmentResponse] = await Promise.allSettled([
        doctorsApi.getDoctors(),
        departmentsApi.getDepartments(),
      ]);

      if (doctorResponse.status === 'fulfilled') {
        setDoctors(doctorResponse.value.data?.data || []);
      } else {
        addToast(getErrorMessage(doctorResponse.reason, 'Failed to load doctors'), 'error');
      }

      if (departmentResponse.status === 'fulfilled') {
        setDepartments(departmentResponse.value.data?.data || []);
      }
    } finally {
      setIsDoctorsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleAppointments = useMemo(() => {
    const source = canViewAllAppointments ? appointments : patientAppointments;
    const keyword = filters.keyword.trim().toLowerCase();

    const filtered = source.filter((appointment) => {
      const matchesStatus = !canManageAppointments || !filters.status || appointment.status === filters.status;
      const matchesDate = !canManageAppointments || !selectedDate || toDateKey(appointment.apptDatetime) === selectedDate;
      const searchableValues = [
        appointment.id,
        getAppointmentLabel(appointment),
        getDoctorLabel(appointment, doctors),
        getDepartmentLabel(appointment),
        appointment.notes,
        appointment.patientPhone,
      ];
      const matchesKeyword =
        !keyword || searchableValues.filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));

      return matchesStatus && matchesDate && matchesKeyword;
    });

    return filtered.sort((left, right) => new Date(left.apptDatetime) - new Date(right.apptDatetime));
  }, [appointments, canViewAllAppointments, doctors, filters.keyword, filters.status, patientAppointments, selectedDate]);

  const monthCells = useMemo(() => getDayCells(selectedMonth, canViewAllAppointments ? appointments : patientAppointments), [
    appointments,
    canViewAllAppointments,
    patientAppointments,
    selectedMonth,
  ]);

  const statusCounts = useMemo(
    () =>
      statusOptions.reduce((accumulator, status) => {
        accumulator[status] = visibleAppointments.filter((appointment) => appointment.status === status).length;
        return accumulator;
      }, {}),
    [visibleAppointments]
  );

  const patientOptions = useMemo(() => {
    const keyword = patientSearch.trim().toLowerCase();
    const filteredPatients = patients.filter((patient) => {
      if (!keyword) return true;
      return [patient.fullName, patient.phone, patient.cccd, patient.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
    const selectedPatient = patients.find((patient) => String(patient.id) === String(formData.patientId));
    if (selectedPatient && !filteredPatients.some((patient) => String(patient.id) === String(selectedPatient.id))) {
      return [selectedPatient, ...filteredPatients];
    }
    return filteredPatients;
  }, [formData.patientId, patientSearch, patients]);

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        id: doctor.id,
        label: `${doctor.fullName || `Doctor #${doctor.id}`}${doctor.departmentId ? ` - ${departmentMap[String(doctor.departmentId)] || `Dept #${doctor.departmentId}`}` : ''}`,
      })),
    [departmentMap, doctors]
  );

  const openCreateModal = () => {
    const defaultDate = selectedDate || todayKey;
    setFormData({
      patientId: '',
      doctorId: '',
      apptDatetime: defaultDate ? `${defaultDate}T09:00` : '',
      email: '',
      notes: '',
    });
    setFormErrors({});
    setPatientSearch('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    setFormErrors({});

    const validationErrors = {};
    if (!formData.patientId) validationErrors.patientId = 'Patient is required.';
    if (!formData.doctorId) validationErrors.doctorId = 'Doctor is required.';
    if (!formData.apptDatetime) validationErrors.apptDatetime = 'Date and time are required.';

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentDatetime = toLocalDateTimeValue(formData.apptDatetime);
      const conflictResponse = await appointmentsApi.checkAppointmentConflict(
        Number(formData.doctorId),
        appointmentDatetime
      );
      const conflictData = conflictResponse.data?.data;
      if (conflictData?.conflict || conflictData?.hasConflict) {
        throw new Error(conflictData?.message || 'The selected time slot conflicts with an existing appointment.');
      }

      const payload = {
        patientId: Number(formData.patientId),
        doctorId: Number(formData.doctorId),
        apptDatetime: appointmentDatetime,
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await appointmentsApi.createAppointment(payload);
      addToast('Appointment created successfully', 'success');
      closeCreateModal();
      await loadAppointments();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors);
      } else {
        addToast(getErrorMessage(error, 'Failed to create appointment'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    setStatusUpdatingId(appointmentId);
    try {
      await appointmentsApi.updateAppointmentStatus(appointmentId, status);
      addToast(`Appointment updated to ${status}`, 'success');
      if (canViewAllAppointments) {
        await loadAppointments();
      } else if (patientLookupId.trim()) {
        await loadPatientAppointments();
      }
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to update appointment'), 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportAppointmentPdf = async (appointmentId) => {
    try {
      const response = await appointmentsApi.exportAppointmentPdf(appointmentId);
      downloadBlob(response, `appointment-${appointmentId}.pdf`);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to export appointment PDF'), 'error');
    }
  };

  
  const fetchPatientOptions = useCallback(async (keyword) => {
    try {
      const response = await patientsApi.searchPatients(keyword);
      const patients = response.data?.data || [];
      return patients.map((p) => ({
        id: p.id,
        label: p.fullName || `Patient #${p.id}`,
        sub: `ID: ${p.id}${p.phone ? ' · ' + p.phone : ''}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadPatientAppointments = async (overrideId) => {
    const idToUse = overrideId || patientLookupId;
    if (!String(idToUse).trim()) {
      addToast('Please enter a patient ID.', 'warning');
      return;
    }

    setIsPatientLookupLoading(true);
    try {
      const response = await appointmentsApi.getAppointmentsByPatientId(String(idToUse).trim());
      setPatientAppointments(response.data?.data || []);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to load patient appointments'), 'error');
      setPatientAppointments([]);
    } finally {
      setIsPatientLookupLoading(false);
    }
  };

  const columns = [
    {
      key: 'apptDatetime',
      label: 'Date / Time',
      sortable: true,
      render: (item) => formatDateTime(item.apptDatetime) || '—',
    },
    {
      key: 'patientName',
      label: 'Patient',
      sortable: true,
      render: (item) => getAppointmentLabel(item),
    },
    {
      key: 'doctorName',
      label: 'Doctor',
      sortable: true,
      render: (item) => getDoctorLabel(item, doctors),
    },
    {
      key: 'departmentName',
      label: 'Department',
      sortable: true,
      render: (item) => getDepartmentLabel(item),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => <Badge variant={statusVariant[item.status] || 'default'}>{item.status}</Badge>,
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      render: (item) => item.notes || '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => {
        const canUpdateStatus = canManageAppointments && !['COMPLETED', 'CANCELLED'].includes(item.status);
        const nextStatus = nextStatusMap[item.status];

        return (
          <div className="flex flex-wrap gap-2">
            {nextStatus && canUpdateStatus && (
              <button
                type="button"
                onClick={() => updateAppointmentStatus(item.id, nextStatus)}
                disabled={statusUpdatingId === item.id}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {statusUpdatingId === item.id ? 'Updating...' : nextStatus}
              </button>
            )}
            {canUpdateStatus && (
              <button
                type="button"
                onClick={() => setCancelTarget(item)}
                disabled={statusUpdatingId === item.id}
                className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => exportAppointmentPdf(item.id)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-3 w-3" />
              PDF
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointment Schedule</h1>
          <p className="mt-1 text-slate-500">
            {canViewAllAppointments
              ? 'Calendar view and appointment list for hospital operations.'
              : 'View appointments for a patient and export the schedule.'}
          </p>
        </div>
        {canManageAppointments && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Create Appointment
          </button>
        )}
      </div>

      {canManageAppointments && (
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          {statusOptions.map((status) => (
            <div key={status} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{status}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{statusCounts[status] || 0}</span>
                <Badge variant={statusVariant[status] || 'default'}>{status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {canManageAppointments ? (
        <>
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_180px_auto]">
            <input
              type="text"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              placeholder="Search patient, doctor, department, notes..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setFilters({ status: '', keyword: '' });
                setSelectedDate('');
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Calendar View</h2>
                  <p className="text-sm text-slate-500">Select a day to focus the appointment list.</p>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <div key={label} className="px-2 py-1 text-center">
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthCells.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="min-h-24 rounded-2xl border border-dashed border-slate-100 bg-slate-50/60" />;
                  }

                  const isSelected = selectedDate ? selectedDate === cell.dateKey : cell.dateKey === todayKey;
                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateKey)}
                      className={`min-h-24 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-100'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{cell.day}</span>
                        <Badge variant={cell.count > 0 ? 'info' : 'default'}>{cell.count}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{cell.dateKey}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Quick Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((status) => (
                  <div key={status} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{status}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounts[status] || 0}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Selected day</p>
                <p className="mt-1 text-sm text-slate-600">{selectedDate || 'No date selected'}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-slate-700">
          Doctors can only view appointments by patient ID because the backend list endpoint is restricted.
        </div>
      )}

      {isDoctorOnly ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Patient Lookup</h2>
            <p className="text-sm text-slate-500">Search a patient by name to load their appointments.</p>
          </div>
          <SearchSelectInput
            placeholder="Type patient name, phone, or CCCD..."
            value={patientLookupId}
            selectedLabel={patientLookupLabel}
            onSelect={(id, item) => {
              setPatientLookupId(String(id));
              setPatientLookupLabel(item.label);
              loadPatientAppointments(id);
            }}
            onClear={() => {
              setPatientLookupId('');
              setPatientLookupLabel('');
              setPatientAppointments([]);
            }}
            fetchOptions={fetchPatientOptions}
            disabled={isPatientLookupLoading}
          />
          {isPatientLookupLoading && (
            <p className="mt-2 text-sm text-slate-500">Loading appointments...</p>
          )}
        </div>
      ) : null}

      {canManageAppointments || patientAppointments.length > 0 ? (
        visibleAppointments.length === 0 ? (
          <EmptyState message="No appointments match the current filters." />
        ) : (
          <DataTable columns={columns} data={visibleAppointments} loading={isLoading} emptyText="No appointments found." />
        )
      ) : isDoctorOnly ? (
        <EmptyState message="Search a patient ID to display their appointments." />
      ) : null}

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Create Appointment" size="lg">
        <form onSubmit={submitAppointment} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="patientId" className="block text-sm font-medium text-slate-700">
                Patient <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search patient by name, phone, CCCD..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <select
                id="patientId"
                name="patientId"
                value={formData.patientId}
                onChange={handleFormChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  formErrors.patientId ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <option value="">Select patient</option>
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName || `Patient #${patient.id}`} {patient.phone ? `- ${patient.phone}` : ''}
                  </option>
                ))}
              </select>
              {formErrors.patientId && <p className="text-sm text-rose-600">{formErrors.patientId}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="doctorId" className="block text-sm font-medium text-slate-700">
                Doctor <span className="text-rose-500">*</span>
              </label>
              {canManageAppointments && doctorOptions.length > 0 && !isDoctorsLoading ? (
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleFormChange}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                    formErrors.doctorId ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <option value="">Select doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="doctorId"
                  name="doctorId"
                  type="number"
                  value={formData.doctorId}
                  onChange={handleFormChange}
                  placeholder="Doctor ID"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                    formErrors.doctorId ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
                  }`}
                />
              )}
              {formErrors.doctorId && <p className="text-sm text-rose-600">{formErrors.doctorId}</p>}
            </div>

            <FormField
              label="Appointment Time"
              name="apptDatetime"
              type="datetime-local"
              value={formData.apptDatetime}
              onChange={handleFormChange}
              error={formErrors.apptDatetime}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              error={formErrors.email}
              placeholder="patient@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows={4}
              placeholder="Symptoms or visit reason..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            {formErrors.notes && <p className="text-sm text-rose-600">{formErrors.notes}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (!cancelTarget) return;
          setCancelTarget(null);
          await updateAppointmentStatus(cancelTarget.id, 'CANCELLED');
        }}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmText="Cancel appointment"
        confirmVariant="danger"
      />
    </div>
  );
};

const FormField = ({ label, name, type = 'text', value, onChange, error, required = false, placeholder = '' }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
        error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
      }`}
    />
    {error && <p className="text-sm text-rose-600">{error}</p>}
  </div>
);

export default AppointmentPage;
