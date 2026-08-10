import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/comboBundles.api';

// Simple notification helper (no external library needed)
const notify = {
 success: (msg) => console.info('[✓]', msg),
 error: (msg) => console.error('[✗]', msg),
};

export const useComboBundles = (params) =>
 useQuery({
  queryKey: ['combo-bundles', params],
  queryFn: () => api.getComboBundles(params),
  placeholderData: (prev) => prev,
 });

export const useComboBundle = (id) =>
 useQuery({
  queryKey: ['combo-bundle', id],
  queryFn: () => api.getComboBundle(id),
  enabled: !!id,
 });

export const useCreateComboBundle = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: api.createComboBundle,
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['combo-bundles'] }); notify.success('কম্বো তৈরি হয়েছে'); },
  onError: (e) => notify.error(e.response?.data?.message || 'ত্রুটি হয়েছে'),
 });
};

export const useUpdateComboBundle = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => api.updateComboBundle(id, data),
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['combo-bundles'] }); notify.success('কম্বো আপডেট হয়েছে'); },
  onError: (e) => notify.error(e.response?.data?.message || 'ত্রুটি হয়েছে'),
 });
};

export const useToggleComboBundle = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: api.toggleComboBundle,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['combo-bundles'] }),
  onError: (e) => notify.error(e.response?.data?.message || 'ত্রুটি হয়েছে'),
 });
};

export const useDeleteComboBundle = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: api.deleteComboBundle,
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['combo-bundles'] }); notify.success('কম্বো মুছে গেছে'); },
  onError: (e) => notify.error(e.response?.data?.message || 'ত্রুটি হয়েছে'),
 });
};
