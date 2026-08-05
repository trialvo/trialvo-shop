import DeliverySettingsPage from "@/components/business-settings/delivery/DeliverySettingsPage";
import PageMeta from "@/components/common/PageMeta";

export default function DeliverySettings() {
  return (
    <>
      <PageMeta
        title="Delivery Settings"
        description="Manage courier delivery charge settings"
      />
      <DeliverySettingsPage />
    </>
  );
}
