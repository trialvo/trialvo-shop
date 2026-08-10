import api from '../lib/api';

export const getStats = () =>
 api.get('/stats').then(r => r.data);

export const getOrdersChart = () =>
 api.get('/stats/chart').then(r => r.data);

export const getTopProducts = () =>
 api.get('/stats/top-products').then(r => r.data);
