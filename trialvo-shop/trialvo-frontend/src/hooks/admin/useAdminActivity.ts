import { useQuery } from '@tanstack/react-query';
import {
  adminActivityApi,
  type ActivityLogListParams,
} from '@/lib/adminActivityApi';

export function useAdminActivityLogs(params: ActivityLogListParams) {
  return useQuery({
    queryKey: ['admin', 'activity-logs', params],
    queryFn: () => adminActivityApi.list(params),
  });
}

export function useAdminActivityActions() {
  return useQuery({
    queryKey: ['admin', 'activity-logs', 'actions'],
    queryFn: async () => {
      const data = await adminActivityApi.actions();
      return data.actions;
    },
  });
}

export function useAdminActivityResources() {
  return useQuery({
    queryKey: ['admin', 'activity-logs', 'resources'],
    queryFn: async () => {
      const data = await adminActivityApi.resources();
      return data.resources;
    },
  });
}
