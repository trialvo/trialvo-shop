import api from '../lib/api';

export const getSliders = () =>
 api.get('/sliders').then(r => r.data);

export const createSlider = (data) =>
 api.post('/sliders', data).then(r => r.data);

export const updateSlider = (id, data) =>
 api.put(`/sliders/${id}`, data).then(r => r.data);

export const deleteSlider = (id) =>
 api.delete(`/sliders/${id}`).then(r => r.data);

export const reorderSliders = (order) =>
 api.put('/sliders/reorder', { order }).then(r => r.data);

export const duplicateSlider = (id) =>
 api.post(`/sliders/${id}/duplicate`).then(r => r.data);

/** Upload banner image → returns { success, url } */
export const uploadSliderBanner = (file) => {
 const fd = new FormData();
 fd.append('file', file);
 return api.post('/sliders/upload-banner', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
 }).then(r => r.data);
};
