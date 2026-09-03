import React from "react";
import type { OrderInvoiceMeta } from "./types";

type Props = {
  meta: OrderInvoiceMeta;
};

const Row = ({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) => (
  <div
    data-invoice-meta-row
    className="grid grid-cols-[minmax(0,1fr)_minmax(110px,auto)] items-center gap-x-4 border-b border-black/6 py-2.5 text-[13px] last:border-b-0"
  >
    <div className="font-medium text-[#5F5F5F]">{label}</div>
    <div className="text-right font-semibold text-[#191919]">
      {valueNode ?? value}
    </div>
  </div>
);

export const InvoiceMetaTable: React.FC<Props> = ({ meta }) => {
  return (
    <div
      data-invoice-meta
      className="w-full overflow-hidden rounded-[4px] border border-black/8 bg-[#FAFAFA] px-3.5"
    >
      <Row label="Order ID" value={`#${meta.orderId}`} />
      <Row label="Placed on" value={meta.placedOn} />
      <Row
        label="Order status"
        valueNode={
          <span className={meta.orderStatus.className}>{meta.orderStatus.label}</span>
        }
      />
      <Row
        label="Payment"
        valueNode={
          <span className={meta.paymentStatus.className}>
            {meta.paymentStatus.label}
          </span>
        }
      />
      <Row label="Est. delivery" value={meta.estimateDeliveryDate} />
    </div>
  );
};
