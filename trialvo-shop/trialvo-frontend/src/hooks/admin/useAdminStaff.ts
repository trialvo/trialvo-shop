import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminStaffApi,
  type CreateStaffPayload,
  type UpdateStaffPayload,
} from '@/lib/adminStaffApi';

const STAFF_KEY = ['admin', 'staff'] as const;

export function useAdminStaff(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: STAFF_KEY,
    queryFn: async () => {
      const data = await adminStaffApi.list();
      return data.staff;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => adminStaffApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) =>
      adminStaffApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminStaffApi.resetPassword(id, password),
  });
}
