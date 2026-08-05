"use client";

export type AuthMode =
  | "signin"
  | "signup"
  | "verify"
  | "forgot-request"
  | "forgot-verify"
  | "forgot-reset";

export type AuthSessionState = {
  email: string;
  phone?: string;
  otp: string;
  purpose: "verify-email" | "forgot-password";
};

export const AUTH_INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-sm border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
