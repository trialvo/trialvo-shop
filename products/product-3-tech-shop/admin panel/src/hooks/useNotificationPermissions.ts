import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllAdminNotificationPermissions,
  getAdminNotificationPermissions,
  setAdminNotificationPermissions,
  type SetNotificationPermissionsPayload,
} from "@/api/notification-permissions.api";

export const notifPermKeys = {
  all: ["notification-permissions"] as const,
  one: (id: number) => ["notification-permissions", id] as const,
};

export function useAllAdminNotificationPermissions() {
  return useQuery({
    queryKey: notifPermKeys.all,
    queryFn: getAllAdminNotificationPermissions,
  });
}

export function useAdminNotificationPermissions(admin_id: number | null) {
  return useQuery({
    queryKey: admin_id ? notifPermKeys.one(admin_id) : notifPermKeys.all,
    queryFn: () => getAdminNotificationPermissions(admin_id!),
    enabled: Boolean(admin_id),
  });
}

export function useSetAdminNotificationPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admin_id, payload }: { admin_id: number; payload: SetNotificationPermissionsPayload }) =>
      setAdminNotificationPermissions(admin_id, payload),
    onSuccess: (_data, { admin_id }) => {
      qc.invalidateQueries({ queryKey: notifPermKeys.all });
      qc.invalidateQueries({ queryKey: notifPermKeys.one(admin_id) });
    },
  });
}
