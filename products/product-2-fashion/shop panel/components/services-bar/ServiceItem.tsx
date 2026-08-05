import React from "react";

export type ServiceItemProps = {
  icon: React.ReactNode;
  label: string;
  className?: string;
};

const ServiceItem: React.FC<ServiceItemProps> = ({ icon, label, className = "" }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="shrink-0">{icon}</div>
      <p className="text-sm font-medium text-black">{label}</p>
    </div>
  );
};

export default ServiceItem;
