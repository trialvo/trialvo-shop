"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";

import {
  bdMobileSchema,
  emailSchema,
  forgotPasswordSchema,
  verifyIdentitySchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type VerifyIdentityValues,
  type ResetPasswordValues,
} from "@/lib/validation/auth";
import { useAuth } from "@/hooks/useAuth";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { toast } from "sonner";

import { AuthInput } from "./AuthInput";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { OtpInputGroup } from "./OtpInputGroup";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { StepIndicator } from "./StepIndicator";

// ─── Stage config ──────────────────────────────────────────────────────────────

/** The four sequential stages of the forgot-password flow. */
type Stage = "request" | "sent" | "reset" | "success";

interface StageConfig {
  title: string;
  subtitle: string;
}

const STAGE_ORDER: Stage[] = ["request", "sent", "reset", "success"];

const STAGE_CONFIG: Record<Stage, StageConfig> = {
  request: {
    title: "Forgot your password?",
    subtitle: "Enter your email or mobile number and we'll send you a reset code.",
  },
  sent: {
    title: "Check your inbox",
    subtitle: "", // shown inline next to the email address
  },
  reset: {
    title: "Create new password",
    subtitle: "Your new password must be at least 6 characters.",
  },
  success: {
    title: "Password updated!",
    subtitle: "Your password has been reset successfully.",
  },
};

const OTP_LENGTH = 6;

/** Duration in seconds before the resend link becomes available. */
const RESEND_COOLDOWN = 30;

type ResetTarget =
  | { type: "email"; value: string }
  | { type: "phone"; value: string };

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("88") && digits.length === 13) {
    return `0${digits.slice(-10)}`;
  }

  return digits;
};

const getResetTarget = (value: string): ResetTarget => {
  const trimmed = value.trim();

  if (emailSchema.safeParse(trimmed).success) {
    return { type: "email", value: trimmed.toLowerCase() };
  }

  if (bdMobileSchema.safeParse(trimmed).success) {
    return { type: "phone", value: normalizePhoneNumber(trimmed) };
  }

  return { type: "email", value: trimmed };
};

const getTargetLabel = (target: ResetTarget | null) => target?.value ?? "";

const getTargetEmail = (target: ResetTarget | null) =>
  target?.type === "email" ? target.value : undefined;

const getTargetPhone = (target: ResetTarget | null) =>
  target?.type === "phone" ? target.value : undefined;

// ─── Stage 1 · Request ────────────────────────────────────────────────────────

interface RequestStageProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

function RequestStage({ onSubmit, isLoading }: RequestStageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { emailOrMobile: "" },
  });

  const onValid = async ({ emailOrMobile }: ForgotPasswordValues) => {
    await onSubmit(emailOrMobile);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      <AuthInput
        id="forgot-email"
        type="text"
        placeholder="Email or Mobile Number"
        autoComplete="username"
        icon={<Mail size={16} />}
        error={errors.emailOrMobile?.message}
        {...register("emailOrMobile")}
      />
      <AuthSubmitButton
        isLoading={isLoading}
        label="Send Reset Code"
        trailingIcon={<ArrowRight size={14} />}
      />
    </form>
  );
}

// ─── Stage 2 · OTP verification ───────────────────────────────────────────────

interface SentStageProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  /** Fires when the user manually requests another code. */
  onResend: (email: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * OTP entry stage.
 *
 * - "Verify Code" is disabled until all 6 cells are filled (RHF + zod guard it too).
 * - A 30-second countdown starts on mount.
 * - Once the countdown has elapsed the user can click "Resend" manually.
 */
function SentStage({ email, onVerify, onResend, isLoading }: SentStageProps) {
  // We store the OTP as a string[] in local state for the custom OtpInputGroup,
  // then push the joined string into RHF via Controller / setValue.
  const [digits, setDigits] = useState<string[]>(
    Array.from<string>({ length: OTP_LENGTH }).fill(""),
  );
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyIdentityValues>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: { code: "" },
  });

  /** Keep the RHF `code` field in sync whenever digits change. */
  const handleDigitsChange = useCallback(
    (next: string[]) => {
      setDigits(next);
      setValue("code", next.join(""), { shouldValidate: next.every(Boolean) });
    },
    [setValue],
  );

  const onValid = async ({ code }: VerifyIdentityValues) => {
    await onVerify(code);
  };

  // ── Resend countdown ────────────────────────────────────────────────────────

  const triggerResend = useCallback(async () => {
    setIsResending(true);
    try {
      await onResend(email);
    } finally {
      setIsResending(false);
      setCooldown(RESEND_COOLDOWN);
    }
  }, [email, onResend]);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start countdown on mount; clean up on unmount
  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCountdown]);

  const otpComplete = digits.every(Boolean);
  const canResend = cooldown === 0 && !isResending;

  const handleManualResend = async () => {
    await triggerResend();
    startCountdown();
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6" noValidate>
      <p className="text-sm text-muted-foreground -mt-4 leading-relaxed">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      {/*
        OtpInputGroup drives the visual input; its onChange syncs to RHF via
        handleDigitsChange.  The zod error surfaces through RHF if the user
        somehow triggers submit with an incomplete code.
      */}
      <OtpInputGroup
        value={digits}
        onChange={handleDigitsChange}
        error={errors.code?.message}
        disabled={isLoading}
      />

      <AuthSubmitButton
        isLoading={isLoading}
        disabled={!otpComplete}
        label="Verify Code"
        trailingIcon={<ArrowRight size={14} />}
      />

      {/* Resend row */}
      <p className="text-center text-xs text-muted-foreground">
        {canResend ? (
          <>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleManualResend}
              disabled={isResending}
              className="text-accent hover:text-accent/80 transition-colors font-medium disabled:opacity-50"
            >
              {isResending ? "Sending…" : "Resend"}
            </button>
          </>
        ) : (
          <span aria-live="polite">
            Resend available in{" "}
            <span className="tabular-nums font-medium text-foreground">{cooldown}s</span>
          </span>
        )}
      </p>
    </form>
  );
}

