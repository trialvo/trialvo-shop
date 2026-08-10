import { create } from 'zustand';

export const useAuthStore = create((set) => ({
 token: localStorage.getItem('admin_token') || null,
 user: JSON.parse(localStorage.getItem('admin_user') || 'null'),

 login: (token, user) => {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
  set({ token, user });
 },

 logout: () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  set({ token: null, user: null });
 },
}));
