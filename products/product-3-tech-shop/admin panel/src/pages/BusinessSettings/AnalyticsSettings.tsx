import AnalyticsSettingsPage from "@/components/business-settings/analytics-settings/AnalyticsSettingsPage";
import PageMeta from "@/components/common/PageMeta";

export default function AnalyticsSettings() {
 return (
  <>
   <PageMeta
    title="Analytics Settings"
    description="Configure analytics tracking (Google Analytics, GTM, Facebook Pixel)"
   />
   <AnalyticsSettingsPage />
  </>
 );
}
