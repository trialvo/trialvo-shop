"use client";

import Layout from "@/components/layout/Layout";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type VerifyIdentifyClientProps = {
  email: string;
  otp: string;
};

export default function VerifyIdentifyClient({
  email,
  otp,
}: VerifyIdentifyClientProps) {
  const auth = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/account");
    }
  }, [auth.isAuthenticated, router]);

  return (
    <Layout>
      <div className="container py-12 max-w-md">
        <AuthPanel
          initialMode="verify"
          initialEmail={email}
          initialOtp={otp}
        />
      </div>
    </Layout>
  );
}
