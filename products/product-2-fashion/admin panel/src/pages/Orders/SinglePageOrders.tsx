import PageMeta from "@/components/common/PageMeta";
import AllOrdersView from "@/components/orders/all-orders/AllOrdersView";

export default function SinglePageOrders() {
  return (
    <>
      <PageMeta
        title="Single Page Orders"
        description="Order Management - Single Page Orders"
      />
      <AllOrdersView defaultOrderType="single_page" />
    </>
  );
}
