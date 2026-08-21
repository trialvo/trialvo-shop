"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authLinkClass, authPrimaryBtnClass } from "@/components/auth/auth-ui";

import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { verifyIdentitySchema, type VerifyIdentityValues } from "@/lib/auth-schemas";


export type VerificationIdentityCardProps = {
  maskedTarget?: string;
  length?: number;
  onResend?: () => void;
  onVerify?: (code: string) => Promise<void> | void;
  signInHref?: string;
  cardClass?: string;
  initialOtp?: string;
};

const VerificationIdentityCard: React.FC<VerificationIdentityCardProps> = ({
  maskedTarget,
  length = 6,
  onResend,
  onVerify,
  signInHref = "/sign-in",
  cardClass,
  initialOtp = ""
}) => {
  const { t } = useTranslation();
  const displayTarget = maskedTarget?.trim() ? maskedTarget : "";
  const { isAuthenticated } = useAuth();

  const hasAutoVerifiedRef = useRef(false);
  const hasSetInitialValueRef = useRef(false);
  const onVerifyRef = useRef(onVerify);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
    watch
  } = useForm<VerifyIdentityValues>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const currentCode = watch("code");

  useEffect(() => {
    if (initialOtp && initialOtp.length === length && !hasSetInitialValueRef.current) {
      hasSetInitialValueRef.current = true;
      setValue("code", initialOtp, { shouldValidate: true });
    }
  }, [initialOtp, length, setValue]);

  useEffect(() => {
    const autoVerify = async () => {
      if (!initialOtp ||
        currentCode !== initialOtp ||
        hasAutoVerifiedRef.current ||
        initialOtp.length !== length) {
        return;
      }

      hasAutoVerifiedRef.current = true;

      await new Promise(resolve => setTimeout(resolve, 50));

      const isValid = await trigger();

      if (isValid && onVerifyRef.current) {
        try {
          await onVerifyRef.current(initialOtp);
        } catch (error) {
          console.error("Auto-verification failed:", error);
          hasAutoVerifiedRef.current = false;
        }
      }
    };

    autoVerify();
  }, [currentCode, initialOtp, length, trigger]);



  const onSubmit = useCallback(async (data: VerifyIdentityValues) => {
    if (onVerify) {
      await onVerify(data.code);
    }
  }, [onVerify]);

  return (
    <div className={`w-full ${cardClass ?? ""}`}>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground min-[576px]:text-[32px]">
            {t("auth.verifyIdentityTitle")}
          </h1>

          <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
            {t("auth.verifyDesc1")} {length}-{t("auth.verifyDesc2")}{" "}
            <span className="font-medium text-foreground">{displayTarget}</span>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
            <div className="flex justify-center">
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <InputOTP
                    maxLength={length}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputMode="numeric"
                    pattern="^[0-9]+$"
                    containerClassName="justify-center"
                    disabled={isSubmitting}
                    autoComplete="one-time-code"
                  >
                    <InputOTPGroup className="gap-2 min-[576px]:gap-2.5">
                      {Array.from({ length }).map((_, idx) => (
                        <InputOTPSlot
                          key={idx}
                          index={idx}
                          className={`h-12 w-10 rounded-[4px]! text-center text-xl font-semibold min-[576px]:h-13 min-[576px]:w-11 min-[576px]:text-2xl ${errors.code ? "border-destructive" : "border-border"
                            }`}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>

            {errors.code?.message ? (
              <p className="mt-3 text-center text-[12px] text-destructive">
                {errors.code.message}
              </p>
            ) : null}

            <p className="mt-6 text-center text-[13px] text-muted-foreground">
              {t("auth.codeNotReceived")}{" "}
              <button
                type="button"
                onClick={async () => {
                  await Promise.resolve(onResend?.());
                }}
                className={`${authLinkClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={isSubmitting}
              >
                {t("auth.resend")}
              </button>
            </p>

            <div className="mt-5">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={authPrimaryBtnClass}
                isLoading={isSubmitting}
              >
                {isSubmitting ? t("auth.verifying") : t("auth.verify")}
              </Button>
            </div>
          </form>
          {!isAuthenticated && (
            <p className="mt-6 text-center text-[13px] text-muted-foreground">
              {t("auth.backTo")}{" "}
              <Link href={signInHref} className={authLinkClass}>
                {t("common.signIn")}
              </Link>
            </p>
          )}
    </div>
  );
};

export default VerificationIdentityCard;
