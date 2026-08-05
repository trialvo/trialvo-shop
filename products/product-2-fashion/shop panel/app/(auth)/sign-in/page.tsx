"use client"

import SignInCard from "@/components/auth/SignInCard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const SignInPage: React.FC = () => {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  return (
    <main className="min-h-screen bg-white">
      <SignInCard />
    </main>
  );
};

export default SignInPage;
