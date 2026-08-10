import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productsApi from '../api/products.api';

export const useProducts = (params) =>
 useQuery({
  queryKey: ['products', params],
  queryFn: () => productsApi.getProducts(params),
  keepPreviousData: true,
 });

export const useProduct = (id) =>
 useQuery({
  queryKey: ['product', id],
  queryFn: () => productsApi.getProduct(id),
  enabled: !!id,
 });

export const useCreateProduct = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: productsApi.createProduct,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
 });
};

export const useUpdateProduct = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => productsApi.updateProduct(id, data),
  onSuccess: (_, { id }) => {
   qc.invalidateQueries({ queryKey: ['products'] });
   qc.invalidateQueries({ queryKey: ['product', id] });
  },
 });
};

export const useDeleteProduct = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: productsApi.deleteProduct,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
 });
};
