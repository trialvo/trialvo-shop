import PageMeta from "@/components/common/PageMeta";
import AllOrdersView from "@/components/orders/all-orders/AllOrdersView";

export default function AllOrders() {
  return (
    <>
      <PageMeta title="All Orders" description="Order Management - All Orders" />
      <AllOrdersView />
    </>
  );
}
