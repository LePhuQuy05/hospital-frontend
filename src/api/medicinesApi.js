import client from './client';

export const getMedicines = () => client.get('/api/v1/medicines');
export const searchMedicines = (keyword) => client.get('/api/v1/medicines/search', { params: { keyword } });
export const getMedicinesByCategory = (category) => client.get('/api/v1/medicines/category', { params: { category } });
export const getMedicineById = (id) => client.get(`/api/v1/medicines/${id}`);
export const createMedicine = (data) => client.post('/api/v1/medicines', data);
export const updateMedicine = (id, data) => client.put(`/api/v1/medicines/${id}`, data);
export const deleteMedicine = (id) => client.delete(`/api/v1/medicines/${id}`);
