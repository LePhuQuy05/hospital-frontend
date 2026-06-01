import client from '../api/client';

const AUTH_BASE = '/api/auth';

export const login = (data) => client.post(`${AUTH_BASE}/login`, data);
export const logout = () => client.post(`${AUTH_BASE}/logout`);
export const getMe = () => client.get(`${AUTH_BASE}/me`);
export const refresh = (refreshToken) => client.post(`${AUTH_BASE}/refresh`, { refreshToken });
