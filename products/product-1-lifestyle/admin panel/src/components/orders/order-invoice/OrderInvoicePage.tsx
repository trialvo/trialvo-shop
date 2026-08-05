import { useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import BrandLogo from "@/components/common/BrandLogo";
import { useAppBranding } from "@/context/AppBrandingContext";
import { getAdminOrderById, ordersKeys, type ApiOrder } from "@/api/orders.api";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { cn } from "@/lib/utils";
import { amountToWords } from "@/utils/numberToWords";

function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function safeNumber(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatBDT(n: unknown): string {
  const v = safeNumber(n);
  try {
    return `৳${v.toLocaleString(undefined)}`;
  } catch {
    return `৳${String(v)}`;
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function paymentMethodLabel(order: ApiOrder) {
  if (order.payment_type === "cod") return "COD";

  const provider = [...(order.payments ?? [])]
    .reverse()
    .find((p) => (p?.provider ?? "").trim())?.provider;

  const p = (provider ?? "").toLowerCase();
  if (p === "bkash") return "BKASH";
  if (p === "nagad") return "NAGAD";
  if (p === "rocket") return "ROCKET";
  if (p === "sslcommerz") return "SSLCOMMERZ";
  if (p === "shurjopay") return "SHURJOPAY";

  return order.payment_type === "gateway" ? "CARD" : "MIXED";
}

function upperOrDash(v?: string | null) {
  const s = (v ?? "").trim();
  return s ? s.toUpperCase() : "—";
}

export default function OrderInvoicePage() {
  const { t } = useTranslation();
  const { branding } = useAppBranding();
  const { orderId } = useParams();
  const searchParams = useSearchParams();

  const autoPrint = searchParams.get("print") === "1";
  const printedRef = useRef(false);

  const numericId = useMemo(() => {
    const n = Number(orderId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [orderId]);

  const orderQuery = useQuery({
    queryKey: numericId ? ordersKeys.detail(numericId) : ordersKeys.detail("invalid"),
    queryFn: () => {
      if (!numericId) throw new Error(t("orders.invoice.missingOrderId"));
      return getAdminOrderById(numericId);
    },
    enabled: Boolean(numericId),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const order = orderQuery.data?.data;
  const courier = order?.couriers?.[0];
  const created = order?.created_at ? formatDateTime(order.created_at) : null;

  const addressLine = useMemo(() => {
    if (!order) return "—";
    const base = `${order.full_address ?? ""}`.trim();
    const city = `${order.city ?? ""}`.trim();
    const zip = `${order.zip_code ?? ""}`.trim();

    const parts = [base, city].filter(Boolean);
    const head = parts.reduce((acc, s) => (acc ? `${acc}, ${s}` : s), "");
    return zip ? `${head} - ${zip}` : head || "—";
  }, [order]);

  const productRows = useMemo(() => {
    const items = order?.items ?? [];
    return items.map((it, idx) => {
      const name = (it.product_name ?? "").trim() || "—";
      const qty = safeNumber(it.quantity);
      const originalPrice = safeNumber(it.selling_price);
      const finalPrice = safeNumber(it.final_unit_price ?? it.selling_price);
      const discountAmount = originalPrice - finalPrice;
      const total = safeNumber(it.line_total ?? finalPrice * qty);
      const img = it.product_image ? toPublicUrl(it.product_image) : null;

      const variant = (it.variant_name ?? "").trim();
      const color = (it.color_name ?? "").trim();
      const brand = (it.brand_name ?? "").trim();
      const sku = (it.sku ?? "").trim();
      const meta = [brand, color, variant, sku ? `SKU: ${sku}` : ""]
        .filter(Boolean)
        .reduce((acc, s) => (acc ? `${acc} • ${s}` : s), "");

      return { sl: idx + 1, id: it.id, name, qty, originalPrice, discountAmount, total, img, meta };
    });
  }, [order]);

  const invoiceMeta = useMemo(() => {
    const orderNo = order?.id ? `#${order.id}` : "—";
    const payMethod = order ? paymentMethodLabel(order) : "—";
    const payStatus = upperOrDash(order?.payment_status);
    const ordStatus = upperOrDash(order?.order_status);
    const dueDate = "—";
    return { orderNo, payMethod, payStatus, ordStatus, dueDate };
  }, [order]);

  useEffect(() => {
    if (!autoPrint) return;
    if (!orderQuery.isSuccess) return;
    if (printedRef.current) return;
    printedRef.current = true;

    const t = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 250);

    const onAfterPrint = () => {
      try {
        window.close();
      } catch {
        // ignore
      }
    };

    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [autoPrint, orderQuery.isSuccess]);

  useEffect(() => {
    if (orderQuery.isError) {
      toast.error((orderQuery.error as Error)?.message || t("orders.invoice.failedLoadInvoice"));
    }
  }, [orderQuery.isError, orderQuery.error]);

  const totals = useMemo(() => {
    return {
      subtotal: safeNumber(order?.subtotal),
      discount: safeNumber(order?.discount_total),
      delivery: safeNumber(order?.delivery_charge),
      weightKg: (courier?.weight != null && Number(courier.weight) > 0)
        ? Number(courier.weight)
        : safeNumber((order as any)?.weight_kg_total),
      weightSurcharge: safeNumber((order as any)?.weight_extra_charge),
      bulkDiscount: safeNumber((order as any)?.bulk_discount_total),
      comboDiscount: safeNumber((order as any)?.combo_discount_total),
      cartWideDiscount: safeNumber((order as any)?.cart_wide_discount),
      total: safeNumber(order?.grand_total),
      paid: safeNumber(order?.paid_amount),
      due: safeNumber(order?.due_amount),
    };
  }, [order]);

  const billedBy = useMemo(() => {
    // Company display name comes from branding so one admin serves fashion / tech / lifestyle.
    const name = branding.appName;
    const email = "graduatefashion2020@gmail.com"
    const phone = "+880 1970680283"
    const address = "House 29, Road 5, Sector 11, Uttara, Dhaka Bangladesh"
    return { name, email: email || "—", phone: phone || "—", address: address || "—" };
  }, [branding]);

  const billedTo = useMemo(() => {
    const name = (order?.customer_name ?? "").trim() || "—";
    const email = (order?.customer_email ?? "").trim() || "—";
    const phone = (order?.customer_phone ?? "").trim() || "—";
    return { name, email, phone, address: addressLine };
  }, [order, addressLine]);

  const purchasePolicy = useMemo(() => {
    // ✅ classic & short policy so it fits in 1 page even with 4/5 items
    return [
      "Products once sold are not returnable unless damaged or wrong item delivered.",
      "Please check the invoice and items at delivery time.",
      "For support, contact us within 24 hours with invoice number.",
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-950 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .invoice-sheet {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
          }

          /* ✅ Billed By / Billed To always side-by-side in print */
          .invoice-billing-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }

          /* avoid breaks */
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }

          .print-shadow-none { box-shadow: none !important; }
          .print-border-0 { border: 0 !important; }
          .print-m-0 { margin: 0 !important; }
          .print-p-0 { padding: 0 !important; }

          /* ✅ tighter print */
          .print-tight { padding: 10px !important; }
          .print-tight-y { padding-top: 10px !important; padding-bottom: 10px !important; }
        }
      `}</style>

      <div
        className={cn(
          "invoice-sheet mx-auto w-full max-w-[980px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-theme-xs",
          "dark:border-gray-800 dark:bg-gray-900",
          "print-border-0 print-shadow-none print-m-0"
        )}
      >
        {/* Header (tighter) */}
        <div className={cn("px-4 py-5 border-b border-gray-200 dark:border-gray-800", "print-tight-y avoid-break")}>
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900 dark:text-white">
                {t("orders.invoice.title")}
              </h1>

              <div className="mt-3 grid grid-cols-1 gap-1.5 text-[12px] text-gray-700 dark:text-gray-200">
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.invoiceNumber")}</p>
                  <p className="col-span-7 font-semibold">{invoiceMeta.orderNo}</p>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.invoiceDate")}</p>
                  <p className="col-span-7 font-semibold">{created?.date || "—"}</p>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.dueDate")}</p>
                  <p className="col-span-7 font-semibold">{invoiceMeta.dueDate}</p>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.paymentMethod")}</p>
                  <p className="col-span-7 font-semibold">{invoiceMeta.payMethod}</p>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.paymentStatus")}</p>
                  <p className="col-span-7 font-semibold">{invoiceMeta.payStatus}</p>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.orderStatus")}</p>
                  <p className="col-span-7 font-semibold">{invoiceMeta.ordStatus}</p>
                </div>

                {courier?.delivery_title ? (
                  <div className="grid grid-cols-12 gap-2">
                    <p className="col-span-5 text-gray-500 dark:text-gray-400">{t("orders.invoice.deliveryLabel")}</p>
                    <p className="col-span-7 font-semibold">{courier.delivery_title}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center justify-end overflow-hidden">
                <BrandLogo height={36} />
              </div>
            </div>
          </div>
        </div>

        {/* Billing (tighter) */}
        <div className={cn("px-4 py-4", "avoid-break print-tight")}>
          <div className={cn("invoice-billing-grid grid grid-cols-1 gap-3 md:grid-cols-2")}>
            <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{t("orders.invoice.billedBy")}</p>

              <div className="mt-2 space-y-0.5 text-[12px] text-gray-700 dark:text-gray-200">
                <p className="font-semibold">{billedBy.name}</p>
                <p className="text-gray-600 dark:text-gray-300">{billedBy.address}</p>
                <p>
                  <span className="font-semibold">{t("orders.invoice.emailLabel")}</span> {billedBy.email}
                </p>
                <p>
                  <span className="font-semibold">{t("orders.invoice.phoneLabel")}</span> {billedBy.phone}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{t("orders.invoice.billedTo")}</p>

              <div className="mt-2 space-y-0.5 text-[12px] text-gray-700 dark:text-gray-200">
                <p className="font-semibold">{billedTo.name}</p>
                <p className="text-gray-600 dark:text-gray-300">{billedTo.address}</p>
                <p>
                  <span className="font-semibold">{t("orders.invoice.emailLabel")}</span> {billedTo.email}
                </p>
                <p>
                  <span className="font-semibold">{t("orders.invoice.phoneLabel")}</span> {billedTo.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items (tighter row height) */}
        <div className={cn("px-4 pb-4", "avoid-break print-tight")}>
          <div className="overflow-hidden rounded-[10px] border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-950 dark:text-gray-300">
                  <th className="px-3 py-2.5 w-[46px]">#</th>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5 w-[60px] text-center">Qty</th>
                  <th className="px-3 py-2.5 w-[110px]">Original</th>
                  <th className="px-3 py-2.5 w-[110px]">Discount</th>
                  <th className="px-3 py-2.5 w-[110px] text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {orderQuery.isLoading || orderQuery.isFetching ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-gray-500 dark:text-gray-400">
                      {t("orders.invoice.loading")}
                    </td>
                  </tr>
                ) : productRows.length ? (
                  productRows.map((p) => (
                    <tr key={p.id} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                        {p.sl}
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[8px] bg-gray-50 dark:bg-gray-950">
                            {p.img ? (
                              <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gray-100 dark:bg-gray-800" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-white">
                              {p.name}
                            </p>
                            {p.meta ? (
                              <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                                {p.meta}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                        {p.qty}
                      </td>

                      <td className="px-3 py-2.5 text-[12px] text-gray-700 dark:text-gray-200">
                        {formatBDT(p.originalPrice)}
                      </td>

                      <td className="px-3 py-2.5 text-[12px] text-red-500 dark:text-red-400">
                        {p.discountAmount > 0 ? `−${formatBDT(p.discountAmount)}` : formatBDT(0)}
                      </td>

                      <td className="px-3 py-2.5 text-right text-[12px] font-semibold text-gray-900 dark:text-white">
                        {formatBDT(p.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-gray-500 dark:text-gray-400">
                      {t("orders.invoice.noItems")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className={cn("px-4 pb-2", "avoid-break print-tight")}>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7">
              <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white">{t("orders.invoice.totalInWords")}</p>
                <p className="mt-1.5 text-[12px] text-gray-600 dark:text-gray-300">
                  {amountToWords(totals.total)}
                </p>
              </div>
            </div>

            <div className="col-span-5">
              <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>{t("orders.invoice.subtotal")}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatBDT(totals.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>{t("orders.invoice.discount")}</span>
                    <span className={`font-semibold ${totals.discount > 0 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                      {totals.discount > 0 ? `−${formatBDT(totals.discount)}` : formatBDT(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>{t("orders.invoice.delivery")}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatBDT(totals.delivery)}</span>
                  </div>

                  {totals.weightSurcharge > 0 && (
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>⚖ Weight surcharge {totals.weightKg > 0 ? `(${totals.weightKg} kg)` : ""}</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">+{formatBDT(totals.weightSurcharge)}</span>
                    </div>
                  )}

                  {totals.bulkDiscount > 0 && (
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>⚡ Bulk Discount</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">−{formatBDT(totals.bulkDiscount)}</span>
                    </div>
                  )}

                  {totals.comboDiscount > 0 && (
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>🎁 Combo Discount</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">−{formatBDT(totals.comboDiscount)}</span>
                    </div>
                  )}

                  {totals.cartWideDiscount > 0 && (
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>🏷️ Cart Discount</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">−{formatBDT(totals.cartWideDiscount)}</span>
                    </div>
                  )}

                  <div className="my-2 h-px bg-gray-200 dark:bg-gray-800" />

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{t("orders.invoice.totalBDT")}</span>
                    <span className="text-[16px] font-extrabold text-gray-900 dark:text-white">{formatBDT(totals.total)}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                    <div className="rounded-[10px] border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-950">
                      <p>{t("orders.invoice.paidLabel")}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-gray-900 dark:text-white">
                        {formatBDT(totals.paid)}
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-950">
                      <p>{t("orders.invoice.dueLabel")}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-gray-900 dark:text-white">
                        {formatBDT(totals.due)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-800">
                    <div className="flex flex-col items-end">
                      <div className="h-9 w-[170px] border-b border-gray-300 dark:border-gray-700" />
                      <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">{t("orders.invoice.authorisedSignatory")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ LAST: Additional Note + Purchase Policy */}
        {/* <div className={cn("px-4 pb-5", "avoid-break print-tight")}>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7">
              <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white">Additional Note</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600 dark:text-gray-300">
                  {order?.note?.trim() || "—"}
                </p>
              </div>
            </div>

            <div className="col-span-5">
              <div className="rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white">Purchase Policy</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] text-gray-600 dark:text-gray-300">
                  {purchasePolicy.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div> */}

        {/* Footer (very tight) */}
        <div className="border-t border-gray-200 px-4 py-3 text-center text-[11px] text-gray-600 dark:border-gray-800 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-white">{t("orders.invoice.thankYou")}</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
            {t("orders.invoice.generatedOn", { date: new Date().toLocaleString() })}
          </p>
          <p className="mt-2 text-[9px] text-gray-400 dark:text-gray-500">
            Develop by{" "}
            <a href="https://trialvo.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">
              trialvo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
