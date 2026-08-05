import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import PageMeta from "../../components/common/PageMeta";
import QuickAccess from "../../components/dashboard/QuickAccess";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import OrderStatusGrid from "@/components/dashboard/OrderStatusGrid";
import TopViewProductsCard from "@/components/dashboard/TopViewProductsCard";
import TopSellingDistrictCard from "@/components/dashboard/TopSellingDistrictCard";
import TopSellingProductsCard from "@/components/dashboard/TopSellingProductsCard";
import StockAlertProductsCard from "@/components/dashboard/StockAlertProductsCard";
import { useAppBranding } from "@/context/AppBrandingContext";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { branding } = useAppBranding();
  const appName = branding.appShortName ?? branding.appName;
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={t("dashboard.pageTitle", { appName })}
        description={t("dashboard.pageDescription", { appName })}
      />

      <div className="space-y-6">
        <DashboardWelcome />

        {/* Quick Access Shortcuts */}
        <QuickAccess />

        {/* Metrics Overview */}
        <DashboardMetrics />

        {/* Statistics Chart + Order Statuses */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 flex">
            <StatisticsChart />
          </div>

          <div className="col-span-12 xl:col-span-4 flex">
            <OrderStatusGrid />
          </div>
        </div>

        {/* Top Viewed + Top Selling Districts */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 flex">
            <TopViewProductsCard />
          </div>

          <div className="col-span-12 xl:col-span-6 flex">
            <TopSellingDistrictCard />
          </div>
        </div>

        {/* Top Selling Products + Stock Alerts */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-6 flex">
            <TopSellingProductsCard />
          </div>

          <div className="col-span-12 xl:col-span-6 flex">
            <StockAlertProductsCard />
          </div>
        </div>
      </div>
    </>
  );
}