// ─── Stage 3 · Reset password ─────────────────────────────────────────────────

interface ResetStageProps {
  onSubmit: (newPassword: string) => Promise<void>;
  isLoading: boolean;
}

function ResetStage({ onSubmit, isLoading }: ResetStageProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");

  const onValid = async ({ newPassword }: ResetPasswordValues) => {
    await onSubmit(newPassword);
  };

  const toggleIcon = (show: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      <AuthInput
        id="new-password"
        type={showPw ? "text" : "password"}
        placeholder="New Password"
        autoComplete="new-password"
        icon={<Lock size={16} />}
        rightAddon={toggleIcon(showPw, () => setShowPw((v) => !v))}
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />

      <AuthInput
        id="confirm-password"
        type={showConfirm ? "text" : "password"}
        placeholder="Confirm New Password"
        autoComplete="new-password"
        icon={<Lock size={16} />}
        rightAddon={toggleIcon(showConfirm, () => setShowConfirm((v) => !v))}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <PasswordStrengthBar password={newPassword} />

      <AuthSubmitButton
        isLoading={isLoading}
        label="Update Password"
        trailingIcon={<ArrowRight size={14} />}
      />
    </form>
  );
}

// ─── Stage 4 · Success ────────────────────────────────────────────────────────

function SuccessStage() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-7">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-accent" strokeWidth={1.5} />
        </div>
        <div
          className="absolute inset-0 rounded-full border border-accent/30 animate-ping"
          style={{ animationDuration: "1.8s" }}
          aria-hidden="true"
        />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-8">
        You can now sign in with your new password. Keep it somewhere safe!
      </p>

      <Link
        href="/auth"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-sm"
      >
        Sign In Now <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── Root orchestrator ────────────────────────────────────────────────────────

/**
 * Stateful orchestrator for the complete forgot-password flow.
 * Each stage owns its own RHF instance; this component manages only
 * stage transitions and the shared `email` value across stages.
 */
export function ForgotPasswordForm() {
  const {
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    isSendingOtp,
    isVerifyingIdentity,
    isResetingPassword,
  } = useAuth();
  const [stage, setStage] = useState<Stage>("request");
  const [target, setTarget] = useState<ResetTarget | null>(null);
  const [verifiedOtp, setVerifiedOtp] = useState("");

  const currentStep = STAGE_ORDER.indexOf(stage);
  const showProgress = stage !== "success";

  const handleRequestEmail = async (submittedEmail: string) => {
    const nextTarget = getResetTarget(submittedEmail);

    try {
      const response = await forgotPassword({
        email: getTargetEmail(nextTarget),
        phone_number: getTargetPhone(nextTarget),
      });

      if (response.error || response.success === false) {
        toast.error(response.error || response.message || "Failed to send reset code.");
        return;
      }

      setTarget(nextTarget);
      setVerifiedOtp("");
      setStage("sent");
      toast.success(response.message || "Reset code sent.");
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Failed to send reset code."));
    }
  };

  const handleResendEmail = async () => {
    if (!target) return;

    try {
      const response = await forgotPassword({
        email: getTargetEmail(target),
        phone_number: getTargetPhone(target),
      });

      if (response.error || response.success === false) {
        toast.error(response.error || response.message || "Failed to resend code.");
        return;
      }

      toast.success(response.message || "Reset code resent.");
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Failed to resend code."));
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!target) return;

    try {
      const response = await verifyForgotPassword(
        code,
        getTargetEmail(target),
        getTargetPhone(target),
      );

      if (response.error || response.success === false) {
        toast.error(response.error || response.message || "Verification failed.");
        return;
      }

      setVerifiedOtp(code);
      setStage("reset");
      toast.success(response.message || "Code verified.");
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Verification failed."));
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!target || !verifiedOtp) return;

    try {
      const response = await resetPassword({
        otp: verifiedOtp,
        new_password: newPassword,
        email: getTargetEmail(target),
        phone_number: getTargetPhone(target),
      });

      if (response.error || response.success === false) {
        toast.error(response.error || response.message || "Password reset failed.");
        return;
      }

      setStage("success");
      toast.success(response.message || "Password reset successful.");
    } catch (error) {
      toast.error(getUnknownErrorMessage(error, "Password reset failed."));
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Back link */}
        {stage !== "success" && (
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-10 group"
          >
            <ArrowLeft
              size={12}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            Back to Sign In
          </Link>
        )}

        {/* Step progress */}
        {showProgress && (
          <div className="mb-8">
            <StepIndicator totalSteps={3} currentStep={currentStep} />
          </div>
        )}

        {/* Stage header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            {STAGE_CONFIG[stage].title}
          </h1>
          {stage !== "sent" && STAGE_CONFIG[stage].subtitle && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {STAGE_CONFIG[stage].subtitle}
            </p>
          )}
        </div>

        {/* Stage content */}
        {stage === "request" && (
          <RequestStage onSubmit={handleRequestEmail} isLoading={isSendingOtp} />
        )}
        {stage === "sent" && (
          <SentStage
            email={getTargetLabel(target)}
            onVerify={handleVerifyOtp}
            onResend={handleResendEmail}
            isLoading={isVerifyingIdentity || isSendingOtp}
          />
        )}
        {stage === "reset" && (
          <ResetStage
            onSubmit={handleResetPassword}
            isLoading={isResetingPassword}
          />
        )}
        {stage === "success" && <SuccessStage />}
      </div>
    </div>
  );
}
