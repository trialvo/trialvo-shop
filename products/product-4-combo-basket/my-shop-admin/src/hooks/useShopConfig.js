import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as shopConfigApi from '../api/shopConfig.api';

export const useShopConfig = () =>
 useQuery({ queryKey: ['shopConfig'], queryFn: shopConfigApi.getShopConfig });

export const useUpdateShopConfig = (options = {}) => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: shopConfigApi.updateShopConfig,
  ...options,
  meta: {
   successMessage: false,
   errorMessage: false,
   ...(options.meta || {}),
  },
  onSuccess: (data, variables, context) => {
   qc.invalidateQueries({ queryKey: ['shopConfig'] });
   if (options.onSuccess) {
    options.onSuccess(data, variables, context);
   }
  },
 });
};
