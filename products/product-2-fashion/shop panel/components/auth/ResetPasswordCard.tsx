"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth-schemas";
import { useRouter } from "next/navigation";

export type ResetPasswordCardProps = {
  email?: string;
  signInHref?: string;
};

const ResetPasswordCard: React.FC<ResetPasswordCardProps> = ({
  email = "ohn.doe@email.com",
  signInHref = "/sign-in",
}) => {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const [resetIdentity] = useState<{ email: string; phoneNumber: string; otp: string; }>(() => {
    if (typeof window === "undefined") return { email: "", phoneNumber: "", otp: "" };
    return {
      email: localStorage.getItem("resetEmail") ?? "",
      phoneNumber: localStorage.getItem("phone_number") ?? "",
      otp: localStorage.getItem("resetPassOTP") ?? "",
    };
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    // Send ONLY one identifier — phone takes priority when both exist in localStorage
    const usePhone = Boolean(resetIdentity.phoneNumber);
    const dataToSubmit = {
      otp: resetIdentity?.otp,
      email: usePhone ? undefined : resetIdentity?.email,
      phone_number: usePhone ? resetIdentity?.phoneNumber : undefined,
      new_password: data?.confirmPassword
    };

    const res = await resetPassword(dataToSubmit);

    localStorage.removeItem("resetEmail");
    localStorage.removeItem("resetPassOTP");
    localStorage.removeItem("phone_number");

    if (res?.success) {
      return router?.push("/sign-in");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Card className="rounded-none border-0 mt-10 shadow-[0px_0px_20px_rgba(0,0,0,0.05)]">
        <CardContent className="px-4 py-5">
          <h1 className="mt-5 text-center text-2xl font-extrabold text-black">
            {t("auth.resetPasswordTitle")}
          </h1>

          <p className="mt-2 text-center text-sm text-gray-700">
            For <span className="font-medium text-black">{email}</span>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-7">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-base font-medium text-black">
                {t("auth.newPassword")} <span className="text-red-600">*</span>
              </Label>

              <Controller
                control={control}
                name="newPassword"
                render={({ field }) => (
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    placeholder={t("auth.newPasswordPlaceholder")}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.newPassword?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium text-black">
                {t("auth.confirmPassword")} <span className="text-red-600">*</span>
              </Label>

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.confirmPassword?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {isSubmitting ? t("auth.saving") : t("auth.setNewPassword")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-normal text-black">
            {t("auth.backTo")}{" "}
            <Link href={signInHref} className="font-semibold text-[#0088FF] hover:underline">
              {t("common.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordCard;
