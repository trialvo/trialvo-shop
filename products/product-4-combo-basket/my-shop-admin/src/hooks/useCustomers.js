import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '../api/customers.api';

export const useCustomers = (params) =>
 useQuery({
  queryKey: ['customers', params],
  queryFn: () => customersApi.getCustomers(params),
  keepPreviousData: true,
 });

export const useCustomer = (id) =>
 useQuery({
  queryKey: ['customer', id],
  queryFn: () => customersApi.getCustomer(id),
  enabled: !!id,
 });

export const useToggleCustomerStatus = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: customersApi.toggleCustomerStatus,
  onSuccess: () => {
   qc.invalidateQueries({ queryKey: ['customers'] });
  },
 });
};
