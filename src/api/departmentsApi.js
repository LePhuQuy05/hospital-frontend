import client from './client';

const API_BASE = '/api/v1/departments';

export const getDepartments = (params = {}) => client.get(API_BASE, { params });
export const getDepartmentById = (id) => client.get(`${API_BASE}/${id}`);
