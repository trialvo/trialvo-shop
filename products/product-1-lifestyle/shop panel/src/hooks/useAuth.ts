"use client";

import type {
  ApiResponse,
  ChangePasswordValues,
  ForgotPasswordResponse,
  ForgotPasswordSubmitPayload,
  GoogleAuthInput,
  ResetPasswordValues,
  SetInitialPasswordValues,
  SignInResponse,
  SignUpResponse,
  UpdateProfilePayload,
  User,
  VerifyEmailResponse,
} from "@/lib/api/auth/types";
import { authService } from "@/lib/api/auth/service";
import type { SignInValues, SignUpValues } from "@/lib/validation/auth";
import AuthCookies from "@/lib/auth/cookies";
import {
  type AuthSessionPayload,
  extractAuthSessionPayload,
  extractAuthUser,
  isAuthUser,
} from "@/lib/auth/session-payload";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  initAuth,
  logout as logoutAuthState,
  setAuthUser,
  setError,
  setLoading,
  setSuccess,
} from "@/store/slices/authSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { getUnknownErrorMessage } from "@/lib/api/errors";

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

const pickPayload = <T>(
  res: unknown,
): (ApiResponse<T> & Partial<T>) | undefined => {
  if (isApiResponse<T>(res)) {
    const r = res as ApiResponse<T>;
    if (r.data !== undefined) {
      return r.data as ApiResponse<T> & Partial<T>;
    }
    return res as ApiResponse<T> & Partial<T>;
  }
  return res as ApiResponse<T> & Partial<T>;
};

const subscribeAuth = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("auth:changed", cb);
  return () => window.removeEventListener("auth:changed", cb);
};

const getAuthSnapshot = () =>
  AuthCookies.getSessionMarker() ?? AuthCookies.getToken();
const getAuthServerSnapshot = () => null;

const useAuthToken = () =>
  useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

const getCachedAuthUser = (): User | null => {
  const cached = AuthCookies.getUser<unknown>();
  return isAuthUser(cached) ? cached : null;
};

const persistAuthenticatedUser = (
  session: AuthSessionPayload | null,
  user: User,
) => {
  if (session || AuthCookies.isAuthenticated()) {
    AuthCookies.setSession(session ?? { user });
    return;
  }

  AuthCookies.setUser(user);
};

/**
 * Probes `GET /api/auth/session` to check whether an httpOnly access-token
 * cookie exists.  If it does, the endpoint also re-sets the client-readable
 * session-marker cookie so subsequent renders detect the session instantly.
 */
