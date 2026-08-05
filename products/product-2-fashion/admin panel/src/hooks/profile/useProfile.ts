import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  adminForgotPassword,
  adminResetPassword,
  getAdminProfile,
  updateAdminProfile,
  type AdminProfileApiResponse,
  type ForgotPasswordPayload,
  type ResetPasswordPayload,
  type UpdateAdminProfilePayload,
} from "@/api/admin-profile.api";
import { profileKeys } from "./profile.keys";

type AdminProfileQueryOptions = Omit<
  UseQueryOptions<AdminProfileApiResponse, Error>,
  "queryKey" | "queryFn"
>;

export function useAdminProfile(options?: AdminProfileQueryOptions) {
  return useQuery({
    queryKey: profileKeys.admin(),
    queryFn: getAdminProfile,
    staleTime: 30_000,
    ...options,
  });
}

export function useUpdateAdminProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAdminProfilePayload) => updateAdminProfile(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileKeys.admin() });
      toast.success("Profile updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    },
  });
}

export function useAdminForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => adminForgotPassword(payload),
    onSuccess: (data) => {
      if (data?.success === false) {
        toast.error(data?.message || "Failed to send OTP.");
        return;
      }
      toast.success(data?.message || "OTP sent to your email.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send OTP.");
    },
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => adminResetPassword(payload),
    onSuccess: (data) => {
      if (data?.success === true) {
        toast.success(data?.message || "Password updated successfully.");
        return;
      }
      if (data?.flag === 100 || data?.error) {
        toast.error(data?.error || data?.message || "Failed to reset password.");
        return;
      }
      toast.error(data?.message || "Failed to reset password.");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error || err?.response?.data?.message || "Failed to reset password."
      );
    },
  });
}
