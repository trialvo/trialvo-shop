import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as messagesApi from '../api/messages.api';

export const useMessages = (params) =>
 useQuery({
  queryKey: ['messages', params],
  queryFn: () => messagesApi.getMessages(params),
  keepPreviousData: true,
 });

export const useMarkMessageRead = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: messagesApi.markMessageRead,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
 });
};

export const useDeleteMessage = () => {
 const qc = useQueryClient();
 return useMutation({
  mutationFn: messagesApi.deleteMessage,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
 });
};
