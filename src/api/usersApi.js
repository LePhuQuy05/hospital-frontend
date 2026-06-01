import client from './client';

export const getUsers = ({ keyword = '', isActive = '', page = 0, size = 10 } = {}) =>
  client.get('/api/users', {
    params: {
      keyword,
      isActive,
      page,
      size,
    },
  });

export const getUserById = (id) => client.get(`/api/users/${id}`);
export const createUser = (data) => client.post('/api/users', data);
export const updateUser = (id, data) => client.put(`/api/users/${id}`, data);
export const toggleUserActive = (id) => client.patch(`/api/users/${id}/toggle-active`);
export const resetUserPassword = (id, payload) => client.patch(`/api/users/${id}/reset-password`, payload);
