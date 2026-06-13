import client from './client';

const API_BASE = '/api/v1/doctors';

export const getDoctors = (params = {}) => client.get(API_BASE, { params });
export const getDoctorById = (id) => client.get(`${API_BASE}/${id}`);
export const createDoctor = (data) => client.post(API_BASE, data);
export const updateDoctor = (id, data) => client.put(`${API_BASE}/${id}`, data);
export const deleteDoctor = (id) => client.delete(`${API_BASE}/${id}`);
