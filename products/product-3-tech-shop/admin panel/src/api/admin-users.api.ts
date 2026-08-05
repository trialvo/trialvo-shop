import { api } from "./client";

export type AdminUserGender = "unspecified" | "male" | "female" | "other";
export type AdminUserStatus = "active" | "inactive" | "suspended";

export type AdminUserPhone = {
  id: number;
  phone_number: string;
  is_verified: boolean | 0 | 1;
};

export type AdminUserAddress = {
  id: number;
  phone_id: number | null;
  name: string | null;
  address_type: string;
  full_address: string;
  city: string | null;
  zip_code: string | null;
  /** true = verified, false = not verified, null = address has no linked phone */
  phone_verified: boolean | null;
};

export type AdminUserEntity = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  img_path: string | null;

  status: AdminUserStatus | string;
  gender: AdminUserGender | string;
  dob: string | null;

  is_email_verified: boolean;
  /** true = default phone is verified (is_fully_verified in DB) */
  is_fully_verified: boolean;
  has_password: boolean;

  total_spent: number;

  /** ID of the default phone row (null = none set) */
  default_phone: number | null;
  phones: AdminUserPhone[];

  /** ID of the default address row */
  default_address: number | null;
  addresses: AdminUserAddress[];

  created_at: string;
  deleted_at: string | null;
};

export type AdminUsersListParams = {
  limit: number;
  offset?: number;
  search?: string;
  status?: string;
  is_deleted?: boolean;
};

export type AdminUsersListResponse = {
  success: true;
  meta: { limit: number; offset: number; total: number };
  users: AdminUserEntity[];
};

export type AdminUserSingleResponse = {
  success: true;
  user: AdminUserEntity;
};

// ---------- helpers ----------
function appendIfDefined(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  fd.append(key, String(value));
}

function buildCreateUserFormData(payload: CreateAdminUserPayload) {
  const fd = new FormData();
  if (payload.user_profile) fd.append("user_profile", payload.user_profile);

  appendIfDefined(fd, "email", payload.email);
  appendIfDefined(fd, "password", payload.password);
  appendIfDefined(fd, "first_name", payload.first_name);
  appendIfDefined(fd, "last_name", payload.last_name);
  appendIfDefined(fd, "gender", payload.gender);
  appendIfDefined(fd, "phone", payload.phone);
  appendIfDefined(fd, "dob", payload.dob);
  appendIfDefined(fd, "is_active", payload.is_active);

  return fd;
}

function buildEditUserFormData(payload: EditAdminUserPayload) {
  const fd = new FormData();
  if (payload.user_profile) fd.append("user_profile", payload.user_profile);

  appendIfDefined(fd, "email", payload.email);
  appendIfDefined(fd, "password", payload.password);
  appendIfDefined(fd, "first_name", payload.first_name);
  appendIfDefined(fd, "last_name", payload.last_name);
  appendIfDefined(fd, "gender", payload.gender);
  appendIfDefined(fd, "phone", payload.phone);
  appendIfDefined(fd, "dob", payload.dob);

  // important: edit uses "status"
  appendIfDefined(fd, "status", payload.status);

  // restore user flag
  if (payload.restore_user === true) {
    fd.append("restore_user", "true");
  }

  return fd;
}

// ---------- API ----------
export async function getAdminUsers(params: AdminUsersListParams): Promise<AdminUsersListResponse> {
  const res = await api.get("/admin/users", { params });
  return res.data as AdminUsersListResponse;
}

export async function getAdminUser(id: number): Promise<AdminUserSingleResponse> {
  const res = await api.get(`/admin/user/${id}`);
  return res.data as AdminUserSingleResponse;
}

export async function deleteAdminUser(id: number): Promise<{ success: true } | any> {
  const res = await api.delete(`/admin/user/${id}`);
  return res.data;
}

// ---------- Create ----------
export type CreateAdminUserPayload = {
  user_profile: File | null;

  email: string;
  password: string;

  first_name: string;
  last_name: string;

  gender: AdminUserGender;
  phone: string;
  dob: string; // YYYY-MM-DD

  is_active: "active" | "inactive";
};

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<any> {
  const fd = buildCreateUserFormData(payload);
  const res = await api.post("/admin/createUser", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ---------- Edit (PATCH-LIKE via FormData) ----------
export type EditAdminUserPayload = {
  user_profile?: File | null;

  email?: string;
  password?: string; // optional

  first_name?: string;
  last_name?: string;

  gender?: AdminUserGender | string;
  phone?: string;
  dob?: string; // YYYY-MM-DD

  status?: AdminUserStatus | string;

  // special
  restore_user?: boolean;
};

export async function editAdminUser(id: number, payload: EditAdminUserPayload): Promise<any> {
  const fd = buildEditUserFormData(payload);
  const res = await api.put(`/admin/editUser/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function restoreAdminUser(id: number): Promise<any> {
  const fd = new FormData();
  fd.append("restore_user", "true");

  const res = await api.put(`/admin/editUser/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateAdminUserStatus(id: number, status: AdminUserStatus): Promise<any> {
  const fd = new FormData();
  fd.append("status", status);

  const res = await api.put(`/admin/editUser/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
