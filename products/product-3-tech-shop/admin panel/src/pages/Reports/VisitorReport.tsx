import PageMeta from "@/components/common/PageMeta";
import VisitorReportPage from "@/components/reports/visitor-report/VisitorReportPage";

export default function VisitorReport() {
  return (
    <>
      <PageMeta title="Visitor Report" description="Analytics - Visitor Report" />
      <VisitorReportPage />
    </>
  );
}
