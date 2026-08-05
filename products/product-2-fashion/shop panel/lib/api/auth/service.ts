import { Address } from "@/components/account/types";
import { ForgotPasswordSubmitPayload } from "@/components/auth/ForgotPasswordCard";
import type { SignInValues, SignUpValues } from "@/lib/auth-schemas";
import { GOOGLE_AUTH_API_PATH } from "@/lib/config/googleAuth";
import { toDateString } from "@/lib/utils";
import { api } from "../client";

export interface Phone {
  id: number;
  phone_number: string;
  is_verified: boolean;
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
  default_phone: Phone | null | string;
  phones: Phone[];
  default_address: Address | null;
  addresses: Address[];
}

export type ApiError = {
  flag?: number;
  error?: string;
  message?: string;
};

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  flag?: number;
}

export interface SignUpResponse {
  message: string;
  success?: boolean;
  error?: string;
  flag?: number;
}

export interface SignInResponse {
  user: User;
  access_token: string;
  success?: boolean;
  error?: string;
  flag?: number;
}

export type GoogleAuthInput = {
  code?: string;
  idToken?: string;
  redirectUri?: string;
};

export interface VerifyEmailResponse {
  success: boolean;
  user: User;
  access_token: string;
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
  oldPassword?: string | undefined;
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

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

class AuthService {
  async signIn(data: SignInValues): Promise<ApiResponse<SignInResponse>> {
    try {
      const response = await api.post<ApiResponse<SignInResponse>>(
        "/user/login",
        data,
      );
      return response.data;
    } catch (err) {
      // On 403 with an "email not verified" message, return the structured
      // payload so SignInCard can show a targeted "Verify email" CTA.
      // Any other 403 (e.g. "Account is not active") falls through to the
      // generic error path so the amber banner is not shown incorrectly.
      const axiosErr = err as {
        response?: { status?: number; data?: ApiResponse<SignInResponse> };
      };
      if (axiosErr.response?.status === 403 && axiosErr.response?.data) {
        const msg = (
          axiosErr.response.data.error ||
          axiosErr.response.data.message ||
          ""
        ).toLowerCase();
        const isEmailUnverified =
          msg.includes("not verified") ||
          msg.includes("email not verified") ||
          msg.includes("verify");
        if (isEmailUnverified) {
          return {
            ...axiosErr.response.data,
            flag: 403,
          };
        }
      }
      throw new Error(getServerErrorMessage(err, "Sign in failed"));
    }
  }


  async signUp(data: SignUpValues): Promise<ApiResponse<SignUpResponse>> {
    try {
      const response = await api.post<ApiResponse<SignUpResponse>>(
        "/user",
        data,
      );
      return response.data;
    } catch (err) {
      // On 409 (email already verified / account conflict), return the payload
      // so CreateAccountCard can show a "sign in instead" prompt.
      const axiosErr = err as {
        response?: { status?: number; data?: ApiResponse<SignUpResponse> };
      };
      if (axiosErr.response?.status === 409 && axiosErr.response?.data) {
        return {
          ...axiosErr.response.data,
          flag: 409,
        };
      }
      throw new Error(getServerErrorMessage(err, "Sign up failed"));
    }
  }

  async verifyEmail(
    otp: string,
    email: string,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.post<ApiResponse<VerifyEmailResponse>>(
        "/user/verifyEmailOtp",
        {
          otp,
          email,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Email verification failed"));
    }
  }

  async sendVerificationOTP(
    email: string,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.post<ApiResponse<VerifyEmailResponse>>(
        "/user/resendVerificationOtp",
        {
          email,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Email verification failed"));
    }
  }

  async verifyForgotPasswordEmail(
    otp: string,
    email?: string,
    phone_number?: string,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.post<ApiResponse<VerifyEmailResponse>>(
        "/user/verifyForgotPasswordOtp",
        {
          otp,
          email,
          phone_number,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Email verification failed"));
    }
  }

  async resetPassword(
    otp: string,
    new_password: string,
    email?: string,
    phone_number?: string,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.post<ApiResponse<VerifyEmailResponse>>(
        "/user/resetPasswordbyOtp",
        {
          otp,
          new_password,
          email,
          phone_number,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Email verification failed"));
    }
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.patch<ApiResponse<VerifyEmailResponse>>(
        "/user/changePassword",
        {
          oldPassword,
          newPassword,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Password changing failed"));
    }
  }

  async setInitialPassword(
    payload: SetInitialPasswordValues,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    try {
      const response = await api.patch<ApiResponse<VerifyEmailResponse>>(
        "/user/setInitialPassword",
        {
          password: payload.password,
          ip: payload.ip,
        },
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Password setup failed"));
    }
  }

  async forgotPassword(
    value: ForgotPasswordSubmitPayload,
  ): Promise<ApiResponse<ForgotPasswordResponse>> {
    try {
      const response = await api.post<ApiResponse<ForgotPasswordResponse>>(
        "/user/forgotPassword",
        value,
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Email verification failed"));
    }
  }

  async signOut(): Promise<void> {
    await api.post("/auth/sign-out");
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    try {
      const response =
        await api.get<ApiResponse<{ user: User }>>("/user/profile");
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get user"));
    }
  }

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<ApiResponse<{ user: User }>> {
    try {
      const fd = new FormData();

      if (payload.first_name !== undefined)
        fd.append("first_name", payload.first_name);
      if (payload.last_name !== undefined)
        fd.append("last_name", payload.last_name);
      if (payload.email !== undefined) fd.append("email", payload.email);

      if (payload.gender !== undefined && payload.gender !== "") {
        fd.append("gender", payload.gender);
      }

      if (payload.phone !== undefined) fd.append("phone", payload.phone);

      if (payload.dob !== undefined) {
        if (payload.dob === null || payload.dob === "") {
          fd.append("dob", "");
        } else {
          const dobStr = toDateString(payload.dob);
          fd.append("dob", dobStr);
        }
      }

      if (payload.profile instanceof File) {
        fd.append("profile", payload.profile);
      }

      const response = await api.put<ApiResponse<{ user: User }>>(
        "/user/profile",
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data?.error) throw new Error(response.data.error);

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Profile update failed"));
    }
  }

  async googleAuth(
    input: string | GoogleAuthInput,
  ): Promise<ApiResponse<SignInResponse>> {
    const payload: GoogleAuthInput =
      typeof input === "string"
        ? { code: input }
        : {
            code: input?.code?.trim() || undefined,
            idToken: input?.idToken?.trim() || undefined,
            redirectUri: input?.redirectUri?.trim() || undefined,
          };

    const request = async (): Promise<Response> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        return await fetch(GOOGLE_AUTH_API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    };

    let res: Response;
    try {
      res = await request();
    } catch {
      // Retry once for transient network hiccups seen on some mobile browsers.
      try {
        res = await request();
      } catch {
        throw new Error(
          "Network request failed. Please check your internet and try Google Sign-In again.",
        );
      }
    }

    const data = await parseJsonSafe<ApiResponse<SignInResponse>>(res);

    if (!res.ok) {
      const rawMessage = (data?.error || data?.message || "").trim();
      const message =
        rawMessage && rawMessage.toLowerCase() !== "fetch failed"
          ? rawMessage
          : "Google sign-in service is temporarily unreachable. Please try again.";
      throw new Error(message);
    }

    if (!data) throw new Error("Empty response from Google auth");

    return data;
  }
}

export const authService = new AuthService();
