import PageMeta from "@/components/common/PageMeta";
import StockReportPage from "@/components/reports/stock-report/StockReportPage";

export default function StockReport() {
  return (
    <>
      <PageMeta title="Stock Report" description="Reports - Stock Report" />
      <StockReportPage />
    </>
  );
}
