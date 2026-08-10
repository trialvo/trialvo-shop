import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as couponsApi from '../api/coupons.api';

export const useCoupons = () =>
 useQuery({ queryKey: ['coupons'], queryFn: couponsApi.getCoupons });

export const useCreateCoupon = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: couponsApi.createCoupon,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
 });
};

export const useUpdateCoupon = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => couponsApi.updateCoupon(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
 });
};

export const useDeleteCoupon = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: couponsApi.deleteCoupon,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
 });
};
