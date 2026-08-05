import type React from "react";
import { useMemo, useState } from "react";
import { ShoppingCart, Trash2, Plus, Save, AlertCircle, Loader2, Truck, Check, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";

import type { OrderProductLine } from "./types";
import { getProduct, type ProductSingleResponseEntity } from "@/api/products.api";
import { getColors } from "@/api/colors.api";
import { getDeliveryCharges, type DeliveryChargeEntity } from "@/api/delivery-charges.api";
import { deliveryTypeLabel } from "@/components/business-settings/delivery/types";
import { toPublicUrl } from "@/utils/toPublicUrl";
import AddProductModal from "./AddProductModal";

interface ProductCalculationsCardProps {
  products: OrderProductLine[];
  onChangeLine: (id: string, patch: Partial<OrderProductLine>) => void;
  onDeleteLine: (id: string) => void;
  onAddLine: (line: OrderProductLine) => void;

  deliveryCharge: number;
  specialDiscount: number;
  advancePayment: number;
  weightKgTotal?: number;
  weightExtraCharge?: number;
  onChangeTotals: (patch: {
    deliveryCharge?: number;
    specialDiscount?: number;
    advancePayment?: number;
  }) => void;

  totals: {
    itemCount: number;
    originalTotal: number;
    productDiscount: number;
    subTotal: number;
    taxTotal: number;
    grandTotal: number;
    payable: number;
    bulkDiscountTotal?: number;
    comboDiscountTotal?: number;
    cartWideDiscount?: number;
    couponDiscount?: number;
  };

  onSubmit: () => void;
}

const formatBDT = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/* ───────────────────────────────────────────
   Product Row — Dynamic Color / Size
   ─────────────────────────────────────────── */

interface ProductRowProps {
  p: OrderProductLine;
  idx: number;
  onChangeLine: (id: string, patch: Partial<OrderProductLine>) => void;
  onDeleteLine: (id: string) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  p,
  idx,
  onChangeLine,
  onDeleteLine,
}) => {
  const { t } = useTranslation();

  // Fetch product details for dynamic size/variant options
  const productQuery = useQuery({
    queryKey: ["product", p.productId],
    queryFn: () => getProduct(p.productId!),
    enabled: Boolean(p.productId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const productData: ProductSingleResponseEntity | undefined =
    productQuery.data?.product;

  // Fetch ALL colors from colors API
  const colorsQuery = useQuery({
    queryKey: ["colors-all"],
    queryFn: () => getColors({ limit: 500 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Build color options from ALL colors
  const colorOptions = useMemo(() => {
    const allColors = colorsQuery.data?.data;
    if (!allColors?.length) {
      // Fallback: show current color only
      return p.color && p.color !== "N/A"
        ? [{ value: String(p.colorId ?? p.color), label: p.color }]
        : [];
    }
    return allColors.map((c) => ({
      value: String(c.id),
      label: c.name,
    }));
  }, [colorsQuery.data?.data, p.color, p.colorId]);

  // Build size/variant options from product data
  const variantOptions = useMemo(() => {
    if (!productData?.available_variants?.length) {
      // Fallback: show current size only
      return p.size && p.size !== "N/A"
        ? [{ value: String(p.variantId ?? p.size), label: p.size }]
        : [];
    }
    return productData.available_variants.map((v) => ({
      value: String(v.id),
      label: v.name,
    }));
  }, [productData?.available_variants, p.size, p.variantId]);

  // Resolve the matching variation when color or size changes
  const findVariation = (colorId: number, variantId: number) => {
    if (!productData?.variations) return null;
    return productData.variations.find(
      (v) => v.color.id === colorId && v.variant.id === variantId,
    );
  };

  const handleColorChange = (val: string) => {
    const newColorId = Number(val);
    const allColors = colorsQuery.data?.data;
    const selectedColor = allColors?.find((c) => c.id === newColorId);

    const patch: Partial<OrderProductLine> = {
      colorId: newColorId,
      color: selectedColor?.name ?? p.color,
      colorHex: selectedColor?.hex ?? null,
    };

    // Try to find the matching variation with current variant
    if (p.variantId) {
      const variation = findVariation(newColorId, p.variantId);
      if (variation) {
        patch.unitPrice = variation.selling_price;
        patch.discount = variation.discount;
        patch.sku = variation.sku;
        patch.productSkuId = variation.id;
      }
    }

    onChangeLine(p.id, patch);
  };

  const handleSizeChange = (val: string) => {
    const newVariantId = Number(val);
    const selectedVariant = productData?.available_variants?.find(
      (v) => v.id === newVariantId,
    );

    const patch: Partial<OrderProductLine> = {
      variantId: newVariantId,
      size: selectedVariant?.name ?? p.size,
      attributeId: selectedVariant?.attribute_id ?? p.attributeId,
    };

    // Try to find the matching variation with current color
    if (p.colorId) {
      const variation = findVariation(p.colorId, newVariantId);
      if (variation) {
        patch.unitPrice = variation.selling_price;
        patch.discount = variation.discount;
        patch.sku = variation.sku;
        patch.productSkuId = variation.id;
      }
    }

    onChangeLine(p.id, patch);
  };

  const lineBaseTotal = Math.max(0, p.unitPrice - p.discount) * p.quantity;
  const lineTotal = lineBaseTotal;

  // Check stock status
  const currentVariation = useMemo(() => {
    if (!productData?.variations || !p.colorId || !p.variantId) return null;
    return productData.variations.find(
      (v) => v.color.id === p.colorId && v.variant.id === p.variantId,
    );
  }, [productData?.variations, p.colorId, p.variantId]);

  const isOutOfStock = currentVariation ? !currentVariation.in_stock : false;

  return (
    <tr
      className={`border-t border-gray-100 text-sm transition-colors hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/30 ${isOutOfStock ? "bg-red-50/40 dark:bg-red-900/10" : ""
        }`}
    >
      <td className="px-4 py-4 align-top text-gray-400 dark:text-gray-500">
        {String(idx + 1).padStart(2, "0")}
      </td>

      <td className="px-4 py-4 align-top text-gray-600 dark:text-gray-300">
        {p.id}
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-[220px]">
            <div className="font-semibold text-gray-900 dark:text-white">
              {p.name}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              SKU: {p.sku}
            </div>
            {isOutOfStock && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={12} />
                Out of Stock
              </div>
            )}
            {currentVariation && currentVariation.stock > 0 && (
              <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Stock: {currentVariation.stock}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="w-[140px]">
          {colorsQuery.isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <Select
                options={
                  colorOptions.length > 0
                    ? colorOptions
                    : [{ value: p.color, label: p.color }]
                }
                value={
                  p.colorId ? String(p.colorId) : p.color
                }
                onChange={handleColorChange}
                className="bg-white dark:bg-gray-800/50"
              />
              {p.colorHex && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: p.colorHex }}
                  />
                  <span className="text-[10px] uppercase text-gray-400">
                    {p.colorHex}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="w-[120px]">
          {productQuery.isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          ) : (
            <Select
              options={
                variantOptions.length > 0
                  ? variantOptions
                  : [{ value: p.size, label: p.size }]
              }
              value={
                p.variantId ? String(p.variantId) : p.size
              }
              onChange={handleSizeChange}
              className="bg-white dark:bg-gray-800/50"
            />
          )}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="w-[80px]">
          <Input
            type="number"
            value={p.weight_kg ?? 0}
            onChange={(e) =>
              onChangeLine(p.id, {
                weight_kg: Math.max(0, Number(e.target.value)),
              })
            }
            className="bg-white dark:bg-gray-800/50"
          />
          <p className="mt-0.5 text-[10px] text-gray-400">kg</p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="w-[110px]">
          <Input
            type="number"
            value={p.discount}
            onChange={(e) =>
              onChangeLine(p.id, {
                discount: Number(e.target.value),
              })
            }
            className="bg-white dark:bg-gray-800/50"
          />
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="min-w-[120px] font-semibold text-gray-900 dark:text-white">
          {formatBDT(p.unitPrice)} BDT
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="w-[90px]">
          <Input
            type="number"
            value={p.quantity}
            onChange={(e) =>
              onChangeLine(p.id, {
                quantity: Math.max(1, Number(e.target.value)),
              })
            }
            className="bg-white dark:bg-gray-800/50"
          />
        </div>
      </td>

      <td className="px-4 py-4 align-top text-right">
        <div className="min-w-[120px] font-bold text-gray-900 dark:text-white">
          {formatBDT(lineTotal)} BDT
        </div>
      </td>

      <td className="px-4 py-4 align-top text-right">
        <Button
          variant="danger"
          size="icon"
          onClick={() => onDeleteLine(p.id)}
          ariaLabel="Delete line item"
          startIcon={<Trash2 size={15} />}
        />
      </td>
    </tr>
  );
};

/* ───────────────────────────────────────────
   Main Card
   ─────────────────────────────────────────── */

const ProductCalculationsCard: React.FC<ProductCalculationsCardProps> = ({
  products,
  onChangeLine,
  onDeleteLine,
  onAddLine,
  deliveryCharge,
  specialDiscount,
  advancePayment,
  weightKgTotal,
  weightExtraCharge,
  onChangeTotals,
  totals,
  onSubmit,
}) => {
  const { t } = useTranslation();

  // Fetch delivery options from API
  const deliveryQuery = useQuery({
    queryKey: ["delivery-charges-all"],
    queryFn: () => getDeliveryCharges({ limit: 50 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const deliveryOptions: DeliveryChargeEntity[] = useMemo(() => {
    return deliveryQuery.data?.data ?? [];
  }, [deliveryQuery.data]);

  const [showAddModal, setShowAddModal] = useState(false);
  // Admin-override: Free Delivery toggle
  const [adminFreeDelivery, setAdminFreeDelivery] = useState(false);
  // Track explicitly selected delivery option by ID (null = nothing selected yet)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const handleToggleFreeDelivery = () => {
    if (!adminFreeDelivery) {
      // Enable: zero out delivery charge, clear any option selection
      onChangeTotals({ deliveryCharge: 0 });
      setSelectedOptionId(null);
    }
    // Disable: leave deliveryCharge as is (admin re-selects from options)
    setAdminFreeDelivery((prev) => !prev);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <ShoppingCart size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              {t("orders.orderEditor.lineItems")}
            </div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {t("orders.orderEditor.productsPricing")}
            </div>
          </div>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" variant="outline" startIcon={<Plus size={14} />}>
          {t("orders.orderEditor.addProduct")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-[980px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <th className="px-4 py-3">{t("orders.orderEditor.sn")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.id")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.product")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.color")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.size")}</th>
              <th className="px-4 py-3">Weight (kg)</th>
              <th className="px-4 py-3">{t("orders.orderEditor.discount")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.unitPrice")}</th>
              <th className="px-4 py-3">{t("orders.orderEditor.quantity")}</th>
              <th className="px-4 py-3 text-right">{t("orders.orderEditor.total")}</th>
              <th className="px-4 py-3 text-right">{t("orders.orderEditor.action")}</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p, idx) => (
              <ProductRow
                key={p.id}
                p={p}
                idx={idx}
                onChangeLine={onChangeLine}
                onDeleteLine={onDeleteLine}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: delivery option cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.deliveryOption", "Delivery Option")}
              </span>
            </div>
            {/* Free Delivery Admin Toggle */}
            <button
              type="button"
              onClick={handleToggleFreeDelivery}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                adminFreeDelivery
                  ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                  : "border border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-400"
              }`}
            >
              <Gift size={12} />
              {adminFreeDelivery ? "✓ Free Delivery" : "Set Free Delivery"}
            </button>
          </div>

          {deliveryQuery.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              {t("orders.orderEditor.loadingDelivery", "Loading delivery options...")}
            </div>
          ) : adminFreeDelivery ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 dark:border-emerald-500/50 dark:bg-emerald-500/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
                <Gift size={18} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Free Delivery</div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Delivery charge waived by admin</div>
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">৳0</div>
            </div>
          ) : deliveryOptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-400 dark:border-gray-700">
              {t("orders.orderEditor.noDeliveryOptions", "No delivery options available")}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {deliveryOptions.map((opt) => {
                // Only show as selected if the admin explicitly clicked this option
                const isSelected = selectedOptionId === opt.id;
                const imgSrc = opt.img_path ? toPublicUrl(opt.img_path) : null;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedOptionId(opt.id);
                      onChangeTotals({ deliveryCharge: opt.customer_charge });
                    }}
                    className={`group relative flex items-center gap-3.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 ${isSelected
                      ? "border-brand-500 bg-gradient-to-r from-brand-50 to-white shadow-sm ring-1 ring-brand-200 dark:border-brand-400 dark:from-brand-500/10 dark:to-gray-900 dark:ring-brand-500/30"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600"
                      }`}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 shadow-sm dark:bg-brand-400">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}

                    {/* Icon / Image */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${isSelected
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-500"
                        }`}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={opt.title}
                          className="h-6 w-6 rounded object-contain"
                        />
                      ) : (
                        <Truck size={18} />
                      )}
                    </div>

                    {/* Title + Type */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {opt.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-block rounded-full px-2 py-px text-[10px] font-medium ${isSelected
                            ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {deliveryTypeLabel(opt.type)}
                        </span>
                        {opt.our_charge > 0 && opt.our_charge !== opt.customer_charge && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            Cost: ৳{formatBDT(opt.our_charge)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div
                      className={`shrink-0 text-base font-bold ${isSelected
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-gray-800 dark:text-gray-200"
                        }`}
                    >
                      ৳{formatBDT(opt.customer_charge)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: pricing breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
            {t("orders.orderEditor.pricingBreakdown", "Pricing Breakdown")}
          </div>

          <div className="space-y-0 divide-y divide-gray-200/60 dark:divide-gray-700/60">
            {/* Total Items */}
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.totalItems", "Total Items")}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {totals.itemCount}
              </span>
            </div>

            {/* Unit Price (original total) */}
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.unitPriceTotal", "Unit Price")}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ৳{formatBDT(totals.originalTotal)}
              </span>
            </div>

            {/* Item Discount (per-SKU) */}
            {totals.productDiscount > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("orders.orderEditor.itemDiscount", "Item Discount")}
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  −৳{formatBDT(totals.productDiscount)}
                </span>
              </div>
            )}

            {/* Delivery Charge */}
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.deliveryCharge")}
              </span>
              {adminFreeDelivery ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Gift size={10} /> Free (Waived)
                </span>
              ) : (
                <span className="font-semibold text-gray-900 dark:text-white">
                  +৳{formatBDT(deliveryCharge)}
                </span>
              )}
            </div>

            {/* Weight Surcharge — only shown when > 0 */}
            {(weightExtraCharge ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  ⚖ Weight surcharge
                  {(weightKgTotal ?? 0) > 0 && (
                    <span className="ml-1 text-[10px] text-gray-400">
                      ({weightKgTotal?.toFixed(2)} kg)
                    </span>
                  )}
                </span>
                <span className="font-semibold text-orange-500 dark:text-orange-400">
                  +৳{formatBDT(weightExtraCharge ?? 0)}
                </span>
              </div>
            )}

            {/* Bulk Discount — from API (read-only snapshot) */}
            {(totals.bulkDiscountTotal ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">⚡ Bulk Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  −৳{formatBDT(totals.bulkDiscountTotal ?? 0)}
                </span>
              </div>
            )}

            {/* Combo Discount */}
            {(totals.comboDiscountTotal ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">🎁 Combo Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  −৳{formatBDT(totals.comboDiscountTotal ?? 0)}
                </span>
              </div>
            )}

            {/* Cart Wide Discount */}
            {(totals.cartWideDiscount ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">🏷️ Cart Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  −৳{formatBDT(totals.cartWideDiscount ?? 0)}
                </span>
              </div>
            )}

            {/* Coupon Discount */}
            {(totals.couponDiscount ?? 0) > 0 && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">🎟️ Coupon Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  −৳{formatBDT(totals.couponDiscount ?? 0)}
                </span>
              </div>
            )}

            {/* Total Payable */}
            <div className="flex items-center justify-between pt-3.5 pb-1 text-sm">
              <span className="font-bold text-gray-800 dark:text-gray-100">
                {t("orders.orderEditor.totalPayable", "Total Payable")}
              </span>
              <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                ৳{formatBDT(totals.grandTotal)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={onSubmit} size="md" variant="primary" startIcon={<Save size={16} />}>
              {t("common.update")}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(line) => {
          onAddLine(line);
          setShowAddModal(false);
        }}
      />
    </div>
  );
};

export default ProductCalculationsCard;
