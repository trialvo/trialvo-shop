// src/pages/admins/types.ts
// ✅ Updated for dynamic roles from API + createAdmin multipart support

// UI role label is now dynamic (no hard-coded union)
export type AdminRole = string;

// Backend status is boolean (is_active), but UI can still use these labels
export type AdminStatus = "ACTIVE" | "INACTIVE";

export type ApiRole = {
  id: number;
  name: string; // e.g. "SUPER_ADMIN"
  is_system: 0 | 1;
};

export type AdminApiRow = {
  id: number;
  email: string;

  roles: string[]; // backend returns array of role names (e.g. ["ORDER_MANAGER"])
  first_name: string | null;
  last_name: string | null;

  phone: string | null;
  address: string | null;

  is_active: boolean;
  created_at?: string;
  last_login_at?: string | null;

  profile_img_path: string | null; // "/uploads/profiles/admins/17/..."
};

export type AdminListRow = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  joinDate: string;
  phone: string;
  status: AdminStatus;
  address: string;
  avatarUrl?: string;
  passwordMasked: string;
};

// ✅ Form model used by CreateAdminPage (UI)
export interface CreateAdminForm {
  // UI fields
  name: string; // will be split into first_name + last_name
  email: string;

  role: AdminRole; // label shown in Select (derived from roles API)
  joinDate: string; // your DatePicker value (string)
  phone: string;

  // optional extra fields
  address: string;
  note: string;

  // UI status (will convert to is_active boolean)
  status: AdminStatus;

  password: string;
  confirmPassword: string;

  // image upload
  avatarFile: File | null;
  avatarPreviewUrl: string; // object URL
}

// ✅ Helpers (optional but useful everywhere)
export const statusToIsActive = (status: AdminStatus) => status === "ACTIVE";
export const isActiveToStatus = (is_active: boolean): AdminStatus =>
  is_active ? "ACTIVE" : "INACTIVE";

// "SUPER_ADMIN" -> "Super Admin"
export const roleNameToLabel = (name?: string | null): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
};

// "Super Admin" -> "SUPER_ADMIN"
export const roleLabelToName = (label?: string | null): string => {
  if (!label) return "";
  return label.trim().toUpperCase().replace(/\s+/g, "_");
};

// Role label -> role_id mapping used by update requests.
export const ROLE_ID_BY_LABEL: Record<string, number> = {
  "Super Admin": 1,
  Admin: 2,
  Manager: 3,
  "Sales Executive": 4,
  "Employee Currier": 5,
  "Order Manager": 6,
  "Product Manager": 7,
  "Catalog Manager": 8,
  "Read Only Admin": 9,
};
