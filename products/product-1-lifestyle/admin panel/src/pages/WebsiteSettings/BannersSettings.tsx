import PageMeta from "@/components/common/PageMeta";
import BannersSettingsPage from "@/components/website-settings/banners-settings/BannersSettingsPage";

export default function BannersSettings() {
  return (
    <>
      <PageMeta
        title="Banner Settings"
        description="Manage website banners by zone and type"
      />
      <BannersSettingsPage />
    </>
  );
}
