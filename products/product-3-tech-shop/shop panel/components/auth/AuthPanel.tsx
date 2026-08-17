"use client";

import { useState } from "react";
import { AuthSignInForm } from "@/components/auth/AuthSignInForm";
import { AuthSignUpForm } from "@/components/auth/AuthSignUpForm";
import { AuthVerifyEmailForm } from "@/components/auth/AuthVerifyEmailForm";
import {
  AuthForgotRequestForm,
  AuthForgotResetForm,
  AuthForgotVerifyForm,
} from "@/components/auth/AuthForgotPasswordForms";
import type { AuthMode } from "@/components/auth/types";
import { sanitizeAuthText, sanitizeEmail, sanitizeOtp } from "@/lib/security/auth";
import { useAuthContext } from "@/context/AuthContext";

type AuthPanelProps = {
  initialMode?: AuthMode;
  initialEmail?: string;
  initialOtp?: string;
};

const titles: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: {
    title: "Welcome Back",
    subtitle: "Sign in to your Techshop account",
  },
  signup: {
    title: "Create Account",
    subtitle: "Register your Techshop account",
  },
  verify: {
    title: "Verify Email",
    subtitle: "Confirm your email to activate your account",
  },
  "forgot-request": {
    title: "Forgot Password",
    subtitle: "Recover access to your Techshop account",
  },
  "forgot-verify": {
    title: "Enter OTP",
    subtitle: "Confirm the code to continue resetting",
  },
  "forgot-reset": {
    title: "New Password",
    subtitle: "Set a strong password for your account",
  },
};

export default function AuthPanel({
  initialMode = "signin",
  initialEmail = "",
  initialOtp = "",
}: AuthPanelProps) {
  const auth = useAuthContext();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [contact, setContact] = useState(sanitizeAuthText(initialEmail, 254));
  const [otp, setOtp] = useState(sanitizeOtp(initialOtp));

  const heading = titles[mode];

  const onModeChange = (next: AuthMode, nextContact?: string) => {
    auth.clearError();
    auth.clearSuccess();
    if (typeof nextContact === "string") {
      setContact(sanitizeAuthText(nextContact, 254));
    }
    if (next === "signin" || next === "signup" || next === "forgot-request") {
      setOtp("");
    }
    setMode(next);
  };

  return (
    <div className="bg-card rounded-sm border border-border p-8">
      <h1 className="font-heading text-2xl font-bold text-center">
        {heading.title}
      </h1>
      <p className="text-muted-foreground text-center mt-2 text-sm">
        {heading.subtitle}
      </p>
      <div className="mt-6">
        {mode === "signup" ? (
          <AuthSignUpForm onModeChange={onModeChange} />
        ) : mode === "verify" ? (
          <AuthVerifyEmailForm
            email={sanitizeEmail(contact)}
            initialOtp={otp}
            onModeChange={onModeChange}
          />
        ) : mode === "forgot-request" ? (
          <AuthForgotRequestForm
            contact={contact}
            onContactChange={setContact}
            onModeChange={onModeChange}
          />
        ) : mode === "forgot-verify" ? (
          <AuthForgotVerifyForm
            contact={contact}
            onContactChange={setContact}
            otp={otp}
            onOtpChange={setOtp}
            onModeChange={onModeChange}
          />
        ) : mode === "forgot-reset" ? (
          <AuthForgotResetForm
            contact={contact}
            otp={otp}
            onModeChange={onModeChange}
          />
        ) : (
          <AuthSignInForm
            initialEmail={sanitizeEmail(contact)}
            onModeChange={onModeChange}
          />
        )}
      </div>
      {auth.error ? (
        <p className="text-destructive text-xs text-center mt-3" role="alert">
          {auth.error}
        </p>
      ) : null}
    </div>
  );
}
