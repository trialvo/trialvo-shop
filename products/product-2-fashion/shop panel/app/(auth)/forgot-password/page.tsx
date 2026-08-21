"use client"

import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";
import React from "react";

const ForgotPasswordPage: React.FC = () => {

  return (
    <AuthShell>
      <ForgotPasswordCard
        signInHref="/sign-in"
      />
    </AuthShell>
  );
};

export default ForgotPasswordPage;
