import client from './client';

const API_BASE = '/api/v1/patients';

export const getPatients = () => client.get(API_BASE);

export const searchPatients = (keyword) => client.get(`${API_BASE}/search`, { params: { keyword } });

export const getPatientById = (id) => client.get(`${API_BASE}/${id}`);

export const createPatient = (data) => client.post(API_BASE, data);

export const updatePatient = (id, data) => client.put(`${API_BASE}/${id}`, data);

export const deletePatient = (id) => client.delete(`${API_BASE}/${id}`);
