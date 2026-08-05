"use client";

/**
 * components/single-order/checkout/SOPOtpVerification.tsx
 *
 * OTP verification UI for phone and email steps.
 */

import { Lock, Mail } from "lucide-react";

interface SOPOtpVerificationProps {
  type: "phone" | "email";
  target: string; // Phone number or email
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onGoBack: () => void;
  isVerifying: boolean;
  isSending: boolean;
  error: string;
  /** Show "✓ Phone verified" badge on email step */
  phoneVerified?: boolean;
}

export function SOPOtpVerification({
  type,
  target,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onGoBack,
  isVerifying,
  isSending,
  error,
  phoneVerified,
}: SOPOtpVerificationProps) {
  const isPhone = type === "phone";

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary mb-4">
          {isPhone ? (
            <Lock size={24} className="text-foreground" />
          ) : (
            <Mail size={24} className="text-foreground" />
          )}
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">
          {isPhone ? "Verify Identity" : "Verify Email"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please enter the 6-digit code sent to{" "}
          <span className="font-semibold text-foreground">{target}</span>
        </p>
        {phoneVerified && (
          <p className="mt-1 text-xs text-green-600">✓ Phone verified</p>
        )}
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[idx] ?? ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (!val && idx > 0) {
                  // Backspace — focus previous
                  const prev = e.target.previousElementSibling as HTMLInputElement | null;
                  prev?.focus();
                }
                const newOtp = otp.split("");
                newOtp[idx] = val.slice(-1);
                const joined = newOtp.join("").slice(0, 6);
                onOtpChange(joined);
                if (val && idx < 5) {
                  // Auto-advance to next input
                  const next = e.target.nextElementSibling as HTMLInputElement | null;
                  next?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                  const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement | null;
                  prev?.focus();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                onOtpChange(pasted);
              }}
              disabled={isVerifying}
              className={`h-14 w-11 text-center text-2xl font-semibold border rounded outline-none transition-colors ${
                error
                  ? "border-destructive"
                  : "border-border focus:border-accent"
              } bg-card text-foreground`}
              autoComplete={idx === 0 ? "one-time-code" : "off"}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {/* Resend */}
      <p className="text-center text-sm text-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={isSending}
          className="font-semibold text-accent cursor-pointer hover:underline disabled:opacity-60 transition-colors"
        >
          Resend
        </button>
      </p>

      {/* Verify button */}
      <button
        type="button"
        onClick={onVerify}
        disabled={otp.length < 6 || isVerifying}
        className="w-full h-12 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
      >
        {isVerifying
          ? "Verifying..."
          : isPhone
            ? "Verify & Continue"
            : "Verify & Place Order"}
      </button>

      {/* Back button */}
      <button
        type="button"
        onClick={onGoBack}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Go Back
      </button>
    </div>
  );
}