const probeServerSession = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { authenticated?: boolean };
    return data?.authenticated === true;
  } catch {
    return false;
  }
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const authState = useAppSelector((state) => state.auth);

  const token = useAuthToken();
  const hasSessionMarker = !!token;
  const cachedUser = useMemo(
    () => (hasSessionMarker ? getCachedAuthUser() : null),
    [hasSessionMarker],
  );
  const isAuthenticated = authState.isAuthenticated || hasSessionMarker;

  /**
   * Guard against repeated server probes.  Once the probe has run (or the
   * client-readable marker/token is available), we never probe again during
   * the same page lifecycle.
   */
  const sessionProbed = useRef(false);

  useEffect(() => {
    if (hasSessionMarker && (!authState.isAuthenticated || !authState.isInitialized)) {
      dispatch(initAuth({ isAuthenticated: true, user: cachedUser }));
      return;
    }

    if (!hasSessionMarker && authState.isAuthenticated) {
      dispatch(logoutAuthState());
      return;
    }

    if (!hasSessionMarker && !authState.isInitialized) {
      // No client-readable cookie — the access token may still exist as an
      // httpOnly cookie set by the BFF proxy.  Probe the server once.
      if (sessionProbed.current) {
        dispatch(initAuth({ isAuthenticated: false }));
        return;
      }

      sessionProbed.current = true;

      probeServerSession().then((serverHasToken) => {
        if (serverHasToken) {
          // The server confirmed the httpOnly token exists AND re-set the
          // session marker cookie.  Notify the external store so
          // `useSyncExternalStore` picks up the new marker on the next tick.
          AuthCookies.setSessionMarker();
          dispatch(initAuth({ isAuthenticated: true, user: getCachedAuthUser() }));
        } else {
          dispatch(initAuth({ isAuthenticated: false }));
        }
      });
    }
  }, [
    authState.isAuthenticated,
    authState.isInitialized,
    cachedUser,
    dispatch,
    hasSessionMarker,
  ]);

  const signInMutation = useMutation({
    mutationFn: authService.signIn,
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ApiResponse<SignInResponse>) => {
      const payload = pickPayload<SignInResponse>(res);
      const session = extractAuthSessionPayload(res);
      const user = session?.user ?? extractAuthUser(res);

      if (res?.flag === 403) {
        return;
      }

      if (payload?.error || payload?.success === false) {
        dispatch(setError(payload.error || payload.message || "Sign in failed"));
        return;
      }

      if (user) {
        persistAuthenticatedUser(session, user);
        queryClient.setQueryData<User>(authKeys.user(), user);
        dispatch(setAuthUser(user));
        dispatch(setSuccess("Sign in successful!"));
        return;
      }

      dispatch(setError(payload?.message || "Sign in failed"));
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

      if (res?.flag === 409) {
        return;
      }

      if (payload?.error || payload?.success === false) {
        dispatch(setError(payload.error || payload.message || "Sign up failed"));
        return;
      }
      if (payload?.success === true) {
        const message = payload?.message || "Account created. OTP sent.";
        dispatch(setSuccess(message));
        return;
      }

      dispatch(setError(payload?.message || "Sign up failed"));
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
      const session = extractAuthSessionPayload(res);
      const user = session?.user ?? extractAuthUser(res);

      if (!user) {
        dispatch(setError(res.error || res.message || "Verification failed"));
        return;
      }

      persistAuthenticatedUser(session, user);
      queryClient.setQueryData<User>(authKeys.user(), user);
      dispatch(setAuthUser(user));
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
      const session = extractAuthSessionPayload(res);
      const user = session?.user ?? extractAuthUser(res);

      if (payload?.error || payload?.success === false) {
        dispatch(
          setError(
            payload.error || payload.message || "Google sign in failed",
          ),
        );
        return;
      }

      if (user) {
        persistAuthenticatedUser(session, user);
        queryClient.setQueryData<User>(authKeys.user(), user);
        dispatch(setAuthUser(user));
        dispatch(setSuccess("Signed in with Google!"));
        return;
      }

      dispatch(setError(payload?.message || "Google sign in failed"));
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
        const updatedUser = res.data?.user ?? (res as { user?: User }).user;
        if (updatedUser) {
          AuthCookies.setUser(updatedUser);
          queryClient.setQueryData<User>(authKeys.user(), updatedUser);
          dispatch(setAuthUser(updatedUser));
        }
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
      dispatch(logoutAuthState());
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
      const user = payload?.user ?? res.data?.user ?? extractAuthUser(res);

      if (res?.error) {
        dispatch(setError(res.error || res.message || "Failed to load user"));
        AuthCookies.clearAll();
        dispatch(logoutAuthState());
      }

      if (user) {
        AuthCookies.setUser(user);
        dispatch(setAuthUser(user));
      }

      if (!user) {
        throw new Error(res.error || res.message || "Failed to load user");
      }

      return user;
    },
  });

  useEffect(() => {
    if (!userQuery.isError) return;

    AuthCookies.clearAll();
    dispatch(logoutAuthState());
  }, [dispatch, userQuery.isError]);

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
    user: userQuery.data ?? authState.apiUser ?? cachedUser,
    isAuthenticated,
    isInitialized: authState.isInitialized,

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
