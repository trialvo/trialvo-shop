import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../api/orders.api';

export const useOrders = (params) =>
 useQuery({
  queryKey: ['orders', params],
  queryFn: () => ordersApi.getOrders(params),
  keepPreviousData: true,
 });

export const useOrder = (id) =>
 useQuery({
  queryKey: ['order', id],
  queryFn: () => ordersApi.getOrder(id),
  enabled: !!id,
 });

export const useUpdateOrderStatus = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => ordersApi.updateOrderStatus(id, data),
  onSuccess: (_, { id }) => {
   qc.invalidateQueries({ queryKey: ['orders'] });
   qc.invalidateQueries({ queryKey: ['order', id] });
  },
 });
};
