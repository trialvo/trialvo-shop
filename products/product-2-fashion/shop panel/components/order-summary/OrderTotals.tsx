import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { CiPercent } from "react-icons/ci";
import { FaTruckFast } from "react-icons/fa6";
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
    <div className={cn("space-y-3 py-4", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-normal">{t("orderSummary.subtotal")}</span>
        <span className="font-semibold">BDT {totals?.subtotal.toLocaleString()}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="flex items-center font-normal gap-2">
          <FaTruckFast className="h-4 w-4" /> {t("orderSummary.deliveryCharge")}
        </span>
        {totals.delivery === 0 ? (
          <span className="font-semibold text-green-600 flex items-center gap-1">
            🚚 FREE
          </span>
        ) : (
          <span className="font-semibold">BDT {totals.delivery.toLocaleString()}</span>
        )}
      </div>

      {(totals.weightSurcharge ?? 0) > 0 && (
        <>
          <div className="flex justify-between text-sm">
            <span className="flex items-center font-normal gap-2">
              ⚖ Weight surcharge{(totals.weightKg ?? 0) > 0 ? ` (${totals.weightKg} kg)` : ""}
            </span>
            <span className="font-semibold text-orange-500">+BDT {(totals.weightSurcharge ?? 0).toLocaleString()}</span>
          </div>
          {hasMixedDelivery && (
            <p className="text-[10px] text-amber-600 -mt-1 pl-1">
              ⚠️ Surcharge applies to paid-delivery items only
            </p>
          )}
        </>
      )}

      {(totals.bulkDiscount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            ⚡ Bulk Discount
          </span>
          <span className="font-semibold text-green-600">-BDT {(totals.bulkDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.comboDiscount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            🎁 Combo Discount
          </span>
          <span className="font-semibold text-green-600">-BDT {(totals.comboDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.cartWideDiscount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            🏷️ Cart Discount
          </span>
          <span className="font-semibold text-green-600">-BDT {(totals.cartWideDiscount ?? 0).toLocaleString()}</span>
        </div>
      )}

      {(totals.discount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            <CiPercent className="h-4 w-4" /> {t("orderSummary.itemDiscount")}
          </span>
          <span className="font-semibold text-green-600">-BDT {totals.discount.toLocaleString()}</span>
        </div>
      )}

      {hasCouponDiscount && (totals.coupon ?? 0) > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            🎟️ {t("orderSummary.couponDiscount")}
          </span>
          <span className="font-semibold text-green-600">-BDT {(totals.coupon ?? 0).toLocaleString()}</span>
        </div>
      ) : (totals.couponDiscount ?? 0) > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="flex items-center font-normal gap-2">
            🎟️ {t("orderSummary.couponDiscount")}
          </span>
          <span className="font-semibold text-green-600">-BDT {(totals.couponDiscount ?? 0).toLocaleString()}</span>
        </div>
      ) : null}

      <div className="flex justify-between border-t pt-3 text-base font-semibold">
        <span>{t("orderSummary.totalAmount")}</span>
        <span>BDT {totals.total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default OrderTotals;
