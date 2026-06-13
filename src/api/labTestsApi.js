import client from './client';

const API_BASE = '/api/v1/lab-tests';

export const getPendingLabTests = () => client.get(`${API_BASE}/pending`);
export const createLabTest = (data) => client.post(API_BASE, data);

export const updateLabTestResult = (id, data, file) => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'data.json');
  if (file) {
    formData.append('file', file);
  }

  return client.put(`${API_BASE}/${id}/result`, formData);
};
