import api from '../lib/api';

export const getCustomers = (params) =>
 api.get('/customers', { params }).then(r => r.data);

export const getCustomer = (id) =>
 api.get(`/customers/${id}`).then(r => r.data);

export const toggleCustomerStatus = (id) =>
 api.put(`/customers/${id}/toggle`).then(r => r.data);
