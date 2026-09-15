import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationPermissionsApi,
  type PermissionMatrix,
} from '@/lib/adminStaffApi';

const PERMS_KEY = ['admin', 'notification-permissions'] as const;

export function useNotificationPermissions() {
  return useQuery({
    queryKey: PERMS_KEY,
    queryFn: () => notificationPermissionsApi.get(),
  });
}

export function useSaveGlobalPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (global: PermissionMatrix) =>
      notificationPermissionsApi.updateGlobal(global),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMS_KEY });
    },
  });
}

export function useSaveAdminPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminId,
      permissions,
    }: {
      adminId: string;
      permissions: PermissionMatrix;
    }) => notificationPermissionsApi.updateAdmin(adminId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMS_KEY });
    },
  });
}
