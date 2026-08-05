import PageMeta from "@/components/common/PageMeta";
import GuestOrdersPage from "@/components/orders/guest-orders/GuestOrdersPage";

export default function GuestOrders() {
  return (
    <>
      <PageMeta
        title="All Orders"
        description="Order Management - All Orders"
      />
      <GuestOrdersPage />
    </>
  );
}
