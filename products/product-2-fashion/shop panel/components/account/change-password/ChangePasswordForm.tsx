"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useClientIp } from "@/hooks/useClientIp";
import { useLogout } from "@/hooks/useLogout";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { FiEye, FiEyeOff } from "react-icons/fi";

type Props = {
  className?: string;
  hasPassword?: boolean;
  onNavigate?: (open: boolean) => void;
};

const ChangePasswordForm: React.FC<Props> = ({
  className,
  hasPassword = false,
  onNavigate,
}) => {
  const { t } = useTranslation();

  const schema = z
    .object({
      oldPassword: hasPassword
        ? z.string().min(1, "Old password is required")
        : z.string().optional().or(z.literal("")),
      newPassword: z.string().min(6, "Password must be at least 8 characters"),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  type ChangePasswordValues = z.infer<typeof schema>;

  const {
    changePassword,
    setInitialPassword,
    isPasswordChanging,
    isSettingInitialPassword,
    user,
  } = useAuth();
  const { ip } = useClientIp();
  const logout = useLogout();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const [showOld, setShowOld] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleSubmit = async (data: ChangePasswordValues) => {
    const dataToSubmit = {
      oldPassword: data?.oldPassword,
      newPassword: data?.confirmPassword,
    };

    const res = user?.has_password
      ? await changePassword(dataToSubmit)
      : await setInitialPassword({ password: data.confirmPassword, ip: ip ?? undefined });

    form.reset();

    if (!onNavigate && res?.success) {
      logout();
    }

    if (onNavigate) {
      onNavigate?.(false);
    }
  };

  const inputClass =
    "h-11 rounded-none border-[#CBCBCB] pr-12 text-sm placeholder:text-[#A0A0A0] focus-visible:ring-0 focus-visible:ring-offset-0";

  const iconBtnClass =
    "absolute inset-y-0 right-3 flex items-center text-[#8A8A8A] hover:text-black";

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(handleSubmit)(e);
        }}
        className={cn("max-w-none space-y-3", className)}
      >
        {hasPassword && (
          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-black">
                  {t("account.changePassword.oldPassword")} <span className="text-[#FF383C]">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showOld ? "text" : "password"}
                      placeholder={t("account.changePassword.oldPasswordPlaceholder")}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld((s) => !s)}
                      aria-label={showOld ? "Hide password" : "Show password"}
                      className={iconBtnClass}
                    >
                      {showOld ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-black">
                {t("account.changePassword.newPassword")} <span className="text-[#FF383C]">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showNew ? "text" : "password"}
                    placeholder={t("account.changePassword.newPasswordPlaceholder")}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className={iconBtnClass}
                  >
                    {showNew ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-black">
                {t("account.changePassword.confirmPassword")} <span className="text-[#FF383C]">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirm ? "text" : "password"}
                    placeholder={t("account.changePassword.confirmPasswordPlaceholder")}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className={iconBtnClass}
                  >
                    {showConfirm ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-none border-[#999999] px-8 text-sm font-medium"
            onClick={() => {
              form.reset();
              if (onNavigate) {
                onNavigate?.(false);
              }
            }}
          >
            {t("account.changePassword.cancel")}
          </Button>

          <Button
            type="submit"
            disabled={isPasswordChanging || isSettingInitialPassword}
            className="h-10 rounded-none bg-black px-8 text-sm font-medium text-white hover:bg-black/90"
          >
            {isPasswordChanging || isSettingInitialPassword
              ? t("account.changePassword.changingPassword")
              : t("account.changePassword.setNewPassword")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ChangePasswordForm;
