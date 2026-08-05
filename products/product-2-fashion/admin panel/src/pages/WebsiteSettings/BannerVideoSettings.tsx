import PageMeta from "@/components/common/PageMeta";
import BannerVideoSettingsPage from "@/components/website-settings/banner-video-settings/BannerVideoSettingsPage";

export default function BannerVideoSettings() {
  return (
    <>
      <PageMeta
        title="Banner Video Settings"
        description="Manage promotional banner videos"
      />
      <BannerVideoSettingsPage />
    </>
  );
}
