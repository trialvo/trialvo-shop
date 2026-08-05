import PageMeta from "@/components/common/PageMeta";
import OrderReportPage from "@/components/reports/order-report/OrderReportPage";

export default function OrderReport() {
  return (
    <>
      <PageMeta title="Order Report" description="Reports - Order Report" />
      <OrderReportPage />
    </>
  );
}
