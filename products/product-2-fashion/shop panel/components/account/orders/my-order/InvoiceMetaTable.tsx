import React from "react";
import type { OrderInvoiceMeta } from "./types";

type Props = {
    meta: OrderInvoiceMeta;
};

const Row = ({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) => (
    <div className="grid grid-cols-[1fr_auto] gap-6 border-b border-[#EDEDED] py-2 text-xs">
        <div className="font-semibold text-black">{label}</div>
        <div className={valueClassName ?? "text-black"}>{value}</div>
    </div>
);

export const InvoiceMetaTable: React.FC<Props> = ({ meta }) => {

    return (
        <div className="w-full">
            <Row label="Order ID" value={meta.orderId} />
            <Row label="Placed On" value={meta.placedOn} />
            <Row
                label="Order Status"
                value={meta.orderStatus.label}
                valueClassName={meta.orderStatus.className}
            />
            <Row
                label="Payment Status"
                value={meta.paymentStatus.label}
                valueClassName={meta.paymentStatus.className}
            />
            <Row label="Estimate Deliver Date" value={meta.estimateDeliveryDate} />
        </div>
    );
};
