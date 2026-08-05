import { api } from "./client";


export type AdminProfileApiResponse = {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;

  profile_img_path: string | null;

  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;

  roles: string[];
};

export type UpdateAdminProfilePayload = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: number;
  new_password: string;
};

// If backend returns "/uploads/..." use the centralized config origin
import { API_ORIGIN, IMAGE_URL } from "@/config/env";

export function toMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!IMAGE_URL) return path;
  return `${IMAGE_URL}${path}`;
}

export async function getAdminProfile(): Promise<AdminProfileApiResponse> {
  const res = await api.get("/admin/profile");
  return res.data;
}

export async function updateAdminProfile(
  payload: UpdateAdminProfilePayload,
): Promise<AdminProfileApiResponse> {
  const res = await api.put("/admin/profile", payload);
  return res.data;
}

export async function adminForgotPassword(payload: ForgotPasswordPayload): Promise<any> {
  const res = await api.post("/admin/forgotPassword", payload);
  return res.data;
}

export async function adminResetPassword(payload: ResetPasswordPayload): Promise<any> {
  const res = await api.post("/admin/resetPassword", payload);
  return res.data;
}
