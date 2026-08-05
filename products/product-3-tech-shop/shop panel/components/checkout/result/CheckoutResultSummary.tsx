"use client";

import type { ReactElement } from "react";
import type { CheckoutResultViewModel } from "@/lib/adapters/checkoutOrderResult";
import { Skeleton } from "@/components/ui/skeleton";

type CheckoutResultSummaryProps = Readonly<{
  data: CheckoutResultViewModel;
  showDelivery?: boolean;
}>;

/** Graduate OrderSummaryPanel — meta grid + items + totals. */
export function CheckoutResultSummary({
  data,
  showDelivery = true,
}: CheckoutResultSummaryProps): ReactElement {
  const { meta, items, totals } = data;

  return (
    <aside className="w-full space-y-2 sm:space-y-4">
      <div className="space-y-2 sm:space-y-4">
        <h2 className="text-lg font-semibold text-black text-left">
          Order summary
        </h2>
        <div className="h-px w-full bg-[#F1F1F1]" />
      </div>

      <div className="grid grid-cols-1 gap-3 py-4 text-sm sm:grid-cols-3 sm:gap-4">
        <div>
          <div className="text-[#636363] font-normal text-xs">Date</div>
          <div className="font-semibold text-xs text-black">{meta.date}</div>
        </div>
        <div>
          <div className="text-[#636363] font-normal text-xs">Order ID</div>
          <div className="font-semibold text-xs text-black">#{meta.orderId}</div>
        </div>
        <div>
          <div className="text-[#636363] font-normal text-xs">Payment</div>
          <div className="font-semibold text-xs text-black">
            {meta.paymentMethod}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-[#F1F1F1]" />

      <div className="pt-4 space-y-0 max-h-[17.5rem] overflow-y-auto sm:pr-3">
        <h3 className="text-sm font-semibold text-black mb-2">
          Ordered item{items.length === 1 ? "" : "s"}
        </h3>
        {items.length === 0 ? (
          <p className="text-xs text-black/60 py-4">No items found</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-[#F1F1F1] py-4"
            >
              <img
                src={item.image}
                alt=""
                className="h-12 w-12 object-cover border border-[#f1f1f1] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-black">
                  {item.title}
                </p>
                <p className="text-xs text-black/60">×{item.quantity}</p>
              </div>
              <span className="text-sm font-semibold shrink-0 text-black">
                BDT {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 py-4 text-sm text-black">
        <div className="flex justify-between">
          <span className="font-normal">Subtotal</span>
          <span className="font-semibold">
            BDT {totals.subtotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-normal">Delivery charge</span>
          <span
            className={
              totals.delivery === 0
                ? "font-semibold text-green-600"
                : "font-semibold"
            }
          >
            {totals.delivery === 0
              ? "FREE"
              : `BDT ${totals.delivery.toLocaleString()}`}
          </span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between">
            <span className="font-normal">Item discount</span>
            <span className="font-semibold text-green-600">
              −BDT {totals.discount.toLocaleString()}
            </span>
          </div>
        ) : null}
        {totals.couponDiscount > 0 ? (
          <div className="flex justify-between">
            <span className="font-normal">Coupon discount</span>
            <span className="font-semibold text-green-600">
              −BDT {totals.couponDiscount.toLocaleString()}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-[#F1F1F1] pt-3 text-base font-semibold">
          <span>Total amount</span>
          <span>BDT {totals.total.toLocaleString()}</span>
        </div>
      </div>

      {showDelivery ? (
        <div className="border-t border-[#F1F1F1] pt-3 text-xs text-black/70 space-y-1">
          <p className="font-medium text-black text-sm">Delivery</p>
          <p>{data.customerName}</p>
          <p>{data.deliveryAddressText}</p>
          {data.customerPhone ? <p>{data.customerPhone}</p> : null}
          {data.customerEmail ? <p>{data.customerEmail}</p> : null}
        </div>
      ) : null}
    </aside>
  );
}

export function CheckoutResultSkeleton(): ReactElement {
  return (
    <div className="sm:mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] bg-white p-6">
      <div className="flex flex-col gap-12 justify-between lg:flex-row">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-8 w-64 rounded-none" />
          <Skeleton className="h-6 w-3/4 rounded-none" />
          <Skeleton className="h-24 w-full rounded-none" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-none" />
            <Skeleton className="h-10 w-40 rounded-none" />
          </div>
        </div>
        <Skeleton className="h-80 w-full lg:w-[420px] rounded-none" />
      </div>
    </div>
  );
}
