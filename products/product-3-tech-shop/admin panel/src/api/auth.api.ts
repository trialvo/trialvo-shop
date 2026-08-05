import { api } from "@/api/client";

export type LoginBody = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  admin: {
    id: number;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
    profile_img_path?: string | null;
    roles: string[];
    permissions: string[];
  };
};

export const adminLogin = async (body: LoginBody) => {
  const { data } = await api.post<LoginResponse>("/admin/login", body);
  return data;
};

// ── Forgot / Reset password ──────────────────────────────────────────────────

export const adminGetForgotPassMethods = async () => {
  const { data } = await api.get<{ success: boolean; email: boolean; sms: boolean }>(
    "/admin/forgotPassMethods"
  );
  return data;
};

export const adminForgotPassword = async (payload: { email?: string; phone?: string }) => {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    email_sent?: boolean;
    sms_sent?: boolean;
  }>("/admin/forgotPassword", payload);
  return data;
};

export const adminResetPassword = async (payload: {
  email?: string;
  phone?: string;
  otp: string;
  new_password: string;
}) => {
  const { data } = await api.post<{ success: boolean; message: string }>(
    "/admin/resetPassword",
    payload
  );
  return data;
};
