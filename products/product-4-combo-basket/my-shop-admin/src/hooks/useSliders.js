import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as slidersApi from '../api/sliders.api';

export const useSliders = () =>
 useQuery({ queryKey: ['sliders'], queryFn: slidersApi.getSliders });

export const useCreateSlider = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: slidersApi.createSlider,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['sliders'] }),
 });
};

export const useUpdateSlider = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => slidersApi.updateSlider(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['sliders'] }),
 });
};

export const useDeleteSlider = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: slidersApi.deleteSlider,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['sliders'] }),
 });
};

export const useReorderSliders = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: slidersApi.reorderSliders,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['sliders'] }),
 });
};

export const useDuplicateSlider = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: slidersApi.duplicateSlider,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['sliders'] }),
 });
};

