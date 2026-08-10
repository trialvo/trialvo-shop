import api from '../lib/api';

/**
 * Upload a single file (image or video)
 * Returns { url, filename, type, mimetype, size }
 */
export async function uploadFile(file) {
 const formData = new FormData();
 formData.append('file', file);
 const res = await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
 });
 return res.data;
}

/**
 * Upload multiple files (max 10)
 * Returns { files: [{ url, filename, type, ... }] }
 */
export async function uploadFiles(files) {
 const formData = new FormData();
 files.forEach((f) => formData.append('files', f));
 const res = await api.post('/upload/multiple', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
 });
 return res.data;
}
