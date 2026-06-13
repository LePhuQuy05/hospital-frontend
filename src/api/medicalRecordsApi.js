import client from './client';

const API_BASE = '/api/v1/medical-records';

export const checkInPatient = (data) => client.post(`${API_BASE}/check-in`, data);
export const getMedicalRecordsByPatientId = (patientId) => client.get(`${API_BASE}/patient/${patientId}`);
