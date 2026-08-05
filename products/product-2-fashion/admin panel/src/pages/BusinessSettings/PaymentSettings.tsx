import PaymentSettingsPage from "@/components/business-settings/payment-settings/PaymentSettingsPage";
import PageMeta from "@/components/common/PageMeta";

export default function PaymentSettings() {
  return (
    <>
      <PageMeta
        title="Payment Settings"
        description="Configure payment gateways (bKash, SSLCommerz, ShurjoPay, Nagad, Rocket)"
      />
      <PaymentSettingsPage />
    </>
  );
}
