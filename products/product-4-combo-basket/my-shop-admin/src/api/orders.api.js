import api from '../lib/api';

export const getOrders = (params) =>
 api.get('/orders', { params }).then(r => r.data);

export const getOrder = (id) =>
 api.get(`/orders/${id}`).then(r => r.data);

export const updateOrderStatus = (id, data) =>
 api.put(`/orders/${id}/status`, data).then(r => r.data);
