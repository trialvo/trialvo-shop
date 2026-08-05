import PageMeta from "@/components/common/PageMeta";
import OrderInvoicePage from "@/components/orders/order-invoice/OrderInvoicePage";

export default function OrderInvoice() {
  return (
    <>
      <PageMeta title="Invoice" description="Order invoice" />
      <OrderInvoicePage />
    </>
  );
}
