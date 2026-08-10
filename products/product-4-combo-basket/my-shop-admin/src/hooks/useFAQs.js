import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as faqsApi from '../api/faqs.api';

export const useFAQs = () =>
 useQuery({ queryKey: ['faqs'], queryFn: faqsApi.getFAQs });

export const useCreateFAQ = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: faqsApi.createFAQ,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
 });
};

export const useUpdateFAQ = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: ({ id, data }) => faqsApi.updateFAQ(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
 });
};

export const useDeleteFAQ = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: faqsApi.deleteFAQ,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs'] }),
 });
};
