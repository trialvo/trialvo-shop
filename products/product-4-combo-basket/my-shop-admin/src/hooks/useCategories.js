import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoriesApi from '../api/categories.api';

export const useCategories = () =>
 useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getCategories });

export const useCreateCategory = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: categoriesApi.createCategory,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
 });
};

export const useUpdateCategory = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => categoriesApi.updateCategory(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
 });
};

export const useDeleteCategory = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: categoriesApi.deleteCategory,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
 });
};

export const useReorderCategories = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: categoriesApi.reorderCategories,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
 });
};
