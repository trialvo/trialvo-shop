"use client";

import {
  AccountVerificationForm,
  AuthModeTabs,
  CreateAccountForm,
  GoogleAuthButton,
  LoginForm,
  type AuthMode,
} from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCodeClient } from "@/hooks/useGoogleCodeClient";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import type {
  ApiResponse,
  SignInResponse,
  SignUpResponse,
  VerifyEmailResponse,
} from "@/lib/api/auth/types";
import type { SignInValues, SignUpValues } from "@/lib/validation/auth";
import { GOOGLE_BROWSER_CLIENT_ID } from "@/lib/config/googleClient";
import { getWindowOrigin } from "@/lib/config/googleAuth";
import { isAuthUser } from "@/lib/auth/session-payload";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

const getApiResponseMessage = <T,>(
  response: ApiResponse<T>,
  fallback: string,
) => response.error || response.message || fallback;

const hasSignedIn = (response: ApiResponse<SignInResponse>) =>
  response.success === true &&
  isAuthUser(response.user ?? response.data?.user);

const hasSignedUp = (response: ApiResponse<SignUpResponse>) =>
  response.success === true;

const hasVerifiedAccount = (response: ApiResponse<VerifyEmailResponse>) =>
  response.success === true &&
  isAuthUser(response.user ?? response.data?.user);

const toSafeRedirectPath = (value: string | null) => {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
};

const getRedirectAfterAuth = () => {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  return toSafeRedirectPath(params.get("next"));
};

const VERIFICATION_EMAIL_STORAGE_KEY = "registrationEmail";

const getInitialVerificationEmail = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(VERIFICATION_EMAIL_STORAGE_KEY);
};

