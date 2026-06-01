import client from './client';

export const createInvoice = (medicalRecordId) => client.post(`/api/v1/invoices/medical-records/${medicalRecordId}`);
export const payInvoice = (paymentRequest) => client.post('/api/v1/invoices/pay', paymentRequest);
export const getInvoiceById = (id) => client.get(`/api/v1/invoices/${id}`);
export const getInvoicesByPatientId = (patientId) => client.get(`/api/v1/invoices/patient/${patientId}`);
