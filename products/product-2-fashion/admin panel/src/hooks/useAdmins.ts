import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  createAdmin,
  deleteAdmin,
  softDeleteAdmin,
  getAdminById,
  getAdmins,
  uploadProfileImage,
  updateAdmin,
  type AdminByIdResponse,
  type AdminListResponse,
  type CreateAdminPayload,
  type CreateAdminResponse,
  type DeleteAdminResponse,
  type UpdateAdminBody,
  type UpdateAdminResponse,
  type UploadProfileImageResponse,
} from "@/api/admin.api";

export const adminKeys = {
  all: ["admins"] as const,
  list: (params: Record<string, any>) => ["admins", "list", params] as const,
  detail: (id: number) => ["admins", "detail", id] as const,
};

export const useAdmins = (params: {
  role?: string;
  email?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) => {
  return useQuery<AdminListResponse>({
    queryKey: adminKeys.list(params),
    queryFn: () => getAdmins(params),
  });
};

export const useAdminById = (id: number | null) => {
  return useQuery<AdminByIdResponse>({
    queryKey: id ? adminKeys.detail(id) : adminKeys.detail(0),
    queryFn: () => getAdminById(id as number),
    enabled: Boolean(id),
  });
};

/**
 * ✅ create admin supports multipart (FormData) via createAdmin(payload)
 * payload can include: profile?: File | null
 */
export const useCreateAdmin = (
  options?: UseMutationOptions<CreateAdminResponse, unknown, CreateAdminPayload>
) => {
  return useMutation<CreateAdminResponse, unknown, CreateAdminPayload>({
    mutationFn: (payload) => createAdmin(payload),
    ...options,
  });
};

export const useUpdateAdmin = (
  options?: UseMutationOptions<
    UpdateAdminResponse,
    unknown,
    { id: number; body: UpdateAdminBody }
  >
) => {
  return useMutation<
    UpdateAdminResponse,
    unknown,
    { id: number; body: UpdateAdminBody }
  >({
    mutationFn: ({ id, body }) => updateAdmin(id, body),
    ...options,
  });
};

export const useUploadAdminProfile = (
  options?: UseMutationOptions<
    UploadProfileImageResponse,
    unknown,
    { id: number; file: File }
  >
) => {
  return useMutation<
    UploadProfileImageResponse,
    unknown,
    { id: number; file: File }
  >({
    mutationFn: ({ id, file }) => uploadProfileImage(id, file),
    ...options,
  });
};

export const useDeleteAdmin = (
  options?: UseMutationOptions<DeleteAdminResponse, unknown, { id: number }>
) => {
  return useMutation<DeleteAdminResponse, unknown, { id: number }>({
    mutationFn: ({ id }) => deleteAdmin(id),
    ...options,
  });
};

/**
 * ✅ v2 Soft Delete — sets is_active=0, deleted_at=NOW(), increments token_version.
 * Use this instead of useDeleteAdmin for the admin list page.
 */
export const useSoftDeleteAdmin = (
  options?: UseMutationOptions<{ success: true; id: number; message: string }, unknown, { id: number }>
) => {
  return useMutation<{ success: true; id: number; message: string }, unknown, { id: number }>({
    mutationFn: ({ id }) => softDeleteAdmin(id),
    ...options,
  });
};
