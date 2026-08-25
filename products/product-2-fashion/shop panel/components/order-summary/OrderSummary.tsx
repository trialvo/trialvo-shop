"use client";

import React from "react";
import { FiX } from "react-icons/fi";

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
    <section className="border border-[#E5E5E5] bg-white sm:sticky sm:top-19.5">
      <div className="border-b border-[#E5E5E5] px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-black">
          {t("orderSummary.title")}
        </h2>
      </div>

      <OrderItems items={items} className="px-5" />

      <div className="border-t border-[#E5E5E5] px-5 py-4">
        <p className="mb-2.5 text-xs font-medium tracking-wide text-black/45">
          {t("orderSummary.couponCode")}
        </p>

        {appliedCoupon?.coupon ? (
          <div className="flex items-center justify-between border border-[#E5E5E5] bg-white px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/50">{t("orderSummary.applied")}</span>
              <span className="font-semibold text-black">{appliedCoupon.coupon}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="p-1 text-black/40 transition-colors hover:text-black"
              aria-label="Remove coupon"
            >
              <FiX className="h-4 w-4" />
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
        <div className="mx-5 mb-1 border border-[#E5E5E5] px-3 py-2.5 text-xs leading-relaxed text-black/55">
          <p>
            Your cart has mixed delivery: some items ship free, others don&apos;t.
            A delivery charge applies, but free-delivery items are excluded from the weight surcharge.
          </p>
        </div>
      )}

      <OrderTotals
        className="px-5"
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
