"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { OrderReportTabKey, TimePeriodKey } from "./types";
import OrderReportTopBar from "./OrderReportTopBar";
import OrderReportDashboard from "./dashboard/OrderReportDashboard";
import OrderReportReport from "./report/OrderReportReport";

const OrderReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<OrderReportTabKey>("dashboard");
  const [period, setPeriod] = React.useState<TimePeriodKey>("today");

  return (
    <div className="w-full px-4 py-6 md:px-8">
      <div
        className={cn(
          "rounded-xl border border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-gray-900",
          "p-4 sm:p-6"
        )}
      >
        <OrderReportTopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          period={period}
          onPeriodChange={setPeriod}
        />

        {activeTab === "dashboard" ? (
          <OrderReportDashboard period={period} />
        ) : (
          <OrderReportReport period={period} />
        )}
      </div>
    </div>
  );
};

export default OrderReportPage;
