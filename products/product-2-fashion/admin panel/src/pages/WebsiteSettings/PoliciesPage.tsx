import PoliciesManager from "@/components/website-settings/policies/PoliciesManager";
import PageMeta from "@/components/common/PageMeta";

export default function PoliciesPage() {
  return (
    <>
      <PageMeta title="Dynamic Policies" description="Manage legal and content pages like return policy, privacy policy" />
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dynamic Policies</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage legal content pages (return policy, privacy policy, etc.).
        </p>
      </div>
      <PoliciesManager />
    </>
  );
}
