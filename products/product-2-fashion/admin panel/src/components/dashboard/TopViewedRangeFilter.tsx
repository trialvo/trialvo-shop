import * as React from "react";
import { useTranslation } from "react-i18next";
import SlidingTabFilter from "@/components/ui/SlidingTabFilter";
import type { DashboardTimeRange } from "@/api/dashboard.api";

type Props = {
  value: DashboardTimeRange;
  onChange: (v: DashboardTimeRange) => void;
  className?: string;
};

const TopViewedRangeFilter: React.FC<Props> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const options = [
    { label: t("dashboard.filters.month"), value: "month" as DashboardTimeRange },
    { label: t("dashboard.filters.week"), value: "week" as DashboardTimeRange },
    { label: t("dashboard.filters.year"), value: "year" as DashboardTimeRange },
    { label: t("dashboard.filters.all"), value: "all" as DashboardTimeRange },
  ];

  return (
    <SlidingTabFilter
      options={options}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
};

export default TopViewedRangeFilter;
