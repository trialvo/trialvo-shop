// pages/business-settings/service.tsx

import ServiceSettingsPage from "@/components/business-settings/service-settings/ServiceSettingsPage";
import PageMeta from "@/components/common/PageMeta";

export default function BusinessServicePage() {
  return (
    <>
      <PageMeta title="Service Settings" description="SMS & Email service settings" />
      <ServiceSettingsPage />
    </>
  );
}
