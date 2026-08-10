import api from '../lib/api';

export const getCoupons = () =>
 api.get('/coupons').then(r => r.data);

export const createCoupon = (data) =>
 api.post('/coupons', data).then(r => r.data);

export const updateCoupon = (id, data) =>
 api.put(`/coupons/${id}`, data).then(r => r.data);

export const deleteCoupon = (id) =>
 api.delete(`/coupons/${id}`).then(r => r.data);
