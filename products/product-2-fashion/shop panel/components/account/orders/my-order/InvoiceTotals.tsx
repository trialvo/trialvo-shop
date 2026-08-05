import React from "react";
import type { OrderInvoiceTotals } from "./types";

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Props = {
  totals: OrderInvoiceTotals;
  currency: string;
};

export const InvoiceTotals: React.FC<Props> = ({ totals, currency }) => {
  return (
<div className="w-full max-w-[360px] space-y-2 text-sm">
  <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
    <div className="text-black/80 self-end">Subtotal:</div>
    <div className="font-semibold text-black">{money(currency, totals.subtotal)}</div>
  </div>

  {(totals.discount ?? 0) > 0 && (
  <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
    <div className="text-black/80">Item Discount:</div>
    <div className="font-semibold text-green-600">-{money(currency, totals.discount)}</div>
  </div>
  )}

  {(totals.delivery ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">Delivery:</div>
      <div className="font-semibold text-black">{money(currency, totals.delivery!)}</div>
    </div>
  )}

  {(totals.weightExtraCharge ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">
        ⚖ Weight surcharge{(totals.weightKg ?? 0) > 0 ? ` (${totals.weightKg} kg)` : ""}:
      </div>
      <div className="font-semibold text-orange-500">+{money(currency, totals.weightExtraCharge!)}</div>
    </div>
  )}

  {(totals.bulkDiscount ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">⚡ Bulk Discount:</div>
      <div className="font-semibold text-green-600">-{money(currency, totals.bulkDiscount!)}</div>
    </div>
  )}

  {(totals.comboDiscount ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">🎁 Combo Discount:</div>
      <div className="font-semibold text-green-600">-{money(currency, totals.comboDiscount!)}</div>
    </div>
  )}

  {(totals.cartWideDiscount ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">🏷️ Cart Discount:</div>
      <div className="font-semibold text-green-600">-{money(currency, totals.cartWideDiscount!)}</div>
    </div>
  )}

  {(totals.couponDiscount ?? 0) > 0 && (
    <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
      <div className="text-black/80">🎟️ Coupon Discount:</div>
      <div className="font-semibold text-green-600">-{money(currency, totals.couponDiscount!)}</div>
    </div>
  )}

  <div className="flex justify-between items-center pt-1">
    <div className="font-semibold text-black">Total:</div>
    <div className="font-semibold text-black">{money(currency, totals.total)}</div>
  </div>
</div>
  );
};
