import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Forgot Password — LIFESTYLE",
  description: "Reset your LIFESTYLE account password in a few simple steps.",
};

/**
 * Route: /auth/forgot-password
 * Server component shell — keeps the page file thin and metadata SEO-friendly.
 * All interactive state lives inside <ForgotPasswordForm />.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
