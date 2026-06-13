import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, CalendarCheck, Search } from 'lucide-react';
import * as appointmentsApi from '../../api/appointmentsApi';
import * as medicalRecordsApi from '../../api/medicalRecordsApi';
import { useToast } from '../../components/ToastContainer';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import SearchSelectInput from '../../components/SearchSelectInput';
import { formatDateTime } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/http';

const statusVariant = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const pad2 = (value) => String(value).padStart(2, '0');

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const todayKey = () => toDateKey(new Date());

const ReceptionPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [appointmentId, setAppointmentId] = useState('');
  const [appointmentLabel, setAppointmentLabel] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInRecord, setCheckedInRecord] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [filterKeyword, setFilterKeyword] = useState('');

  // Load today's confirmed appointments on mount
  useEffect(() => {
    const loadTodayAppointments = async () => {
      setIsLoadingToday(true);
      try {
        const response = await appointmentsApi.getAppointments();
        const all = response.data?.data || [];
        const today = todayKey();
        const confirmed = all.filter(
          (appt) => appt.status === 'CONFIRMED' && toDateKey(appt.apptDatetime) === today
        );
        setTodayAppointments(confirmed);
      } catch (error) {
        addToast(getErrorMessage(error, 'Failed to load today\'s appointments'), 'error');
      } finally {
        setIsLoadingToday(false);
      }
    };
    loadTodayAppointments();
  }, [addToast]);

  const filteredTodayAppointments = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    if (!kw) return todayAppointments;
    return todayAppointments.filter((appt) =>
      [appt.patientName, String(appt.id), appt.doctorName, appt.patientPhone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(kw))
    );
  }, [todayAppointments, filterKeyword]);

  const fetchAppointmentOptions = useCallback(async (keyword) => {
    try {
      const response = await appointmentsApi.getAppointments();
      const all = response.data?.data || [];
      const kw = keyword.toLowerCase();
      return all
        .filter(
          (appt) =>
            appt.status === 'CONFIRMED' &&
            [appt.patientName, String(appt.id), appt.doctorName]
              .filter(Boolean)
              .some((v) => v.toLowerCase().includes(kw))
        )
        .slice(0, 20)
        .map((appt) => ({
          id: appt.id,
          label: appt.patientName || `Patient #${appt.patientId}`,
          sub: `Appt #${appt.id} · ${formatDateTime(appt.apptDatetime)} · ${appt.doctorName || ''}`,
          raw: appt,
        }));
    } catch {
      return [];
    }
  }, []);

  const selectAppointment = async (appt) => {
    setAppointmentId(String(appt.id));
    setAppointmentLabel(appt.patientName || `Patient #${appt.patientId}`);
    setCheckedInRecord(null);
    setAppointment(appt);
    setNotes(appt.notes || '');
    if (appt.status && appt.status !== 'CONFIRMED') {
      addToast('Only CONFIRMED appointments can be checked in.', 'warning');
    }
  };

  const handleAppointmentSelect = async (id, item) => {
    setAppointmentId(String(id));
    setAppointmentLabel(item.label);
    setCheckedInRecord(null);

    setIsLookupLoading(true);
    try {
      const response = await appointmentsApi.getAppointmentById(id);
      const data = response.data?.data || null;
      setAppointment(data);
      setNotes(data?.notes || '');
      if (data?.status && data.status !== 'CONFIRMED') {
        addToast('Only CONFIRMED appointments can be checked in.', 'warning');
      }
    } catch (error) {
      setAppointment(null);
      addToast(getErrorMessage(error, 'Failed to load appointment'), 'error');
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleAppointmentClear = () => {
    setAppointmentId('');
    setAppointmentLabel('');
    setAppointment(null);
    setCheckedInRecord(null);
    setNotes('');
  };

  const handleCheckIn = async () => {
    if (!appointment) return;
    if (appointment.status !== 'CONFIRMED') {
      addToast('Only CONFIRMED appointments can be checked in.', 'warning');
      return;
    }

    setIsCheckingIn(true);
    try {
      const response = await medicalRecordsApi.checkInPatient({
        appointmentId: Number(appointment.id),
        notes: notes.trim() || undefined,
      });
      const record = response.data?.data || null;
      setCheckedInRecord(record);
      setAppointment((current) => ({ ...current, status: 'CHECKED_IN' }));
      // Update the today list to reflect the new status
      setTodayAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id ? { ...appt, status: 'CHECKED_IN' } : appt
        )
      );
      addToast('Patient checked in successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to check in patient'), 'error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Patient Reception</h1>
        <p className="mt-1 text-slate-500">
          Select a confirmed appointment from today's list or search by patient name / appointment ID.
        </p>
      </div>

      {/* Today's Confirmed Appointments */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900">Today's Confirmed Appointments</h2>
            <Badge variant="info">{todayAppointments.length}</Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="Filter by name, ID, phone..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-64"
            />
          </div>
        </div>

        {isLoadingToday ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading today's appointments...</p>
        ) : filteredTodayAppointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {filterKeyword ? 'No matching appointments found.' : 'No confirmed appointments for today.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Patient</th>
                  <th className="pb-3 pr-4 font-medium">Doctor</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTodayAppointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      appointment?.id === appt.id ? 'bg-sky-50' : ''
                    }`}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">#{appt.id}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{appt.patientName || `Patient #${appt.patientId}`}</p>
                      {appt.patientPhone && <p className="text-xs text-slate-500">{appt.patientPhone}</p>}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{appt.doctorName || `Doctor #${appt.doctorId}`}</td>
                    <td className="py-3 pr-4 text-slate-700">{formatDateTime(appt.apptDatetime)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant[appt.status] || 'default'}>{appt.status}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      {appt.status === 'CONFIRMED' ? (
                        <button
                          type="button"
                          onClick={() => selectAppointment(appt)}
                          disabled={appointment?.id === appt.id}
                          className="rounded-2xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {appointment?.id === appt.id ? 'Selected' : 'Select'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Checked in</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Search for other appointments */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">Or search for another appointment:</p>
        <SearchSelectInput
          placeholder="Type patient name or appointment ID..."
          value={appointmentId}
          selectedLabel={appointmentLabel}
          onSelect={handleAppointmentSelect}
          onClear={handleAppointmentClear}
          fetchOptions={fetchAppointmentOptions}
        />
        {isLookupLoading && (
          <p className="mt-2 text-sm text-slate-500">Loading appointment details...</p>
        )}
      </div>

      {!appointment ? (
        <EmptyState message="Select an appointment from the list above or search to begin check-in." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Appointment #{appointment.id}</h2>
                <p className="mt-1 text-sm text-slate-500">Check-in only works for CONFIRMED appointments.</p>
              </div>
              <Badge variant={statusVariant[appointment.status] || 'default'}>{appointment.status}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard label="Patient" value={appointment.patientName || `Patient #${appointment.patientId || '—'}`} />
              <InfoCard label="Doctor" value={appointment.doctorName || `Doctor #${appointment.doctorId || '—'}`} />
              <InfoCard label="Department / Room" value={appointment.departmentName || appointment.department?.deptName || '—'} />
              <InfoCard label="Date / Time" value={formatDateTime(appointment.apptDatetime)} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {appointment.notes || 'No notes were provided for this appointment.'}
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="checkinNotes" className="block text-sm font-medium text-slate-700">
                Reception notes
              </label>
              <textarea
                id="checkinNotes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Optional reception notes..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isCheckingIn || appointment.status !== 'CONFIRMED'}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                <ClipboardCheck className="h-4 w-4" />
                {isCheckingIn ? 'Checking in...' : 'Check In'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to appointments
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Next Step</h3>
              <p className="mt-2 text-sm text-slate-500">
                After check-in, the medical record can be forwarded to the prescription screen.
              </p>
              <button
                type="button"
                onClick={() =>
                  checkedInRecord?.id
                    ? navigate(`/prescriptions?medicalRecordId=${checkedInRecord.id}`)
                    : addToast('Check in the patient first to continue.', 'warning')
                }
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Go to prescription
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {checkedInRecord && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-emerald-900">Medical record created</h3>
                <div className="mt-4 space-y-3 text-sm text-emerald-900">
                  <DetailLine label="Medical Record ID" value={checkedInRecord.id} />
                  <DetailLine label="Appointment ID" value={checkedInRecord.appointmentId} />
                  <DetailLine label="Patient" value={checkedInRecord.patientName || '—'} />
                  <DetailLine label="Doctor" value={checkedInRecord.doctorName || '—'} />
                  <DetailLine label="Department / Room" value={checkedInRecord.departmentName || '—'} />
                  <DetailLine label="Visit Date" value={formatDateTime(checkedInRecord.visitDate)} />
                  <DetailLine label="Status" value={checkedInRecord.status || '—'} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-3xl bg-slate-50 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value || '—'}</p>
  </div>
);

const DetailLine = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-emerald-100 pb-2 last:border-b-0 last:pb-0">
    <span className="text-emerald-700">{label}</span>
    <span className="text-right font-semibold">{value || '—'}</span>
  </div>
);

export default ReceptionPage;