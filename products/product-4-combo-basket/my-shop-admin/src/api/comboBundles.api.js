import api from '../lib/api';

// Base URL is already /api/admin — so paths here are relative to that
export const getComboBundles = (params) => api.get('/combo-products', { params }).then(r => r.data);
export const getComboBundle = (id) => api.get(`/combo-products/${id}`).then(r => r.data);
export const createComboBundle = (data) => api.post('/combo-products', data).then(r => r.data);
export const updateComboBundle = (id, data) => api.put(`/combo-products/${id}`, data).then(r => r.data);
export const toggleComboBundle = (id) => api.patch(`/combo-products/${id}/toggle`).then(r => r.data);
export const deleteComboBundle = (id) => api.delete(`/combo-products/${id}`).then(r => r.data);
