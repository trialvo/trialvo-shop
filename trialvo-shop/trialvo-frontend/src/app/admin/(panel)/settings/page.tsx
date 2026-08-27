import { Suspense } from "react";
import AdminSettingsPage from "@/views/admin/AdminSettingsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminSettingsPage />
    </Suspense>
  );
}
