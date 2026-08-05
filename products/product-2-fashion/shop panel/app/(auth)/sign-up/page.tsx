"use client"

import CreateAccountCard from "@/components/auth/CreateAccountCard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const SignUpPage: React.FC = () => {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])


  return (
    <main className="min-h-screen bg-white">
      <CreateAccountCard
        signInHref="/sign-in"
      />
    </main>
  );
};

export default SignUpPage;
