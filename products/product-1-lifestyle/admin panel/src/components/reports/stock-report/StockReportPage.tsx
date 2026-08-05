"use client";

import React from "react";
import { cn } from "@/lib/utils";

import type { StockReportTabKey, TimePeriodKey } from "./types";
import StockReportTopBar from "./StockReportTopBar";
import StockReportDashboard from "./dashboard/StockReportDashboard";
import StockReportReport from "./report/StockReportReport";

const StockReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<StockReportTabKey>("dashboard");
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
        <StockReportTopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          period={period}
          onPeriodChange={setPeriod}
        />

        {activeTab === "dashboard" ? (
          <StockReportDashboard period={period} />
        ) : (
          <StockReportReport period={period} />
        )}
      </div>
    </div>
  );
};

export default StockReportPage;
