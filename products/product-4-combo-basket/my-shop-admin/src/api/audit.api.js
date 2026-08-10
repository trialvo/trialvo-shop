import api from '../lib/api';

export const getAuditLogs = (params) =>
 api.get('/audit', { params }).then(r => r.data);

export const getEntityHistory = (entityType, entityId) =>
 api.get(`/audit/${entityType}/${entityId}`).then(r => r.data);
