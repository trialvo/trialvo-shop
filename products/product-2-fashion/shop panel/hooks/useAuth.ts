"use client";

import { ForgotPasswordSubmitPayload } from "@/components/auth/ForgotPasswordCard";
import type {
  ApiResponse,
  GoogleAuthInput,
  ChangePasswordValues,
  ForgotPasswordResponse,
  ResetPasswordValues,
  SetInitialPasswordValues,
  SignInResponse,
  SignUpResponse,
  UpdateProfilePayload,
  User,
  VerifyEmailResponse,
} from "@/lib/api/auth/service";
import { authService } from "@/lib/api/auth/service";
import type { SignInValues, SignUpValues } from "@/lib/auth-schemas";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setError, setLoading, setSuccess } from "@/redux/slices/authSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useCallback, useSyncExternalStore } from "react";

import {
  type ApiErrorResponse,
  getAxiosErrorMessage,
  getUnknownErrorMessage,
} from "@/lib/api/errors";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isApiResponse = <T>(v: unknown): v is ApiResponse<T> => {
  if (!isPlainObject(v)) return false;
  return (
    "data" in v ||
    "success" in v ||
    "error" in v ||
    "message" in v ||
    "flag" in v
  );
};

const pickPayload = <T>(res: unknown): T | undefined => {
  if (isApiResponse<T>(res)) {
    const r = res as ApiResponse<T>;
    if (r.data !== undefined) return r.data;
    return res as unknown as T;
  }
  return res as T;
};

const subscribeAuth = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("auth:changed", cb);
  return () => window.removeEventListener("auth:changed", cb);
};

const getAuthSnapshot = () => AuthCookies.getToken();
const getAuthServerSnapshot = () => null;

