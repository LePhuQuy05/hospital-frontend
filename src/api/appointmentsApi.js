import client from './client';

const API_BASE = '/api/appointments';

export const getAppointments = (params = {}) => client.get(API_BASE, { params });
export const getAppointmentById = (id) => client.get(`${API_BASE}/${id}`);
export const getAppointmentsByPatientId = (patientId) => client.get(`${API_BASE}/patient/${patientId}`);
export const createAppointment = (data) => client.post(API_BASE, data);
export const updateAppointmentStatus = (id, status) =>
  client.put(`${API_BASE}/${id}/status`, null, { params: { status } });
export const checkAppointmentConflict = (doctorId, apptDatetime) =>
  client.get(`${API_BASE}/check-conflict`, {
    params: {
      doctorId,
      apptDatetime,
    },
  });
export const exportAppointmentPdf = (id) =>
  client.get(`${API_BASE}/${id}/export-pdf`, { responseType: 'blob' });
