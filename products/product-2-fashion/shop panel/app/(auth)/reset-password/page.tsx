"use client"

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
    <main className="min-h-screen bg-white">
      <ResetPasswordCard
        email={maskEmail(forgotEmail) || maskPhoneNumber(phoneNumber)}
        signInHref="/sign-in"
      />
    </main>
  );
};

export default ResetPasswordPage;
