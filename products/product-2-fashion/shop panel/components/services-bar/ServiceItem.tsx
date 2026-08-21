import { cn } from "@/lib/utils";
import React from "react";

export type ServiceItemProps = {
  icon: React.ReactNode;
  label: string;
  className?: string;
  layout?: "row" | "stack";
};

const ServiceItem: React.FC<ServiceItemProps> = ({
  icon,
  label,
  className = "",
  layout = "row",
}) => {
  return (
    <div
      className={cn(
        layout === "stack"
          ? "flex flex-col items-center gap-2.5 text-center"
          : "flex items-center gap-3",
        className,
      )}
    >
      <div className="shrink-0 text-primary">{icon}</div>
      <p className="text-[12px] font-medium tracking-[0.04em] text-foreground min-[768px]:text-[13px]">
        {label}
      </p>
    </div>
  );
};

export default ServiceItem;