function AuthPageContent() {
  const searchParams = useSearchParams();
  const initialMode: AuthMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(getInitialVerificationEmail);

  const router = useRouter();
  const {
    signIn,
    signUp,
    gauthLogin,
    verifyIdentity,
    sendVerifyOTP,
    isSigningIn,
    isSigningUp,
    isGoogleSigningIn,
    isVerifyingIdentity,
    isSendingVerifyOTP,
    clearError,
    clearSuccess,
  } = useAuth();

  const resetNotices = () => {
    clearError();
    clearSuccess();
  };

  const handleModeChange = (nextMode: AuthMode) => {
    resetNotices();
    setMode(nextMode);

    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === "signup") {
      params.set("mode", "signup");
    } else {
      params.delete("mode");
    }
    const query = params.toString();
    router.replace(query ? `/auth?${query}` : "/auth", { scroll: false });
  };

  const startVerification = (email: string) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setPendingVerificationEmail(normalizedEmail);
    window.sessionStorage.setItem(
      VERIFICATION_EMAIL_STORAGE_KEY,
      normalizedEmail,
    );
  };

  const clearVerification = () => {
    setPendingVerificationEmail(null);
    window.sessionStorage.removeItem(VERIFICATION_EMAIL_STORAGE_KEY);
  };

  const handleGoogleLogin = async (code: string, state: string) => {
    resetNotices();

    try {
      const response = await gauthLogin({
        code,
        state,
        redirectUri: getWindowOrigin(),
      });

      if (hasSignedIn(response)) {
        toast.success("Signed in with Google!");
        router.push(getRedirectAfterAuth());
        return;
      }

      toast.error(getApiResponseMessage(response, "Google sign-in failed."));
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Google sign-in failed."));
    }
  };

  const {
    ready: isGoogleReady,
    requestCode: requestGoogleCode,
    isRequesting: isGoogleRequesting,
  } = useGoogleCodeClient({
    clientId: GOOGLE_BROWSER_CLIENT_ID,
    onAuth: ({ code, state }) => handleGoogleLogin(code, state),
    onError: (message) => toast.error(message),
  });

  const handleLogin = async (values: SignInValues) => {
    resetNotices();

    try {
      const response = await signIn(values);

      if (response.flag === 403) {
        const message = getApiResponseMessage(
          response,
          "Please verify your email address before signing in.",
        );
        if (values.email.includes("@")) {
          startVerification(values.email);
        }
        toast.error(message);
        return;
      }

      if (hasSignedIn(response)) {
        toast.success("Welcome back!");
        router.push(getRedirectAfterAuth());
        return;
      }

      toast.error(
        getApiResponseMessage(
          response,
          "Invalid email or password. Please try again.",
        ),
      );
    } catch (error) {
      toast.error(
        getUnknownErrorMessage(
          error,
          "Invalid email or password. Please try again.",
        ),
      );
    }
  };

  const handleSignup = async (values: SignUpValues) => {
    resetNotices();

    try {
      const response = await signUp(values);

      if (response.flag === 409) {
        const message = getApiResponseMessage(
          response,
          "An account with this email already exists.",
        );
        toast.error(message);
        return;
      }

      if (hasSignedUp(response)) {
        const message =
          response.message || "Account created. OTP sent to email.";
        startVerification(values.email);
        toast.success(message);
        return;
      }

      toast.error(getApiResponseMessage(response, "Account creation failed."));
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Account creation failed."));
    }
  };

  const handleVerifyAccount = async (code: string) => {
    if (!pendingVerificationEmail) return;

    resetNotices();

    try {
      const response = await verifyIdentity(code, pendingVerificationEmail);

      if (hasVerifiedAccount(response)) {
        clearVerification();
        toast.success("Account verified successfully!");
        router.push(getRedirectAfterAuth());
        return;
      }

      toast.error(getApiResponseMessage(response, "Verification failed."));
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Verification failed."));
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;

    resetNotices();

    try {
      const response = await sendVerifyOTP(pendingVerificationEmail);

      if (response.error || response.success === false) {
        toast.error(
          getApiResponseMessage(response, "Failed to resend verification code."),
        );
        return;
      }

      toast.success(response.message || "Verification code resent.");
    } catch (error) {
      toast.error(
        getUnknownErrorMessage(error, "Failed to resend verification code."),
      );
    }
  };

  const handleBackToLogin = () => {
    clearVerification();
    setMode("login");
    resetNotices();
  };

  const isSubmitting =
    isSigningIn || isSigningUp || isGoogleSigningIn || isVerifyingIdentity;
  const isGoogleLoading = isGoogleSigningIn || isGoogleRequesting;

  return (
    <div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {pendingVerificationEmail ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-semibold text-foreground lg:text-3xl">
                  Verify Your Email
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the code we sent to finish creating your account.
                </p>
              </div>

              <AccountVerificationForm
                email={pendingVerificationEmail}
                onVerify={handleVerifyAccount}
                onResend={handleResendVerification}
                onBack={handleBackToLogin}
                isSubmitting={isVerifyingIdentity}
                isResending={isSendingVerifyOTP}
              />
            </>
          ) : (
            <>
              <AuthModeTabs
                mode={mode}
                onModeChange={handleModeChange}
                disabled={isSubmitting}
              />

              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-semibold text-foreground lg:text-3xl">
                  {mode === "login" ? "Welcome Back" : "Join LIFESTYLE"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Sign in to access your account"
                    : "Create an account for a personalized experience"}
                </p>
              </div>

              <GoogleAuthButton
                onClick={requestGoogleCode}
                disabled={!isGoogleReady || isSubmitting}
                isLoading={isGoogleLoading}
                label="Continue with Google"
                className="mb-6"
              />

              <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {mode === "login" ? (
                <LoginForm
                  onSubmit={handleLogin}
                  isSubmitting={isSubmitting}
                  onFieldChange={resetNotices}
                />
              ) : (
                <CreateAccountForm
                  onSubmit={handleSignup}
                  isSubmitting={isSubmitting}
                  onFieldChange={resetNotices}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
