import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import type { OrderTotals as OrderTotalsType } from "./order.types";

type Props = {
  totals: OrderTotalsType;
  hasCouponDiscount?: boolean;
  className?: string;
  hasMixedDelivery?: boolean;
};

const OrderTotals: React.FC<Props> = ({ totals, hasCouponDiscount = false, className, hasMixedDelivery = false }) => {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-2.5 py-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-black/60">{t("orderSummary.subtotal")}</span>
        <span className="font-medium tabular-nums text-black">BDT {totals?.subtotal.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-black/60">{t("orderSummary.deliveryCharge")}</span>
        {totals.delivery === 0 ? (
          <span className="font-medium text-black">Free</span>
        ) : (
          <span className="font-medium tabular-nums text-black">BDT {totals.delivery.toLocaleString()}</span>
        )}
      </div>

      {(totals.weightSurcharge ?? 0) > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">
              Weight surcharge{(totals.weightKg ?? 0) > 0 ? ` (${totals.weightKg} kg)` : ""}
            </span>
            <span className="font-medium tabular-nums text-black">+BDT {(totals.weightSurcharge ?? 0).toLocaleString()}</span>
          </div>
          {hasMixedDelivery && (
            <p className="-mt-1 pl-1 text-[10px] text-black/50">
              Surcharge applies to paid-delivery items only
            </p>
          )}
        </>
      )}

      {(totals.bulkDiscount ?? 0) > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">Bulk discount</span>
          <span className="font-medium tabular-nums text-black">-BDT {(totals.bulkDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.comboDiscount ?? 0) > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">Combo discount</span>
          <span className="font-medium tabular-nums text-black">-BDT {(totals.comboDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.cartWideDiscount ?? 0) > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">Cart discount</span>
          <span className="font-medium tabular-nums text-black">-BDT {(totals.cartWideDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.discount ?? 0) > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">{t("orderSummary.itemDiscount")}</span>
          <span className="font-medium tabular-nums text-black">-BDT {totals.discount.toLocaleString()}</span>
        </div>
      )}

      {hasCouponDiscount && (totals.coupon ?? 0) > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">{t("orderSummary.couponDiscount")}</span>
          <span className="font-medium tabular-nums text-black">-BDT {(totals.coupon ?? 0).toLocaleString()}</span>
        </div>
      ) : (totals.couponDiscount ?? 0) > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">{t("orderSummary.couponDiscount")}</span>
          <span className="font-medium tabular-nums text-black">-BDT {(totals.couponDiscount ?? 0).toLocaleString()}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-3 text-[15px] font-semibold text-black">
        <span>{t("orderSummary.totalAmount")}</span>
        <span>BDT {totals.total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default OrderTotals;
