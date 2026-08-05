import { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Printer } from "lucide-react";
import type { OrderRow } from "@/components/orders/all-orders/types";

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderRow | null;
};

function statusPill(status: OrderRow["status"]) {
  const base =
    "inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold";
  switch (status) {
    case "new":
      return `${base} bg-blue-light-500 text-white`;
    case "approved":
      return `${base} bg-brand-500 text-white`;
    case "processing":
      return `${base} bg-orange-500 text-white`;
    case "packaging":
      return `${base} bg-blue-light-700 text-white`;
    case "shipped":
      return `${base} bg-blue-light-600 text-white`;
    case "out_for_delivery":
      return `${base} bg-blue-light-800 text-white`;
    case "delivered":
      return `${base} bg-success-600 text-white`;
    case "returned":
      return `${base} bg-orange-600 text-white`;
    case "cancelled":
      return `${base} bg-error-600 text-white`;
    case "on_hold":
      return `${base} bg-gray-700 text-white`;
    case "trash":
      return `${base} bg-gray-600 text-white`;
    default:
      return `${base} bg-gray-700 text-white`;
  }
}

function paymentLabel(method: OrderRow["paymentMethod"]) {
  if (method === "COD") return "cash on delivery";
  return String(method).toLowerCase();
}

function formatStatusLabel(s: OrderRow["status"]) {
  return String(s).split("_").join(" ").toUpperCase();
}

