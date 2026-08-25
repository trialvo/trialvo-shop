"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorBannerClass, authLabelClass, authLinkClass, authPrimaryBtnClass } from "./auth-ui";

import AuthDivider from "./AuthDivider";
import GoogleAuthButton from "./GoogleAuthButton";
import PasswordInput from "./PasswordInput";

import { useAuth } from "@/hooks/useAuth";
import { useClientIp } from "@/hooks/useClientIp";
import { useGoogleCodeClient } from "@/hooks/useGoogleCodeClient";
import { useTranslation } from "@/hooks/useTranslation";
import { signInSchema, type SignInValues } from "@/lib/auth-schemas";
import { getWindowOrigin } from "@/lib/config/googleAuth";
import { GOOGLE_CLIENT_ID } from "@/config/env";
import { useRouter } from "next/navigation";

interface SignInCardProps {
  forgotHref?: string;
  createHref?: string;
  shadowClass?: string;
  className?: string;
  onNavigate?: (open: boolean) => void;
  redirectToCheckout?: boolean;
}

const SignInCard: React.FC<SignInCardProps> = ({
  forgotHref = "/forgot-password",
  createHref = "/sign-up",
  shadowClass,
  className,
  onNavigate,
  redirectToCheckout = false,
}) => {
  const router = useRouter();
  const { ip } = useClientIp();
  const { t } = useTranslation();

  const { signIn, isSigningIn, error, clearError, gauthLogin, isGoogleSigningIn } = useAuth();

  // Tracks the "email not verified" 403 state so we can show a targeted CTA
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const dismissUnverified = () => setUnverifiedEmail(null);

  const onSubmit = async (data: SignInValues) => {
    dismissUnverified();
    const signInData = {
      email: data?.email,
      password: data?.password,
      ip: ip ?? ""
    };
    try {
      const res = await signIn(signInData);

      if (res?.flag === 403) {
        // Email is not verified — store email and surface a targeted CTA
        localStorage.setItem("registrationEmail", data.email);
        localStorage.removeItem("submit_type");
        setUnverifiedEmail(data.email);
        return res;
      }

      if (res?.success) {
        onNavigate?.(false);
        setTimeout(() => {
          router.push(redirectToCheckout ? "/checkout" : "/");
        }, 100);
      }

      return res;
    } catch {
      // handled in hook
    }
  };

  const { ready, requestCode, isRequesting } = useGoogleCodeClient({
    clientId: GOOGLE_CLIENT_ID ?? "",
    onAuth: async (payload) => {
      const res = await gauthLogin({
        code: payload.code,
        idToken: payload.idToken,
        redirectUri: getWindowOrigin(),
      });

      if (res?.success) {
        onNavigate?.(false);
        setTimeout(() => {
          router.push(redirectToCheckout ? "/checkout" : "/");
        }, 100);
      }
    },
    onError: (msg) => {
      void msg;
    },
  });

  return (
    <div className={`w-full ${className ?? ""} ${shadowClass ?? ""}`}>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground min-[576px]:text-[32px]">
            {t("auth.signInTitle")}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emailOrMobile" className={authLabelClass}>
                {t("auth.emailOrMobile")}
              </Label>

              <Input
                id="emailOrMobile"
                placeholder={t("auth.emailOrMobilePlaceholder")}
                aria-invalid={!!errors.email}
                disabled={isSigningIn || isGoogleSigningIn}
                {...register("email", { onChange: dismissUnverified })}
              />

              {errors.email?.message ? <p className="text-[12px] text-destructive">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className={authLabelClass}>
                {t("auth.password")}
              </Label>

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={field.value}
                    onChange={(e) => { dismissUnverified(); field.onChange(e); }}
                    onBlur={field.onBlur}
                    error={errors.password?.message}
                    disabled={isSigningIn || isGoogleSigningIn}
                  />
                )}
              />

              <div className="flex justify-end">
                <Link
                  href={forgotHref}
                  onClick={() => onNavigate?.(false)}
                  className={`text-[12px] ${authLinkClass}`}
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>

            {error && !unverifiedEmail && (
              <div className={authErrorBannerClass} onMouseEnter={clearError}>
                <p className="text-[13px] text-destructive">{error}</p>
              </div>
            )}

            {unverifiedEmail && (
              <div className="rounded-[4px] border border-border bg-muted p-3.5">
                <p className="text-[13px] font-medium text-foreground">
                  Your email address is not verified yet.
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{unverifiedEmail}</span>.
                  Enter that code to activate your account, or request a new one.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("registrationEmail", unverifiedEmail);
                    localStorage.removeItem("submit_type");
                    router.push("/verify-identify");
                  }}
                  className={`mt-3 inline-flex items-center text-[12px] ${authLinkClass}`}
                >
                  Verify my email now →
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSigningIn || isGoogleSigningIn}
              className={authPrimaryBtnClass}
            >
              {isSigningIn ? t("auth.signingIn") : t("common.signIn")}
            </Button>
          </form>

          <AuthDivider />

          <GoogleAuthButton
            onClick={() => requestCode()}
            disabled={!ready || isRequesting || isSigningIn || isGoogleSigningIn}
            label={isGoogleSigningIn || isRequesting ? t("auth.signingIn") : t("auth.continueWithGoogle")}
          />

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {t("auth.dontHaveAccount")}{" "}
            <Link
              href={createHref}
              onClick={() => onNavigate?.(false)}
              className={authLinkClass}
            >
              {t("auth.createAccountTitle")}
            </Link>
          </p>
    </div>
  );
};

export default SignInCard;
