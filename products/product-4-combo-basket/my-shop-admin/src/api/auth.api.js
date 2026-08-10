import api from '../lib/api';

export const login = (data) =>
 api.post('/auth/login', data).then(r => r.data);

export const getMe = () =>
 api.get('/auth/me').then(r => r.data);

export const updateMe = (data) =>
 api.put('/auth/me', data).then(r => r.data);

export const changePassword = (data) =>
 api.put('/auth/me/password', data).then(r => r.data);
