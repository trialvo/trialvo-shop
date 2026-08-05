import FirebaseCredentialSettings from "@/components/business-settings/firebase/FirebaseCredentialSettings";
import PageMeta from "@/components/common/PageMeta";

export default function FirebaseCredentialPage() {
  return (
    <>
      <PageMeta title="Firebase Push Credentials" description="Manage FCM service account for push notifications" />
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Firebase Push Credentials</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure the Firebase Cloud Messaging (FCM) service account used for push notifications.
        </p>
      </div>
      <FirebaseCredentialSettings />
    </>
  );
}
