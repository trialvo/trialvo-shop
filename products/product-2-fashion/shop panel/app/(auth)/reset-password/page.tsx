"use client"

import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordCard from "@/components/auth/ResetPasswordCard";
import { maskEmail, maskPhoneNumber } from "@/lib/utils";
import React, { useState } from "react";

const ResetPasswordPage: React.FC = () => {
  const [forgotEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("resetEmail") ?? "";
  });

    const [phoneNumber] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("phone_number") ?? "";
  });

  return (
    <AuthShell>
      <ResetPasswordCard
        email={maskEmail(forgotEmail) || maskPhoneNumber(phoneNumber)}
        signInHref="/sign-in"
      />
    </AuthShell>
  );
};

export default ResetPasswordPage;
