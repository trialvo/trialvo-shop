"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authLabelClass, authLinkClass, authPrimaryBtnClass } from "@/components/auth/auth-ui";

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
    <div className="w-full">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground min-[576px]:text-[32px]">
            {t("auth.resetPasswordTitle")}
          </h1>

          <p className="mt-1.5 text-[13px] text-muted-foreground">
            For <span className="font-medium text-foreground">{email}</span>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className={authLabelClass}>
                {t("auth.newPassword")}
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className={authLabelClass}>
                {t("auth.confirmPassword")}
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
              className={authPrimaryBtnClass}
            >
              {isSubmitting ? t("auth.saving") : t("auth.setNewPassword")}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {t("auth.backTo")}{" "}
            <Link href={signInHref} className={authLinkClass}>
              {t("common.signIn")}
            </Link>
          </p>
    </div>
  );
};

export default ResetPasswordCard;
