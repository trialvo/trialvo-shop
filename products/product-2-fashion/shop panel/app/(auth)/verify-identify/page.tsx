"use client";

import AuthShell from "@/components/auth/AuthShell";
import VerificationIdentityCard from "@/components/auth/VerificationIdentityCard";
import { useAuth } from "@/hooks/useAuth";
import { maskEmail, maskPhoneNumber } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

const VerifyIdentityPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOtp = searchParams.get("otp");
  const urlEmail = searchParams.get("email");

  const { verifyIdentity, verifyForgotPassword, sendVerifyOTP, forgotPassword } = useAuth();

  const [email] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("registrationEmail") ??
      sessionStorage.getItem("registrationEmail") ??
      urlEmail ??
      ""
    );
  });

  const [forgotEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("resetEmail") ?? "";
  });

  const [phoneNumber] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("phone_number") ?? "";
  });

  const [submitType] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("submit_type") ?? "";
  });

  const identity = email || forgotEmail || phoneNumber;

  useEffect(() => {
    if (!identity) {
      router.push("/sign-up");
    }
  }, [identity, router]);

  const handleVerifyCode = useCallback(async (otp: string) => {
    try {
      if (submitType === "forgot-password") {
        // Send ONLY one identifier — phone takes priority when both exist
        if (phoneNumber) {
          await verifyForgotPassword(otp, undefined, phoneNumber);
        } else {
          await verifyForgotPassword(otp, forgotEmail, undefined);
        }
        localStorage.setItem("resetPassOTP", otp);
      } else {
        await verifyIdentity(otp, email);
      }

      localStorage.removeItem("registrationEmail");
      localStorage.removeItem("otp_resend_until");
      sessionStorage.removeItem("registrationEmail");

      setTimeout(() => {
        if (submitType === "forgot-password") {
          router.push("/reset-password");
        } else {
          router.push("/account");
        }
      }, 1500);

      localStorage.removeItem("submit_type");
    } catch (error) {
      console.error("Verification failed:", error);
      throw error;
    }
  }, [submitType, email, forgotEmail, phoneNumber, verifyForgotPassword, verifyIdentity, router]);

  const handleResendCode = useCallback(async () => {
    try {
      if (submitType === "forgot-password") {
        if (phoneNumber) {
          await forgotPassword({ phone_number: phoneNumber });
        } else {
          const targetEmail = forgotEmail || email;
          if (!targetEmail) return;
          await forgotPassword({ email: targetEmail });
        }
        // NOTE: do NOT remove submit_type here — we still need it after resend
      } else {
        if (!email) return;
        await sendVerifyOTP(email);
      }
    } catch (error) {
      console.error("Failed to resend code:", error);
    }
  }, [submitType, phoneNumber, email, forgotEmail, forgotPassword, sendVerifyOTP]);

  if (!identity) {
    return (
      <AuthShell>
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-foreground/15 border-t-foreground" />
          <p className="text-[13px] text-[#888]">Loading verification...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <VerificationIdentityCard
        maskedTarget={maskEmail(email) || maskEmail(forgotEmail) || maskPhoneNumber(phoneNumber)}
        length={6}
        onResend={handleResendCode}
        onVerify={handleVerifyCode}
        signInHref="/sign-in"
        initialOtp={urlOtp || ""}
      />
    </AuthShell>
  );
};

export default VerifyIdentityPage;
