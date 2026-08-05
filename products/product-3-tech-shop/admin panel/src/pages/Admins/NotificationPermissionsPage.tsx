import NotificationPermissionsManager from "@/components/admins/notification-permissions/NotificationPermissionsManager";
import PageMeta from "@/components/common/PageMeta";

export default function NotificationPermissionsPage() {
  return (
    <>
      <PageMeta title="Notification Permissions" description="Control per-admin notification alerts for email, SMS and push" />
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Permissions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure which notification channels each admin receives alerts on.
        </p>
      </div>
      <NotificationPermissionsManager />
    </>
  );
}
