"use client";

import type {
  ApiResponse,
  GoogleAuthInput,
  ChangePasswordValues,
  ForgotPasswordSubmitPayload,
  ForgotPasswordResponse,
  ResetPasswordValues,
  SignInResponse,
  SignUpResponse,
  UpdateProfilePayload,
  User,
  VerifyEmailResponse,
} from "@/lib/api/auth/service";
import { authService } from "@/lib/api/auth/service";
import type { SignInValues, SignUpValues } from "@/lib/auth-schemas";
import AuthCookies from "@/lib/auth/cookies";
import { parseAuthUser } from "@/lib/adapters/authUser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { getUnknownErrorMessage } from "@/lib/api/errors";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  forgotMethods: () => [...authKeys.all, "forgot-methods"] as const,
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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Cookie token is client-only — wait one tick so reload shows skeleton, not guest flash
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  const token = useAuthToken();
  // Cookie is readable on the client during hydration, but not on the server.
  // Gate on isAuthReady so SSR HTML and the first client paint always match.
  const isAuthenticated = isAuthReady && !!token;

  const signInMutation = useMutation({
    mutationFn: authService.signIn.bind(authService),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<SignInResponse>) => {
      const payload = pickPayload<SignInResponse>(res);
      if (res?.flag === 403) {
        setError(
          res.error ||
            res.message ||
            payload?.error ||
            "Email not verified. Please verify your email.",
        );
        return;
      }
      if (payload?.error) {
        setError(payload.error || "Sign in failed");
        return;
      }
      if (payload?.success && payload.access_token) {
        const safeUser = parseAuthUser(payload.user);
        AuthCookies.setToken(payload.access_token);
        if (safeUser) {
          AuthCookies.setUser(safeUser);
          queryClient.setQueryData<User>(authKeys.user(), safeUser);
        }
        setSuccess("Sign in successful!");
      }
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Sign in failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const signUpMutation = useMutation({
    mutationFn: authService.signUp.bind(authService),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<SignUpResponse>) => {
      const payload = pickPayload<SignUpResponse>(res);
      if (res?.flag === 409) {
        setError(
          res.error ||
            res.message ||
            "Email already registered. Please sign in.",
        );
        return;
      }
      if (payload?.error) {
        setError(payload.error || "Sign up failed");
        return;
      }
      if (payload?.success || res.success) {
        setSuccess(
          payload?.message || res.message || "Account created. OTP sent.",
        );
      }
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Sign up failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (value: ForgotPasswordSubmitPayload) =>
      authService.forgotPassword(value),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<ForgotPasswordResponse>) => {
      const payload = pickPayload<ForgotPasswordResponse>(res);
      setSuccess(
        payload?.message || res.data?.message || res.message || "OTP sent.",
      );
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "OTP sending failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const verifyForgotOtpMutation = useMutation({
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
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res) => {
      setSuccess(res.message || "OTP verified.");
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Invalid or expired OTP"));
    },
    onSettled: () => setIsLoading(false),
  });

  const verifyIdentityMutation = useMutation({
    mutationFn: ({ otp, email }: { otp: string; email: string }) =>
      authService.verifyEmail(otp, email),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<VerifyEmailResponse>) => {
      const payload = pickPayload<VerifyEmailResponse>(res);
      const token =
        payload?.access_token ||
        (res as unknown as VerifyEmailResponse)?.access_token;
      const user =
        payload?.user || (res as unknown as VerifyEmailResponse)?.user;
      if (!token || !user) {
        setError(res.error || res.message || "Verification failed");
        return;
      }
      const safeUser = parseAuthUser(user);
      AuthCookies.setToken(token);
      if (safeUser) {
        AuthCookies.setUser(safeUser);
        queryClient.setQueryData<User>(authKeys.user(), safeUser);
      }
      setSuccess("Email verified successfully!");
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Verification failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authService.sendVerificationOTP(email),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res) => {
      setSuccess(res.message || "Verification code resent.");
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Failed to resend code"));
    },
    onSettled: () => setIsLoading(false),
  });

  const googleSignInMutation = useMutation({
    mutationFn: (payload: GoogleAuthInput) => authService.googleAuth(payload),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<SignInResponse>) => {
      const payload = pickPayload<SignInResponse>(res);
      if (payload?.error) {
        setError(payload.error || "Google sign in failed");
        return;
      }
      if (payload?.success && payload.access_token) {
        const safeUser = parseAuthUser(payload.user);
        AuthCookies.setToken(payload.access_token);
        if (safeUser) {
          AuthCookies.setUser(safeUser);
          queryClient.setQueryData<User>(authKeys.user(), safeUser);
        }
        setSuccess("Signed in with Google!");
      }
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Google sign in failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (v: ChangePasswordValues) =>
      authService.changePassword(v?.oldPassword ?? "", v?.newPassword),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: () => setSuccess("Password change successful!"),
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Changing password failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (v: ResetPasswordValues) =>
      authService.resetPassword(v.otp, v.new_password, v.email, v.phone_number),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res) => {
      setSuccess(res.message || "Password reset successful!");
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Reset failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authService.updateProfile(payload),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
    },
    onSuccess: (res: ApiResponse<{ user: User }>) => {
      if (res?.error) {
        setError(res.error || "Profile update failed");
        return;
      }
      const payload = pickPayload<{ user: User }>(res);
      const nextUser = parseAuthUser(payload?.user ?? res.data?.user);
      if (nextUser) {
        AuthCookies.setUser(nextUser);
        queryClient.setQueryData<User>(authKeys.user(), nextUser);
      } else {
        void queryClient.invalidateQueries({ queryKey: authKeys.user() });
      }
      if (res?.success) {
        setSuccess(res.message || "Profile updated successfully!");
      }
    },
    onError: (err: unknown) => {
      setError(getUnknownErrorMessage(err, "Profile update failed"));
    },
    onSettled: () => setIsLoading(false),
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authService.signOut();
      } catch {
        /* clear local session anyway */
      }
    },
    onMutate: () => setIsLoading(true),
    onSuccess: () => {
      AuthCookies.clearAll();
      queryClient.removeQueries({ queryKey: authKeys.user() });
      queryClient.setQueryData<User | null>(authKeys.user(), null);
    },
    onSettled: () => setIsLoading(false),
  });

  const forgotMethodsQuery = useQuery({
    queryKey: authKeys.forgotMethods(),
    staleTime: 5 * 60 * 1000,
    queryFn: () => authService.getForgotPassMethods(),
  });

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    // Wait for client cookie hydration so reload always hits loading → skeleton
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<User> => {
      const res = await authService.getCurrentUser();
      const payload = pickPayload<{ user: User }>(res);
      const user = parseAuthUser(payload?.user ?? res.data?.user);
      if (res?.error || !user) {
        setError(res.error || res.message || "Failed to load user");
        AuthCookies.clearAll();
        throw new Error(res.error || res.message || "Failed to load user");
      }
      AuthCookies.setUser(user);
      return user;
    },
  });

  // Skeleton: before cookie hydrate, or while authenticated profile is fetching
  const isUserLoading =
    !isAuthReady || (isAuthenticated && userQuery.isLoading);

  return {
    user: userQuery.data,
    isAuthenticated,
    isAuthReady,
    isUserLoading,
    isLoading: isLoading || isUserLoading,
    error,
    success,
    forgotMethods: forgotMethodsQuery.data ?? { email: true, sms: false },
    signIn: useCallback(
      (data: SignInValues) => signInMutation.mutateAsync(data),
      [signInMutation],
    ),
    signUp: useCallback(
      (data: SignUpValues) => signUpMutation.mutateAsync(data),
      [signUpMutation],
    ),
    gauthLogin: useCallback(
      (payload: GoogleAuthInput) => googleSignInMutation.mutateAsync(payload),
      [googleSignInMutation],
    ),
    verifyIdentity: useCallback(
      (otp: string, email: string) =>
        verifyIdentityMutation.mutateAsync({ otp, email }),
      [verifyIdentityMutation],
    ),
    resendVerification: useCallback(
      (email: string) => resendVerificationMutation.mutateAsync(email),
      [resendVerificationMutation],
    ),
    forgotPassword: useCallback(
      (value: ForgotPasswordSubmitPayload) =>
        forgotPasswordMutation.mutateAsync(value),
      [forgotPasswordMutation],
    ),
    verifyForgotPasswordOtp: useCallback(
      (otp: string, email?: string, phone_number?: string) =>
        verifyForgotOtpMutation.mutateAsync({ otp, email, phone_number }),
      [verifyForgotOtpMutation],
    ),
    resetPassword: useCallback(
      (value: ResetPasswordValues) => resetPasswordMutation.mutateAsync(value),
      [resetPasswordMutation],
    ),
    changePassword: useCallback(
      (value: ChangePasswordValues) =>
        changePasswordMutation.mutateAsync(value),
      [changePasswordMutation],
    ),
    updateProfile: useCallback(
      (payload: UpdateProfilePayload) =>
        updateProfileMutation.mutateAsync(payload),
      [updateProfileMutation],
    ),
    signOut: useCallback(
      () => signOutMutation.mutateAsync(),
      [signOutMutation],
    ),
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
    isSigningIn: signInMutation.isPending,
    isGoogleSigningIn: googleSignInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isPasswordChanging: changePasswordMutation.isPending,
    isVerifying:
      verifyIdentityMutation.isPending || verifyForgotOtpMutation.isPending,
    isSendingOtp:
      forgotPasswordMutation.isPending || resendVerificationMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
