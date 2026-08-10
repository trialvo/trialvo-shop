import api from '../lib/api';

export const getProductReviews = (productId) =>
 api.get(`/products/${productId}/reviews`).then((r) => r.data);

export const deleteProductReview = (productId, reviewId) =>
 api.delete(`/products/${productId}/reviews/${reviewId}`).then((r) => r.data);

export const updateProductReview = (productId, reviewId, data) =>
 api.put(`/products/${productId}/reviews/${reviewId}`, data).then((r) => r.data);
