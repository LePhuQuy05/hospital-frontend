import client from './client';

const API_BASE = '/api/v1/prescriptions';

export const createPrescription = (data) => client.post(API_BASE, data);
export const getPrescriptionById = (id) => client.get(`${API_BASE}/${id}`);
export const getPrescriptionsByPatientId = (patientId) => client.get(`${API_BASE}/patient/${patientId}`);
export const exportPrescriptionPdf = (id) =>
  client.get(`${API_BASE}/${id}/export-pdf`, { responseType: 'blob' });
