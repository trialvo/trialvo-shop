"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { AuthOtpInput } from "@/components/auth/AuthOtpInput";
import { AuthBackButton, AuthResendTimer } from "@/components/auth/AuthResendTimer";
import { useAuthContext } from "@/context/AuthContext";
import {
  verifyEmailFormSchema,
  type VerifyEmailFormValues,
} from "@/lib/auth-schemas";
import { sanitizeEmail, sanitizeOtp } from "@/lib/security/auth";
import { toast } from "sonner";
import type { AuthMode } from "@/components/auth/types";

type AuthVerifyEmailFormProps = {
  email: string;
  initialOtp?: string;
  onModeChange: (mode: AuthMode, email?: string) => void;
};

export function AuthVerifyEmailForm({
  email: initialEmail,
  initialOtp = "",
  onModeChange,
}: AuthVerifyEmailFormProps) {
  const auth = useAuthContext();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailFormSchema),
    defaultValues: {
      email: initialEmail,
      code: sanitizeOtp(initialOtp),
    },
    mode: "onBlur",
  });

  const emailValue = watch("email");
  const codeValue = watch("code");

  const onSubmit = async (values: VerifyEmailFormValues) => {
    auth.clearError();

    try {
      const res = await auth.verifyIdentity(values.code, values.email);
      if (res?.success || (res as { access_token?: string })?.access_token) {
        toast.success("Email verified! You're signed in.");
        return;
      }
      toast.error(auth.error || "Verification failed");
    } catch {
      toast.error(auth.error || "Verification failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Enter the 6-digit code we sent to your email. It expires in 10 minutes.
      </p>

      <FormAppInput
        control={control}
        name="email"
        label="Email"
        type="email"
        placeholder="email@example.com"
        autoComplete="email"
        sanitize="email"
      />

      <div>
        <p className="text-sm font-medium mb-2 text-center">Verification code</p>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <AuthOtpInput
              value={field.value}
              onChange={(value) => field.onChange(sanitizeOtp(value))}
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
        Verify Email
      </AppButton>

      <AuthResendTimer
        disabled={auth.isSendingOtp || !sanitizeEmail(emailValue || "")}
        onResend={async () => {
          const cleanEmail = sanitizeEmail(emailValue || "");
          if (!cleanEmail) {
            toast.error("Enter your email first");
            return;
          }
          try {
            await auth.resendVerification(cleanEmail);
            toast.success("A new code has been sent");
          } catch {
            toast.error(auth.error || "Failed to resend code");
          }
        }}
      />

      <AuthBackButton
        onClick={() => onModeChange("signin", sanitizeEmail(emailValue || ""))}
      >
        Back to Sign In
      </AuthBackButton>
    </form>
  );
}
