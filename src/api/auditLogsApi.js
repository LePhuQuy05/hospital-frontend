import client from './client';

export const getAuditLogs = ({ userId = '', action = '', entityType = '', fromDate = '', toDate = '', page = 0, size = 20 } = {}) =>
  client.get('/api/audit-logs', {
    params: {
      userId: userId || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size,
    },
  });

export const getAuditLogById = (id) => client.get(`/api/audit-logs/${id}`);

export const exportAuditLogs = ({ userId = '', action = '', entityType = '', fromDate = '', toDate = '' } = {}) =>
  client.get('/api/audit-logs/export', {
    params: {
      userId: userId || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
    responseType: 'blob',
  });
