"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { AuthOtpInput } from "@/components/auth/AuthOtpInput";
import { AuthBackButton, AuthResendTimer } from "@/components/auth/AuthResendTimer";
import { useAuthContext } from "@/context/AuthContext";
import {
  forgotPasswordSchema,
  resetPasswordFormSchema,
  verifyIdentitySchema,
  type ForgotPasswordValues,
  type ResetPasswordFormValues,
  type VerifyIdentityValues,
} from "@/lib/auth-schemas";
import {
  isEmailLike,
  normalizeBdMobile,
  sanitizeEmail,
  sanitizeOtp,
  toForgotPasswordPayload,
} from "@/lib/security/auth";
import { toast } from "sonner";
import type { AuthMode } from "@/components/auth/types";

type SharedProps = {
  contact: string;
  onContactChange: (value: string) => void;
  otp: string;
  onOtpChange: (value: string) => void;
  onModeChange: (mode: AuthMode, contact?: string) => void;
};

export function AuthForgotRequestForm({
  contact,
  onContactChange,
  onModeChange,
}: Pick<SharedProps, "contact" | "onContactChange" | "onModeChange">) {
  const auth = useAuthContext();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { emailOrMobile: contact },
    mode: "onBlur",
  });

  const placeholder = useMemo(() => {
    if (auth.forgotMethods.sms && auth.forgotMethods.email) {
      return "Email or 01XXXXXXXXX";
    }
    if (auth.forgotMethods.sms) return "01XXXXXXXXX";
    return "email@example.com";
  }, [auth.forgotMethods]);

  const onSubmit = async (values: ForgotPasswordValues) => {
    auth.clearError();
    const payload = toForgotPasswordPayload(values.emailOrMobile);

    if (payload.method === "email" && !auth.forgotMethods.email) {
      setError("emailOrMobile", {
        message: "Email reset is currently unavailable. Try SMS.",
      });
      return;
    }
    if (payload.method === "sms" && !auth.forgotMethods.sms) {
      setError("emailOrMobile", {
        message: "SMS reset is currently unavailable. Use your email.",
      });
      return;
    }

    try {
      await auth.forgotPassword(payload);
      onContactChange(values.emailOrMobile);
      toast.success("OTP sent. Check your inbox or phone.");
      onModeChange("forgot-verify", values.emailOrMobile);
    } catch {
      toast.error(auth.error || "Failed to send OTP");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        We&apos;ll send a 6-digit code to reset your password.
      </p>
      <FormAppInput
        control={control}
        name="emailOrMobile"
        label={
          auth.forgotMethods.sms && auth.forgotMethods.email
            ? "Email or Mobile"
            : auth.forgotMethods.sms
              ? "Mobile"
              : "Email"
        }
        placeholder={placeholder}
        autoComplete="username"
        sanitize="text"
        maxLength={254}
      />
      <AppButton
        type="submit"
        fullWidth
        isLoading={auth.isSendingOtp || isSubmitting}
      >
        Send OTP
      </AppButton>
      <AuthBackButton onClick={() => onModeChange("signin")}>
        Back to Sign In
      </AuthBackButton>
    </form>
  );
}

export function AuthForgotVerifyForm({
  contact,
  otp,
  onOtpChange,
  onModeChange,
}: SharedProps) {
  const auth = useAuthContext();
  const payload = toForgotPasswordPayload(contact);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<VerifyIdentityValues>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: { code: sanitizeOtp(otp) },
    mode: "onBlur",
  });

  const codeValue = watch("code");

  const onSubmit = async (values: VerifyIdentityValues) => {
    auth.clearError();

    try {
      await auth.verifyForgotPasswordOtp(
        values.code,
        payload.email,
        payload.phone_number,
      );
      onOtpChange(values.code);
      toast.success("OTP verified");
      onModeChange("forgot-reset", contact);
    } catch {
      toast.error(auth.error || "Invalid or expired OTP");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Enter the code sent to{" "}
        <span className="font-medium text-foreground">{contact}</span>
      </p>
      <div>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <AuthOtpInput
              value={field.value}
              onChange={(value) => {
                const next = sanitizeOtp(value);
                field.onChange(next);
                onOtpChange(next);
              }}
              autoFocus
            />
          )}
        />
        {errors.code ? (
          <p className="text-[11px] text-destructive mt-2 text-center" role="alert">
            {errors.code.message}
          </p>
        ) : null}
      </div>
      <AppButton
        type="submit"
        fullWidth
        isLoading={auth.isVerifying || isSubmitting}
        disabled={codeValue?.length !== 6}
      >
        Verify OTP
      </AppButton>
      <AuthResendTimer
        disabled={auth.isSendingOtp}
        onResend={async () => {
          try {
            await auth.forgotPassword(payload);
            toast.success("A new code has been sent");
          } catch {
            toast.error(auth.error || "Failed to resend code");
          }
        }}
      />
      <AuthBackButton onClick={() => onModeChange("forgot-request", contact)}>
        Change email / phone
      </AuthBackButton>
    </form>
  );
}

export function AuthForgotResetForm({
  contact,
  otp,
  onModeChange,
}: Omit<SharedProps, "onContactChange" | "onOtpChange">) {
  const auth = useAuthContext();
  const payload = toForgotPasswordPayload(contact);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    auth.clearError();

    const cleanOtp = sanitizeOtp(otp);
    if (cleanOtp.length !== 6) {
      toast.error("OTP missing — go back and verify again");
      onModeChange("forgot-verify", contact);
      return;
    }

    try {
      await auth.resetPassword({
        otp: cleanOtp,
        new_password: values.newPassword,
        email: payload.email,
        phone_number: payload.phone_number,
      });
      toast.success("Password updated. Please sign in.");
      onModeChange(
        "signin",
        payload.email ||
          (isEmailLike(contact) ? sanitizeEmail(contact) : undefined),
      );
    } catch {
      toast.error(auth.error || "Password reset failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Choose a new password for{" "}
        <span className="font-medium text-foreground">
          {payload.email || normalizeBdMobile(contact)}
        </span>
      </p>

      <FormAppInput
        control={control}
        name="newPassword"
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="8–20 characters"
        passwordToggle
        sanitize="password"
        maxLength={20}
      />

      <FormAppInput
        control={control}
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat password"
        sanitize="password"
        maxLength={20}
      />

      <AppButton
        type="submit"
        fullWidth
        isLoading={auth.isResettingPassword || isSubmitting}
      >
        Update Password
      </AppButton>
      <AuthBackButton onClick={() => onModeChange("forgot-verify", contact)}>
        Back
      </AuthBackButton>
    </form>
  );
}