export default function OrderInfoModal({ open, onClose, order }: Props) {
  const titleId = "order-info-modal-title";
  if (!order) return null;

  const items = order.items ?? [];

  const subTotal = useMemo(() => {
    // item.total is line_total = final_unit_price × qty (net, after per-item discount).
    // We add skuDiscount back to get the gross subtotal (selling_price × qty),
    // matching the shop panel, order success page, and account order detail.
    const netTotal = items.length
      ? items.reduce((sum, it) => sum + (Number(it.total) || 0), 0)
      : Number(order.total ?? 0);
    return netTotal + Number(order.skuDiscount ?? 0);
  }, [order.total, order.skuDiscount, items]);

  const discount = Number(order.discount ?? 0);
  const paid = Number(order.paidAmount ?? 0);
  const shippingCost = Number(order.shippingCost ?? 0);
  const weightExtraCharge = Number(order.weightExtraCharge ?? 0);
  const weightKgTotal = Number(order.weightKgTotal ?? 0);

  const amountDue = useMemo(() => {
    if (Number.isFinite(Number(order.dueAmount))) {
      return Math.max(0, Number(order.dueAmount));
    }
    return Math.max(0, Number(order.total ?? 0) - paid);
  }, [order.dueAmount, order.total, paid]);

  const totalQty = useMemo(() => {
    return items.reduce((s, x) => s + (Number(x.qty) || 0), 0);
  }, [items]);

  const orderNote = (order.orderNote || "").trim();
  const shippingAddress = (order.shippingAddress || "").trim();
  const shippingArea = (order.shippingArea || "").trim();
  const shippingLocation = (order.shippingLocation || "").trim();

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      titleId={titleId}
      className="w-full max-w-[1200px] overflow-hidden"
      showCloseButton={false}
    >
      <div className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white flex flex-col">
        {/* Header (fixed) */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-4 min-w-0">
            <h3
              id={titleId}
              className="truncate text-xl sm:text-2xl font-extrabold tracking-wide"
            >
              ORDER {order.id}
            </h3>
            <span className={statusPill(order.status)}>
              {formatStatusLabel(order.status)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-error-600 text-white hover:bg-error-700"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body (max 600px) */}
        <div className="max-h-[600px] overflow-y-auto px-6 py-6 custom-scrollbar">
          {/* Top summary cards (no "Billing Details") */}
          <div className="grid grid-cols-12 gap-6">
            {/* Customer */}
            <div className="col-span-12 md:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 flex items-center justify-center">
                    {order.customerImage ? (
                      <img
                        src={order.customerImage}
                        alt={order.customerName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">
                        IMG
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {order.customerPhone}
                    </p>

                    <div className="mt-3 grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-6">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          EMAIL
                        </p>
                        <p className="truncate text-sm text-gray-900 dark:text-white">
                          {order.email ?? "—"}
                        </p>
                      </div>

                      <div className="col-span-12 sm:col-span-6">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          PAYMENT
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {paymentLabel(order.paymentMethod)} •{" "}
                          {order.paymentStatus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800">
                        Type: {order.paymentType}
                      </span>

                      {order.paymentProvider ? (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800">
                          Provider: {order.paymentProvider}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="col-span-12 md:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Shipping Address
                </p>

                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  {shippingAddress || "—"}
                </p>

                <div className="mt-4 grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      AREA
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {shippingArea ||
                        (shippingLocation
                          ? shippingLocation.split(" ")[0]
                          : "—")}
                    </p>
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      LOCATION
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {shippingLocation || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      COURIER
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.courier?.providerName ||
                        order.courier?.providerId ||
                        "—"}
                    </p>
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      TRACKING / MEMO
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.courier?.trackingNo
                        ? order.courier.trackingNo
                        : order.courier?.memoNo
                          ? order.courier.memoNo
                          : "—"}
                    </p>
                  </div>
                </div>

                {orderNote ? (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      NOTE
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {orderNote}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      #
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Product
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Image
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Size
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Code
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Qty
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Price
                    </th>
                    <th className="px-5 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.length ? (
                    items.map((it, idx) => (
                      <tr
                        key={it.id}
                        className="border-b border-gray-100 dark:border-gray-900"
                      >
                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                          {idx + 1}
                        </td>

                        <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="font-semibold">{it.name}</div>

                            {it.brandName || it.colorName ? (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {it.brandName ? (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                    {it.brandName}
                                  </span>
                                ) : null}

                                {it.colorName ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span
                                      className="h-3 w-3 rounded-full ring-1 ring-gray-300 dark:ring-gray-700"
                                      style={{
                                        backgroundColor:
                                          it.colorHex || "#e5e7eb",
                                      }}
                                    />
                                    {it.colorName}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                          {it.size ?? "—"}
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                          {it.code ?? "—"}
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                          {it.qty}
                        </td>

                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                          {order.currencySymbol}
                          {Number(it.price || 0).toLocaleString()}
                        </td>

                        <td className="px-5 py-5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {order.currencySymbol}
                          {Number(it.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No product items found.
                      </td>
                    </tr>
                  )}

                  {/* Summary rows */}
                  <tr className="border-t border-gray-200 dark:border-gray-800">
                    <td className="px-5 py-4" colSpan={5} />
                    <td className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      = {totalQty}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Sub Total
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {order.currencySymbol}
                      {subTotal.toLocaleString()}
                    </td>
                  </tr>

                  {order.bulkDiscount > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">⚡ Bulk Discount</td>
                      <td className="px-5 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        -{order.currencySymbol}{order.bulkDiscount.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {order.comboDiscount > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">🎁 Combo Discount</td>
                      <td className="px-5 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        -{order.currencySymbol}{order.comboDiscount.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {order.cartWideDiscount > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">🏷️ Cart Discount</td>
                      <td className="px-5 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        -{order.currencySymbol}{order.cartWideDiscount.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {order.skuDiscount > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">Item Discount</td>
                      <td className="px-5 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        -{order.currencySymbol}{order.skuDiscount.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {order.couponDiscount > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">🎟️ Coupon Discount</td>
                      <td className="px-5 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        -{order.currencySymbol}{order.couponDiscount.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t border-gray-100 dark:border-gray-900">
                    <td className="px-5 py-4" colSpan={6} />
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200">
                      Paid
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-900 dark:text-white">
                      {order.currencySymbol}
                      {paid.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="border-t border-gray-100 dark:border-gray-900">
                    <td className="px-5 py-4" colSpan={6} />
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200">
                      Shipping Cost
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-900 dark:text-white">
                      {order.currencySymbol}
                      {shippingCost.toLocaleString()}
                    </td>
                  </tr>

                  {weightExtraCharge > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-900">
                      <td className="px-5 py-3" colSpan={6} />
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">
                        +Weight Surcharge
                        {weightKgTotal > 0 && (
                          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                            ({weightKgTotal.toFixed(2)} kg)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-orange-500 dark:text-orange-400">
                        +{order.currencySymbol}{weightExtraCharge.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <td className="px-5 py-4" colSpan={6} />
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Amount Due
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {order.currencySymbol}
                      {amountDue.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* small meta */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {order.orderDateLabel} {order.orderTimeLabel}
          </div>
        </div>

        {/* Footer (fixed) */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-end gap-3">
            <Button className="h-11" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
