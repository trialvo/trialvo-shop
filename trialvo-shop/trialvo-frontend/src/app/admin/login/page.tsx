import { Suspense } from "react";
import AdminLoginPage from "@/views/admin/AdminLoginPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPage />
    </Suspense>
  );
}
