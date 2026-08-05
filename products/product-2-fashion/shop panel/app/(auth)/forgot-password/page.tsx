"use client"

import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";
import React from "react";

const ForgotPasswordPage: React.FC = () => {

  return (
    <main className="min-h-screen bg-white">
      <ForgotPasswordCard
        signInHref="/sign-in"
      />
    </main>
  );
};

export default ForgotPasswordPage;
