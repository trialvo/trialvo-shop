import React from "react";

type Props = {
  label: string;
  value: string;
};

export const InvoiceLineRow: React.FC<Props> = ({ label, value }) => {
  if (!label) return <div>{value}</div>;

  return (
    <div className="text-[13px]">
      <span className="font-medium text-[#8A8A8A]">{label}:</span>{" "}
      <span className="text-[#5F5F5F]">{value}</span>
    </div>
  );
};
