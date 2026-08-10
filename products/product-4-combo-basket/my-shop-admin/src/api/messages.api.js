import api from '../lib/api';

export const getMessages = (params) =>
 api.get('/messages', { params }).then(r => r.data);

export const markMessageRead = (id) =>
 api.put(`/messages/${id}/read`).then(r => r.data);

export const deleteMessage = (id) =>
 api.delete(`/messages/${id}`).then(r => r.data);
