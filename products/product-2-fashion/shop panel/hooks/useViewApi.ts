'use client';

import { ViewRequest, ViewResponse, viewService } from '@/lib/api/analytics/service';
import { useMutation } from '@tanstack/react-query';

export const useViewApi = () => {
  return useMutation<ViewResponse, Error, ViewRequest>({
    mutationFn: (data) => viewService.recordView(data),
    onSuccess: (data) => {
    //   console.log('View recorded successfully:', data);
    },
    onError: (error) => {
    //   console.error('Failed to record view:', error);
    },
  });
};