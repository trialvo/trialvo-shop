import * as React from "react";
import { useTranslation } from "react-i18next";
import SlidingTabFilter from "@/components/ui/SlidingTabFilter";
import type { MetricsRange } from "./MetricCard";

interface Props {
  value: MetricsRange;
  onChange: (value: MetricsRange) => void;
  className?: string;
}

const MetricsFilter: React.FC<Props> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const options = [
    { label: t("dashboard.filters.day"), value: "day" as MetricsRange },
    { label: t("dashboard.filters.week"), value: "week" as MetricsRange },
    { label: t("dashboard.filters.month"), value: "month" as MetricsRange },
    { label: t("dashboard.filters.year"), value: "year" as MetricsRange },
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

export default MetricsFilter;
