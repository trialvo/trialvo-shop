import { Suspense } from "react";
import type { Metadata } from "next";
import AdminLoginPage from "@/views/admin/AdminLoginPage";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPage />
    </Suspense>
  );
}
