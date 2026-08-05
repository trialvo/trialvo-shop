"use client";

import { useCallback, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  type VerifyIdentityValues,
  verifyIdentitySchema,
} from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { OtpInputGroup } from "./OtpInputGroup";

const OTP_LENGTH = 6;

interface AccountVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  isResending?: boolean;
}

export function AccountVerificationForm({
  email,
  onVerify,
  onResend,
  onBack,
  isSubmitting = false,
  isResending = false,
}: AccountVerificationFormProps) {
  const [digits, setDigits] = useState<string[]>(
    Array.from<string>({ length: OTP_LENGTH }).fill(""),
  );

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyIdentityValues>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: { code: "" },
  });

  const handleDigitsChange = useCallback(
    (next: string[]) => {
      setDigits(next);
      setValue("code", next.join(""), {
        shouldValidate: next.every(Boolean),
      });
    },
    [setValue],
  );

  const handleValidSubmit: SubmitHandler<VerifyIdentityValues> = async ({
    code,
  }) => {
    await onVerify(code);
  };

  const otpComplete = digits.every(Boolean);
  const disabled = isSubmitting || isResending;

  return (
    <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-6" noValidate>
      <p className="text-sm leading-relaxed text-muted-foreground">
        We sent a 6-digit verification code to{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>

      <OtpInputGroup
        value={digits}
        onChange={handleDigitsChange}
        error={errors.code?.message}
        disabled={disabled}
      />

      <AuthSubmitButton
        isLoading={isSubmitting}
        disabled={!otpComplete || disabled}
        label="Verify Account"
        trailingIcon={<ArrowRight size={14} />}
      />

      <div className="flex items-center justify-between gap-4 text-xs">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={disabled}
          className="h-auto bg-transparent p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Back to sign in
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onResend}
          disabled={disabled}
          className="h-auto bg-transparent p-0 text-accent hover:bg-transparent hover:text-accent/80"
        >
          {isResending ? "Sending..." : "Resend code"}
        </Button>
      </div>
    </form>
  );
}
