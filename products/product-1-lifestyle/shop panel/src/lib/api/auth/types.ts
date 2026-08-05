import type { AddressItem } from "@/lib/api/address/service";
import type { Address } from "@/types/auth";

export type UserAddress = AddressItem | Address;

export type ForgotPasswordSubmitPayload = {
  email?: string;
  phone_number?: string;
  method?: "email" | "sms";
};

export interface Phone {
  id: number;
  phone_number: string;
  is_verified: boolean | 0 | 1;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  img_path: string | null;
  status: "active" | "inactive" | "suspended" | "pending";
  has_password: boolean;
  gender: "male" | "female" | "unspecified" | "other";
  dob: string | null;
  is_email_verified: boolean;
  is_fully_verified: boolean;
  total_spent: number;
  default_phone: Phone | null | string | number;
  phones: Phone[];
  default_address: UserAddress | null | number;
  addresses: UserAddress[];
}

export type ApiError = {
  flag?: number;
  error?: string;
  message?: string;
};

export type ApiResponse<T = unknown> = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  flag?: number;
} & Partial<T>;

export interface SignUpResponse {
  success: boolean;
  message: string;
}

export interface SignInResponse {
  success: boolean;
  user: User;
  access_token?: string;
}

export type GoogleAuthInput = {
  code?: string;
  idToken?: string;
  redirectUri?: string;
  state?: string;
};

export interface VerifyEmailResponse {
  success: boolean;
  user: User;
  access_token?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordValues {
  otp: string;
  new_password: string;
  email?: string;
  phone_number?: string;
}

export interface ChangePasswordValues {
  oldPassword?: string;
  newPassword: string;
}

export interface SetInitialPasswordValues {
  password: string;
  ip?: string;
}

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: "male" | "female" | "unspecified" | "other" | "";
  dob?: Date | string | null;
  phone?: string;
  profile?: File | null;
};
