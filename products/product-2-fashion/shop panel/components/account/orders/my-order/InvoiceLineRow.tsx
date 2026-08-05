import React from "react";

type Props = {
  label: string;
  value: string;
};

export const InvoiceLineRow: React.FC<Props> = ({ label, value }) => {
  if (!label) return <div>{value}</div>;

  return (
    <div>
      <span className="text-black">{label}:</span> {value}
    </div>
  );
};
