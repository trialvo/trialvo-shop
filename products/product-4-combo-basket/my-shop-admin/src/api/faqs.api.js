import api from '../lib/api';

export const getFAQs = () =>
 api.get('/faqs').then(r => r.data);

export const createFAQ = (data) =>
 api.post('/faqs', data).then(r => r.data);

export const updateFAQ = (id, data) =>
 api.put(`/faqs/${id}`, data).then(r => r.data);

export const deleteFAQ = (id) =>
 api.delete(`/faqs/${id}`).then(r => r.data);
