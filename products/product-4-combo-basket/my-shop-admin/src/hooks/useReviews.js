import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reviewsApi from '../api/reviews.api';

export const useProductReviews = (productId) =>
 useQuery({
  queryKey: ['product-reviews', productId],
  queryFn: () => reviewsApi.getProductReviews(productId),
  enabled: !!productId,
 });

export const useDeleteProductReview = (productId) => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: (reviewId) => reviewsApi.deleteProductReview(productId, reviewId),
  onSuccess: () => {
   qc.invalidateQueries({ queryKey: ['product-reviews', productId] });
   qc.invalidateQueries({ queryKey: ['product', String(productId)] });
  },
 });
};

export const useUpdateProductReview = (productId) => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ reviewId, data }) => reviewsApi.updateProductReview(productId, reviewId, data),
  onSuccess: () => {
   qc.invalidateQueries({ queryKey: ['product-reviews', productId] });
  },
 });
};
