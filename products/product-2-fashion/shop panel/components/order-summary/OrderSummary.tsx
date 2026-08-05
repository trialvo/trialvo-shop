"use client";

import React from "react";
import { FiTag, FiX } from "react-icons/fi";
import { TbReceiptDollar } from "react-icons/tb";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAppliedCoupon, selectCartTotals } from "@/redux/selectors/cartSelectors";
import { setAppliedCoupon, setDiscount } from "@/redux/slices/cartSlice";

import { useAuth } from "@/hooks/useAuth";
import { useCoupon } from "@/hooks/useCoupon";
import { useTranslation } from "@/hooks/useTranslation";

import CouponInput from "./CouponInput";
import type { OrderItem } from "./order.types";
import OrderItems from "./OrderItems";
import OrderTotals from "./OrderTotals";

type Props = {
  items: OrderItem[];
};

function toPositiveInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function toNonZeroQty(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

const OrderSummary: React.FC<Props> = ({ items }) => {
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const dispatch = useAppDispatch();
  const totals = useAppSelector(selectCartTotals);
  const appliedCoupon = useAppSelector(selectAppliedCoupon);
  const { t } = useTranslation();

  const { validateCoupon, validateCouponLoading } = useCoupon();
  const { user } = useAuth();

  const isEmpty = (items?.length ?? 0) === 0;

  // Use hasMixedDelivery from selector — it accounts for both per-SKU and rule-based free delivery
  const hasMixedDelivery = totals.hasMixedDelivery ?? false;

  React.useEffect(() => {
    if (isEmpty) {
      dispatch(setDiscount(0));
      dispatch(setAppliedCoupon(null));
    }
  }, [dispatch, isEmpty]);

  const handleApplyCoupon = async (coupon: string) => {
    setCouponError(null);
    if (isEmpty) return;

    const order_items = (items ?? [])
      .map((it) => {
        const obj = it as {
          product_variation_id?: unknown;
          productVariationId?: unknown;
          variationId?: unknown;
          quantity?: unknown;
          qty?: unknown;
        };

        const product_variation_id =
          toPositiveInt(obj.product_variation_id) ??
          toPositiveInt(obj.productVariationId) ??
          toPositiveInt(obj.variationId);

        const quantity = toNonZeroQty(obj.quantity) ?? toNonZeroQty(obj.qty);

        if (!product_variation_id || !quantity) return null;
        return { product_variation_id, quantity };
      })
      .filter((x): x is { product_variation_id: number; quantity: number } => x !== null);

    if (!order_items.length) return;

    try {
      const data = await validateCoupon({
        coupon: coupon.trim(),
        order_items,
        ...(user?.id ? { customer_id: user.id } : {}),
      });

      const couponDiscount =
        typeof data?.totals?.total_coupon_discount === "number" && Number.isFinite(data.totals.total_coupon_discount)
          ? data.totals.total_coupon_discount
          : 0;

      dispatch(setDiscount(couponDiscount));
      dispatch(setAppliedCoupon({ coupon: coupon.trim(), discount: couponDiscount }));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply coupon.";
      setCouponError(msg);
      dispatch(setDiscount(0));
      dispatch(setAppliedCoupon(null));
    }
  };

  const handleRemoveCoupon = () => {
    setCouponError(null);
    dispatch(setDiscount(0));
    dispatch(setAppliedCoupon(null));
  };

  return (
    <section className="sm:sticky sm:top-19.5 border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.10)] bg-white">
      <div className="flex items-center gap-2 text-lg font-semibold border-b border-[#F1F1F1] py-4 px-3">
        <TbReceiptDollar className="h-5 w-5" />
        {t("orderSummary.title")}
      </div>

      <OrderItems items={items} className="px-3 mb-4" />

      <div className="bg-[#F3FAFF] p-4">
        <div className="flex items-center gap-1.5 text-sm text-[#343434] font-semibold mb-1">
          <FiTag className="h-5 w-5" />
          {t("orderSummary.couponCode")}
        </div>

        {appliedCoupon?.coupon ? (
          <div className="flex items-center justify-between bg-white border border-green-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">{t("orderSummary.applied")}</span>
              <span className="font-semibold">{appliedCoupon.coupon}</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-gray-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
              aria-label="Remove coupon"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <CouponInput
            onApply={handleApplyCoupon}
            disabled={isEmpty || validateCouponLoading}
            apiError={couponError}
          />
        )}
      </div>

      {hasMixedDelivery && (
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <span className="mt-0.5 shrink-0">🚚</span>
          <p>
            Your cart has <strong>mixed delivery</strong>: some items ship free, others don't.
            A delivery charge applies, but free-delivery items are <strong>excluded from weight surcharge</strong>.
          </p>
        </div>
      )}

      <OrderTotals
        className="px-3"
        hasCouponDiscount={Boolean(appliedCoupon?.coupon)}
        hasMixedDelivery={hasMixedDelivery}
        totals={{
          subtotal: totals.subtotal,
          delivery: totals.delivery,
          discount: totals.discount,
          coupon: totals?.couponDiscount,
          weightKg: totals.weightKgTotal,
          weightSurcharge: totals.weightSurcharge,
          bulkDiscount: totals.bulkDiscount,
          comboDiscount: totals.comboDiscount,
          cartWideDiscount: totals.cartWideDiscount,
          total: totals.total,
        }}
      />
    </section>
  );
};

export default OrderSummary;
