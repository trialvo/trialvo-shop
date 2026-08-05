import PageMeta from "@/components/common/PageMeta";
import FooterSettingsPage from "@/components/website-settings/footer-settings/FooterSettingsPage";

export default function FooterSettings() {
  return (
    <>
      <PageMeta
        title="Footer Settings"
        description="Manage footer branding, sections, links, social icons, newsletter and legal content"
      />
      <FooterSettingsPage />
    </>
  );
}
