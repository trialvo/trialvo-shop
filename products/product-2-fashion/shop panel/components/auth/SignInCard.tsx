"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className={`mx-auto w-full max-w-xl px-4 py-10 ${className}`}>
      <Card className={`mt-10 rounded-none border-0 shadow-[0px_0px_20px_rgba(0,0,0,0.05)] ${shadowClass}`}>
        <CardContent className="px-4 py-5">
          <h1 className="mt-5 text-center text-2xl font-extrabold text-black">{t("auth.signInTitle")}</h1>

          <div className="mt-7">
            <GoogleAuthButton
              onClick={() => requestCode()}
              disabled={!ready || isRequesting || isSigningIn || isGoogleSigningIn}
              label={isGoogleSigningIn || isRequesting ? t("auth.signingIn") : t("auth.continueWithGoogle")}
            />
          </div>

          <AuthDivider />

          {/* Generic error banner (wrong password, account inactive, etc.) */}
          {error && !unverifiedEmail && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200" onMouseEnter={clearError}>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email-not-verified banner — shows only on 403 */}
          {unverifiedEmail && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Your email address is not verified yet.
              </p>
              <p className="mt-1 text-xs text-amber-700">
                We sent a 6-digit code to <span className="font-medium">{unverifiedEmail}</span>.
                Enter that code to activate your account, or request a new one.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("registrationEmail", unverifiedEmail);
                  localStorage.removeItem("submit_type");
                  router.push("/verify-identify");
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
              >
                Verify my email now →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailOrMobile" className="text-base font-medium text-black">
                {t("auth.emailOrMobile")} <span className="text-red-600">*</span>
              </Label>

              <Input
                id="emailOrMobile"
                placeholder={t("auth.emailOrMobilePlaceholder")}
                className={`h-12 rounded-none text-base ${errors.email ? "border-red-500" : "border-gray-300"}`}
                aria-invalid={!!errors.email}
                disabled={isSigningIn || isGoogleSigningIn}
                {...register("email", { onChange: dismissUnverified })}
              />

              {errors.email?.message ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-black">
                {t("auth.password")} <span className="text-red-600">*</span>
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
                  className="text-xs font-semibold text-[#0088FF] hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSigningIn || isGoogleSigningIn}
              className="h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {isSigningIn ? t("auth.signingIn") : t("common.signIn")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-normal text-black">
            {t("auth.dontHaveAccount")}{" "}
            <Link
              href={createHref}
              onClick={() => onNavigate?.(false)}
              className="font-semibold text-[#0088FF] hover:underline"
            >
              {t("auth.createAccountTitle")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInCard;
