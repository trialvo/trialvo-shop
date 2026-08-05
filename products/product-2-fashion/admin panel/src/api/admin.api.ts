import { api } from "@/api/client";

export type AdminListResponse = {
  data: Array<{
    id: number;
    email: string;
    is_active: boolean;
    roles: string[];
    created_at: string;
    last_login_at: string | null;
    profile_img_path: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    address: string | null;
    deleted_at: string | null;
  }>;
  limit: number;
  offset: number;
  total: number;
};

export type AdminByIdResponse = {
  id: number;
  email: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  last_login_at: string | null;
  profile_img_path: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
};

export type CreateAdminBody = {
  email: string;
  password: string;
  role_id: number;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean; // default true
};

export type CreateAdminPayload = CreateAdminBody & {
  profile?: File | null; // ✅ file key must be "profile"
};

export type CreateAdminResponse = {
  id: number;
  email: string;
  roles: string[];
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  profile_img_path: string | null;
};

export type UpdateAdminBody = {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  role_id?: number;
  is_active?: boolean;
  password?: string;
};

export type UpdateAdminResponse = {
  success: boolean;
  id: number;
  relogin_required?: boolean;
  changes?: Record<string, unknown>;
};

export type UploadProfileImageResponse = {
  admin_id: number;
  profile_img_path: string;
};

export type DeleteAdminResponse = {
  success: boolean;
  id?: number;
  message?: string;
};

export const getAdmins = async (params: {
  role?: string;
  email?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) => {
  const { data } = await api.get<AdminListResponse>("/admin/getAdmins", {
    params,
  });
  return data;
};

export const getAdminById = async (id: number) => {
  const { data } = await api.get<AdminByIdResponse>(
    `/admin/getAdminById/${id}`
  );
  return data;
};

function appendIfPresent(fd: FormData, key: string, v: unknown) {
  if (v === undefined || v === null) return;
  if (typeof v === "string" && v.trim() === "") return;
  fd.append(key, String(v));
}

export const createAdmin = async (payload: CreateAdminPayload) => {
  const fd = new FormData();

  // file key must be "profile"
  if (payload.profile) {
    fd.append("profile", payload.profile);
  }

  // required
  fd.append("email", payload.email);
  fd.append("password", payload.password);
  fd.append("role_id", String(payload.role_id));

  // optional
  appendIfPresent(fd, "first_name", payload.first_name);
  appendIfPresent(fd, "last_name", payload.last_name);
  appendIfPresent(fd, "phone", payload.phone);
  appendIfPresent(fd, "address", payload.address);

  // boolean -> form-data text (backend usually accepts "true"/"false")
  if (payload.is_active !== undefined) {
    fd.append("is_active", payload.is_active ? "true" : "false");
  }

  const { data } = await api.post<CreateAdminResponse>(
    "/admin/createAdmin",
    fd
  );
  return data;
};

export const updateAdmin = async (id: number, body: UpdateAdminBody) => {
  const { data } = await api.put<UpdateAdminResponse>(
    `/admin/update/${id}`,
    body
  );
  return data;
};

export const uploadProfileImage = async (id: number, file: File) => {
  const fd = new FormData();
  fd.append("profile", file);
  const { data } = await api.post<UploadProfileImageResponse>(
    `/admin/uploadProfileImage/${id}`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
};

/**
 * Hard delete admin (legacy, prefer soft-delete for v2)
 */
export const deleteAdmin = async (id: number) => {
  const { data } = await api.delete<DeleteAdminResponse>(`/admin/user/${id}`);
  return data;
};

/**
 * ✅ Soft delete admin (v2)
 * Sets is_active=0, deleted_at=NOW(), increments token_version
 * Rules: cannot self-delete, cannot delete SUPER_ADMIN, ADMIN cannot delete ADMIN
 */
export const softDeleteAdmin = async (id: number) => {
  const { data } = await api.delete<{ success: true; id: number; message: string }>(
    `/admin/soft-delete/${id}`
  );
  return data;
};
