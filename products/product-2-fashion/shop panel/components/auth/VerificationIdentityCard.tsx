"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Card className={`rounded-none border-0 mt-10 shadow-[0px_0px_20px_rgba(0,0,0,0.05)] ${cardClass}`}>
        <CardContent className="px-4 py-5">
          <h1 className="mt-5 text-center text-2xl font-extrabold text-black">
            {t("auth.verifyIdentityTitle")}
          </h1>

          <p className="mt-3 text-center text-sm text-gray-700">
            {t("auth.verifyDesc1")} {length}-{t("auth.verifyDesc2")}{" "}
            <span className="font-semibold text-black">{displayTarget}</span>
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
                    <InputOTPGroup className="gap-3">
                      {Array.from({ length }).map((_, idx) => (
                        <InputOTPSlot
                          key={idx}
                          index={idx}
                          className={`h-15 w-12 rounded-none! text-center text-4xl font-semibold ${errors.code ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>

            {errors.code?.message ? (
              <p className="mt-3 text-center text-sm text-red-600">
                {errors.code.message}
              </p>
            ) : null}

            <p className="mt-8 text-center text-sm text-black">
              {t("auth.codeNotReceived")}{" "}
              <button
                type="button"
                onClick={async () => {
                  await Promise.resolve(onResend?.());
                }}
                className="font-semibold text-[#0088FF] cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {t("auth.resend")}
              </button>
            </p>

            <div className="mt-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
                isLoading={isSubmitting}
              >
                {isSubmitting ? t("auth.verifying") : t("auth.verify")}
              </Button>
            </div>
          </form>
          {!isAuthenticated && (
            <p className="mt-8 text-center text-sm font-normal text-black">
              {t("auth.backTo")}{" "}
              <Link href={signInHref} className="font-semibold text-[#0088FF] hover:underline">
                {t("common.signIn")}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationIdentityCard;
