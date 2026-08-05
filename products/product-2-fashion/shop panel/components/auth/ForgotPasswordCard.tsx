"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiSmartphone } from "react-icons/fi";

// ── Types ─────────────────────────────────────────────────────────────────────
type Channel = "email" | "sms";
type Methods = { email: boolean; sms: boolean };

interface ForgotMethodsResponse {
  success: boolean;
  email: boolean;
  sms: boolean;
}

export type ForgotPasswordSubmitPayload =
  | { email: string }
  | { phone_number: string };

export interface ForgotPasswordCardProps {
  signInHref?: string;
  title?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address (e.g. name@example.com).")
    .refine(
      (val) => !(/(\+?88)?01[3-9]\d{8}/.test(val)),
      "Please enter an email address, not a phone number.",
    ),
});

const phoneSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine(
      (val) => !val.includes("@"),
      "Please enter a phone number, not an email address.",
    )
    .refine(
      (val) => /^(\+?88)?01[3-9]\d{8}$/.test(val),
      "Please enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX).",
    ),
});

type FormValues = z.infer<typeof emailSchema>;

// ── Sub-components ────────────────────────────────────────────────────────────
function ChannelTab({
  active,
  onClick,
  icon,
  label,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 cursor-pointer items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200",
        active ? "text-black" : "text-gray-400 hover:text-gray-600",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "absolute bottom-0 left-0 h-[2px] w-full transition-all duration-300 ease-out",
          active ? "scale-x-100 bg-black" : "scale-x-0 bg-transparent",
        )}
      />
    </button>
  );
}

function MethodsUnavailableNotice() {
  return (
    <div className="mt-8 flex flex-col items-center rounded border border-dashed border-gray-200 bg-gray-50/50 px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <FiLock className="h-5 w-5 text-gray-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-800">
        Password reset is temporarily unavailable
      </p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-gray-500">
        Self-service password reset has been disabled by the administrator.
        Please contact support for assistance.
      </p>
    </div>
  );
}

function MethodsSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      <Skeleton className="mx-auto h-4 w-3/4 rounded" />
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-none" />
        <Skeleton className="h-11 flex-1 rounded-none" />
      </div>
      <Skeleton className="h-12 w-full rounded-none" />
      <Skeleton className="h-9 w-full rounded-none" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const ForgotPasswordCard: React.FC<ForgotPasswordCardProps> = ({
  signInHref = "/sign-in",
}) => {
  const { forgotPassword, isSendingOtp } = useAuth();
  const router = useRouter();
  const { t, isLangReady } = useTranslation();

  const [methods, setMethods] = useState<Methods>({ email: true, sms: false });
  const [methodsReady, setMethodsReady] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");

  useEffect(() => {
    api
      .get<ForgotMethodsResponse>("/user/forgotPassMethods")
      .then((res) => {
        const m: Methods = { email: res.data.email, sms: res.data.sms };
        setMethods(m);
        if (!m.email && m.sms) setChannel("sms");
        else setChannel("email");
      })
      .catch(() => {
        setMethods({ email: true, sms: false });
        setChannel("email");
      })
      .finally(() => setMethodsReady(true));
  }, []);

  const showBothTabs = methods.email && methods.sms;
  const schema = channel === "sms" ? phoneSchema : emailSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: "" },
    mode: "onSubmit",
  });

  const switchChannel = (c: Channel) => {
    setChannel(c);
    reset({ value: "" });
  };

  const submitHandler = async (data: FormValues) => {
    try {
      let payload: ForgotPasswordSubmitPayload;

      if (channel === "sms") {
        const raw = data.value.trim().replace(/\D/g, "");
        const phone = raw.length === 11 ? `0${raw.slice(1)}` : data.value.trim();
        payload = { phone_number: phone };
        localStorage.setItem("submit_type", "forgot-password");
        localStorage.setItem("phone_number", phone);
        localStorage.removeItem("resetEmail");
      } else {
        payload = { email: data.value.trim() };
        localStorage.setItem("submit_type", "forgot-password");
        localStorage.setItem("resetEmail", data.value.trim());
        localStorage.removeItem("phone_number");
      }

      const res = await forgotPassword(payload);
      if (!res?.success) {
        router?.push("/sign-up");
      } else {
        router.push("/verify-identify");
      }
    } catch {
      // handled in mutation
    }
  };

  const disabled = isSubmitting || isSendingOtp;

  const descriptionText = showBothTabs
    ? "Choose how you'd like to receive your reset code."
    : channel === "sms"
      ? "Enter your registered phone number. We'll send a reset code via SMS."
      : t("auth.forgotPasswordDesc");

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Card className="mt-10 rounded-none border-0 shadow-[0px_0px_20px_rgba(0,0,0,0.05)]">
        <CardContent className="px-4 py-5">
          {/* Lock icon header */}
          <div className="mt-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03]">
              <FiLock className="h-6 w-6 text-black/60" />
            </div>
          </div>

          <h1 className="mt-5 text-center text-2xl font-extrabold text-black">
            {isLangReady ? t("auth.forgotPasswordTitle") : <Skeleton className="mx-auto h-7 w-56 rounded" />}
          </h1>

          {methodsReady ? (
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
              {descriptionText}
            </p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Skeleton className="h-3.5 w-64 rounded" />
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>
          )}

          {/* Channel tabs with animated indicator */}
          {methodsReady && showBothTabs && (
            <div className="mt-7 flex border-b border-gray-200">
              <ChannelTab
                active={channel === "email"}
                onClick={() => switchChannel("email")}
                icon={<FiMail className="h-4 w-4" />}
                label="Email"
              />
              <ChannelTab
                active={channel === "sms"}
                onClick={() => switchChannel("sms")}
                icon={<FiSmartphone className="h-4 w-4" />}
                label="SMS / Phone"
              />
            </div>
          )}

          {/* Skeleton while fetching */}
          {!methodsReady && <MethodsSkeleton />}

          {/* Both channels disabled */}
          {methodsReady && !methods.email && !methods.sms && (
            <MethodsUnavailableNotice />
          )}

          {/* Form */}
          {methodsReady && (methods.email || methods.sms) && (
            <form onSubmit={handleSubmit(submitHandler)} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgotValue" className="text-base font-medium text-black">
                  {channel === "sms" ? (
                    <>Phone Number <span className="text-red-600">*</span></>
                  ) : (
                    <>Email Address <span className="text-red-600">*</span></>
                  )}
                </Label>

                <Input
                  id="forgotValue"
                  type={channel === "sms" ? "tel" : "text"}
                  placeholder={
                    channel === "sms"
                      ? "01XXXXXXXXX"
                      : "name@example.com"
                  }
                  className={cn(
                    "h-12 rounded-none text-base transition-colors",
                    errors.value
                      ? "border-red-500 focus-visible:ring-red-200"
                      : "border-gray-300",
                  )}
                  aria-invalid={!!errors.value}
                  disabled={disabled}
                  {...register("value")}
                />

                {errors.value?.message && (
                  <p className="text-sm text-red-600">{errors.value.message}</p>
                )}

                {!errors.value && (
                  <p className="text-xs text-gray-500">
                    {channel === "sms"
                      ? "Use the phone number registered with your account."
                      : "Use the email address registered with your account."}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={disabled}
                className="h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
              >
                {disabled ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {channel === "sms"
                      ? "Sending OTP to your phone..."
                      : "Sending OTP to your email..."}
                  </span>
                ) : channel === "sms" ? (
                  "Send OTP via SMS"
                ) : (
                  "Send OTP via Email"
                )}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm font-normal text-black">
            {isLangReady ? (
              <>
                {t("auth.backTo")}{" "}
                <Link href={signInHref} className="font-semibold text-[#0088FF] hover:underline">
                  {t("common.signIn")}
                </Link>
              </>
            ) : (
              <Skeleton className="mx-auto h-4 w-40 rounded" />
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordCard;
