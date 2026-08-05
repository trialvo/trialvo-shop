import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPermissionConfig,
  patchPermissionConfig,
  type PatchPermissionConfigPayload,
} from "@/api/permissions.api";

export const permissionKeys = {
  config: ["permission-config"] as const,
};

export function usePermissionConfig() {
  return useQuery({
    queryKey: permissionKeys.config,
    queryFn: getPermissionConfig,
    staleTime: 60_000,
  });
}

export function usePatchPermissionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatchPermissionConfigPayload) =>
      patchPermissionConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.config });
    },
  });
}
