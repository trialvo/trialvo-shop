import axios from 'axios';
import { ENV } from '../config/env';

const api = axios.create({
 baseURL: `${ENV.API_URL}/admin`,
});


// Attach JWT token to every request
api.interceptors.request.use((config) => {
 const token = localStorage.getItem('admin_token');
 if (token) config.headers.Authorization = `Bearer ${token}`;
 return config;
});

// Redirect to login on 401
api.interceptors.response.use(
 (res) => res,
 (error) => {
  if (error.response?.status === 401) {
   localStorage.removeItem('admin_token');
   localStorage.removeItem('admin_user');
   window.location.href = '/login';
  }
  return Promise.reject(error);
 }
);

export default api;