const useAuthToken = () =>
  useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const authState = useAppSelector((state) => state.auth);

  const token = useAuthToken();
  const isAuthenticated = !!token;

  const signInMutation = useMutation({
    mutationFn: authService.signIn,
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<SignInResponse>) => {
      const payload = pickPayload<SignInResponse>(res);

      // 403 flag = email not verified; SignInCard shows its own targeted banner.
      // Don't push to Redux error so the generic red banner doesn't also appear.
      if (res?.flag === 403) {
        return;
      }

      if (payload?.error) {
        dispatch(setError(payload.error || "Sign in failed"));
        return;
      }

      if (payload?.success) {
        AuthCookies.setToken(payload.access_token);
        AuthCookies.setUser(payload.user);
        queryClient.setQueryData<User>(authKeys.user(), payload.user);
        dispatch(setSuccess("Sign in successful!"));
      }
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Sign in failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });


  const signUpMutation = useMutation({
    mutationFn: authService.signUp,
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<SignUpResponse>) => {
      const payload = pickPayload<SignUpResponse>(res);

      // 409 flag = email already registered and verified;
      // CreateAccountCard shows its own "sign in instead" banner.
      if (res?.flag === 409) {
        return;
      }

      if (payload?.error) {
        dispatch(setError(payload.error || "Sign up failed"));
        return;
      }
      if (payload?.success) {
        const message = payload?.message || "Account created. OTP sent.";

        dispatch(setSuccess(message));
      }
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Sign up failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });


  const forgotPasswordMutation = useMutation({
    mutationFn: (value: ForgotPasswordSubmitPayload) =>
      authService.forgotPassword(value),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<ForgotPasswordResponse>) => {
      const payload = pickPayload<ForgotPasswordResponse>(res);
      const message =
        payload?.message || res.data?.message || res.message || "OTP sent.";
      dispatch(setSuccess(message));
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "OTP sending failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const verifyIdentityMutation = useMutation({
    mutationFn: ({ otp, email }: { otp: string; email: string }) =>
      authService.verifyEmail(otp, email),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<VerifyEmailResponse>) => {
      const payload = pickPayload<VerifyEmailResponse>(res);

      if (!payload) {
        dispatch(setError(res.error || res.message || "Verification failed"));
        return;
      }

      AuthCookies.setToken(payload.access_token);
      AuthCookies.setUser(payload.user);

      queryClient.setQueryData<User>(authKeys.user(), payload.user);

      dispatch(setSuccess("Verified successfully!"));
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Verification failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const googleSignInMutation = useMutation({
    mutationFn: (payload: GoogleAuthInput) => authService.googleAuth(payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<SignInResponse>) => {
      const payload = pickPayload<SignInResponse>(res);

      if (payload?.error) {
        dispatch(setError(payload.error || "Google sign in failed"));
        return;
      }

      if (payload?.success) {
        AuthCookies.setToken(payload.access_token);
        AuthCookies.setUser(payload.user);
        queryClient.setQueryData<User>(authKeys.user(), payload.user);
        dispatch(setSuccess("Signed in with Google!"));
      }
    },
    onError: (error: unknown) => {
      dispatch(
        setError(getUnknownErrorMessage(error, "Google sign in failed")),
      );
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const sendVerificationOTPMutation = useMutation({
    mutationFn: ({ email }: { email: string }) =>
      authService.sendVerificationOTP(email),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<VerifyEmailResponse>) => {
      // This is a RESEND OTP call — it only returns { success, message }.
      // Do NOT set auth cookies or user state here; the user is not yet verified.
      if (res?.error || res?.message?.toLowerCase().includes("error")) {
        dispatch(setError(res.error || res.message || "Failed to resend code"));
        return;
      }
      dispatch(setSuccess(res.message || "Verification code resent! Check your email."));
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Failed to resend verification code")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },

  });

  const verifyForgotPasswordMutation = useMutation({
    mutationFn: ({
      otp,
      email,
      phone_number,
    }: {
      otp: string;
      email?: string;
      phone_number?: string;
    }) => authService.verifyForgotPasswordEmail(otp, email, phone_number),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<VerifyEmailResponse>) => {
      const payload = pickPayload<VerifyEmailResponse>(res);

      if (!payload) {
        dispatch(setError(res.error || res.message || "Verification failed"));
        return;
      }

      queryClient.setQueryData<User>(authKeys.user(), payload.user);

      dispatch(setSuccess("Verified successfully!"));
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Verification failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (v: ResetPasswordValues) =>
      authService.resetPassword(v.otp, v.new_password, v.email, v.phone_number),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: () => {
      dispatch(setSuccess("Password reset successful!"));
    },
    onError: (error: unknown) => {
      dispatch(setError(getUnknownErrorMessage(error, "Reset failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (v: ChangePasswordValues) =>
      authService.changePassword(v?.oldPassword ?? "", v?.newPassword),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: () => {
      dispatch(setSuccess("Password change successful!"));
    },
    onError: (error: unknown) => {
      dispatch(
        setError(getUnknownErrorMessage(error, "Changing password failed")),
      );
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const setInitialPasswordMutation = useMutation({
    mutationFn: (payload: SetInitialPasswordValues) =>
      authService.setInitialPassword(payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: () => {
      dispatch(setSuccess("Password setup successful!"));
    },
    onError: (error: unknown) => {
      dispatch(
        setError(getUnknownErrorMessage(error, "Password setup failed")),
      );
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authService.updateProfile(payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<{ user: User }>) => {
      if (res?.error) {
        dispatch(setError(res?.error || "Profile update failed"));
        return;
      }

      if (res?.success) {
        dispatch(setSuccess(res.message || "Profile updated successfully!"));
      }
    },
    onError: (error) => {
      dispatch(
        setError(getUnknownErrorMessage(error, "Profile update failed")),
      );
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const signOutMutation = useMutation({
    mutationFn: authService.signOut,
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: () => {
      AuthCookies.clearAll();
      queryClient.removeQueries({ queryKey: authKeys.user() });
      queryClient.setQueryData<User | null>(authKeys.user(), null);
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<User> => {
      const res = await authService.getCurrentUser();

      const payload = pickPayload<{ user: User }>(res);
      const user = payload?.user ?? res.data?.user;

      if (res?.error) {
        dispatch(setError(res.error || res.message || "Failed to load user"));
        AuthCookies.clearAll();
      }

      if (user) {
        AuthCookies.setUser(user);
      }

      if (!user) {
        throw new Error(res.error || res.message || "Failed to load user");
      }

      return user;
    },
  });

  const signIn = useCallback(
    (data: SignInValues) => signInMutation.mutateAsync(data),
    [signInMutation],
  );

  const signUp = useCallback(
    (data: SignUpValues) => signUpMutation.mutateAsync(data),
    [signUpMutation],
  );

  const verifyIdentity = useCallback(
    (otp: string, email: string) =>
      verifyIdentityMutation.mutateAsync({ otp, email }),
    [verifyIdentityMutation],
  );

  const gauthLogin = useCallback(
    (payload: GoogleAuthInput) => googleSignInMutation.mutateAsync(payload),
    [googleSignInMutation],
  );

  const sendVerifyOTP = useCallback(
    (email: string) => sendVerificationOTPMutation.mutateAsync({ email }),
    [sendVerificationOTPMutation],
  );

  const forgotPassword = useCallback(
    (value: ForgotPasswordSubmitPayload) =>
      forgotPasswordMutation.mutateAsync(value),
    [forgotPasswordMutation],
  );

  const verifyForgotPassword = useCallback(
    (otp: string, email?: string, phone_number?: string) =>
      verifyForgotPasswordMutation.mutateAsync({ otp, email, phone_number }),
    [verifyForgotPasswordMutation],
  );

  const resetPassword = useCallback(
    (value: ResetPasswordValues) => resetPasswordMutation.mutateAsync(value),
    [resetPasswordMutation],
  );

  const changePassword = useCallback(
    (value: ChangePasswordValues) => changePasswordMutation.mutateAsync(value),
    [changePasswordMutation],
  );

  const setInitialPassword = useCallback(
    (payload: SetInitialPasswordValues) =>
      setInitialPasswordMutation.mutateAsync(payload),
    [setInitialPasswordMutation],
  );

  const updateProfile = useCallback(
    (payload: UpdateProfilePayload) =>
      updateProfileMutation.mutateAsync(payload),
    [updateProfileMutation],
  );

  const signOut = useCallback(
    () => signOutMutation.mutateAsync(),
    [signOutMutation],
  );

  return {
    user: userQuery.data,
    isAuthenticated,

    isLoading: authState.isLoading || userQuery.isLoading,
    error: authState.error,
    success: authState.success,

    signIn,
    gauthLogin,
    signUp,
    changePassword,
    setInitialPassword,
    verifyIdentity,
    sendVerifyOTP,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    signOut,
    updateProfile,

    clearError: () => dispatch(setError(null)),
    clearSuccess: () => dispatch(setSuccess(null)),

    isSigningIn: signInMutation.isPending,
    isGoogleSigningIn: googleSignInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isPasswordChanging: changePasswordMutation?.isPending,
    isSettingInitialPassword: setInitialPasswordMutation.isPending,
    isSendingVerifyOTP: sendVerificationOTPMutation?.isPending,
    isVerifyingIdentity: verifyIdentityMutation.isPending,
    isSendingOtp: forgotPasswordMutation.isPending,
    isResetingPassword: resetPasswordMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};
