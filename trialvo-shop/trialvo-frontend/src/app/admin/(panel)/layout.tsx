import type { Metadata } from "next";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";

/**
 * robots.txt already disallows /admin, but a meta directive also covers pages
 * reached by a link a crawler followed before reading robots.txt.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
