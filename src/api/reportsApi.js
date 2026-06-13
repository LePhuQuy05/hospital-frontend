import client from './client';

const API_BASE = '/api/v1/reports/revenue';

export const getRevenueReport = ({ from, to } = {}) =>
  client.get(API_BASE, {
    params: {
      from,
      to,
    },
  });

export const getTodayRevenue = () => client.get(`${API_BASE}/today`);
export const getThisMonthRevenue = () => client.get(`${API_BASE}/this-month`);
export const exportRevenueReport = ({ from, to } = {}) =>
  client.get(`${API_BASE}/export`, {
    params: {
      from,
      to,
    },
    responseType: 'blob',
  });
