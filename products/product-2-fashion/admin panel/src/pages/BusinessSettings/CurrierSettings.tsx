import CurrierSettingsPage from "@/components/business-settings/currier-settings/CurrierSettingsPage";
import PageMeta from "@/components/common/PageMeta";

export default function CurrierSettings() {
  return (
    <>
      <PageMeta
        title="Currier Settings"
        description="Manage courier APIs, credentials, and activation status"
      />
      <CurrierSettingsPage />
    </>
  );
}
