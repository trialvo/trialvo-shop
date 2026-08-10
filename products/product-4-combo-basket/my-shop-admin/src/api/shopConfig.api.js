import api from '../lib/api';

export const getShopConfig = () =>
 api.get('/config').then(r => r.data);

export const updateShopConfig = (data) =>
 api.put('/config', data).then(r => r.data);
