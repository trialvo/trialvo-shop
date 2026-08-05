import React from "react";
import {
  Check,
  Minus,
  Palette,
  Plus,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { Modal } from "@/components/ui/modal";

import RichTextPreview from "@/components/ui/editor/RichTextPreview";

import type { CartItem, SaleProduct } from "./types";
import {
  getProduct,
  type ProductSingleResponseEntity,
  type ProductSingleVariation,
} from "@/api/products.api";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

type Props = {
  open: boolean;
  onClose: () => void;
  product: SaleProduct | null;
  onAdd: (item: CartItem) => void;
};

function formatBdt(n: number) {
  return `৳${Number.isFinite(n) ? n.toLocaleString("en-BD") : "0"}`;
}

function discountLabel(v: ProductSingleVariation) {
  const d = Number(v.discount ?? 0);
  if (!Number.isFinite(d) || d <= 0) return "-";
  return v.discount_type === 1 ? `${d}%` : formatBdt(d);
}

function getCoverImage(single: ProductSingleResponseEntity) {
  const img = single.images?.[0]?.path ?? null;
  return img ? toPublicUrl(img) : null;
}

/* ─── Reusable section label ─── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {children}
    </p>
  );
}

export default function ProductAddModal({
  open,
  onClose,
  product,
  onAdd,
}: Props) {
  const { t } = useTranslation();

  const productId = React.useMemo(() => {
    const raw = product?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [product?.id]);

  const [qty, setQty] = React.useState(1);

  const [colorId, setColorId] = React.useState<number | null>(null);
  const [variantId, setVariantId] = React.useState<number | null>(null);

  const singleQuery = useQuery({
    queryKey: ["sale-single-product", productId],
    queryFn: () => {
      if (!productId) throw new Error("Missing product id");
      return getProduct(productId);
    },
    enabled: open && Boolean(productId),
    staleTime: 30_000,
  });

  const single = singleQuery.data?.product ?? null;

  React.useEffect(() => {
    if (!open || !single) return;
    setQty(1);

    const initColor =
      single.available_colors?.[0]?.id ??
      single.variations?.[0]?.color?.id ??
      null;
    const initVariant =
      single.available_variants?.[0]?.id ??
      single.variations?.[0]?.variant?.id ??
      null;

    setColorId(initColor);
    setVariantId(initVariant);
  }, [open, single]);

  const selectedVariation = React.useMemo(() => {
    if (!single || !colorId || !variantId) return null;
    return (
      single.variations?.find(
        (v) => v.color?.id === colorId && v.variant?.id === variantId
      ) ?? null
    );
  }, [single, colorId, variantId]);

  const images = React.useMemo(() => {
    if (!single) return [];
    const list = Array.isArray(single.images) ? single.images : [];
    return list.map((i) => ({ ...i, path: toPublicUrl(i.path) }));
  }, [single]);

  const canAdd =
    Boolean(selectedVariation?.id) &&
    qty > 0 &&
    selectedVariation?.in_stock !== false;

  const key = React.useMemo(() => {
    if (!single || !selectedVariation) return "";
    return `p:${single.id}__pv:${selectedVariation.id}`;
  }, [single, selectedVariation]);

  const unitPrice = Number(
    selectedVariation?.final_price ?? selectedVariation?.selling_price ?? 0
  );
  const sku = String(selectedVariation?.sku ?? "");

  const buyingPrice = Number(selectedVariation?.buying_price ?? 0);
  const sellingPrice = Number(selectedVariation?.selling_price ?? 0);
  const finalPrice = Number(selectedVariation?.final_price ?? sellingPrice);
  const profit = Number.isFinite(finalPrice - buyingPrice)
    ? finalPrice - buyingPrice
    : 0;

  const title =
    single?.name ?? String(product?.name ?? product?.title ?? "Product");

  const brandImg = single?.brand?.image
    ? toPublicUrl(single.brand.image)
    : null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="w-full max-w-[1100px] overflow-hidden rounded-xl"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("sales.selectColorVariant")}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Body scroll ── */}
      <div className="max-h-[calc(100dvh-220px)] overflow-auto custom-scrollbar px-6 py-6">
        {singleQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-700">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t("sales.loadingProduct")}
            </p>
          </div>
        ) : singleQuery.isError ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-sm text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-200">
            {t("sales.failedToLoadProduct")}
          </div>
        ) : single ? (
          <div className="grid grid-cols-12 gap-6">
            {/* ═══ LEFT: Images + Brand ═══ */}
            <div className="col-span-12 lg:col-span-5">
              {/* Image carousel */}
              <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
                {images.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                  >
                    {images.map((img) => (
                      <SwiperSlide key={img.id}>
                        <img
                          src={img.path}
                          alt={title}
                          className="h-[320px] w-full object-cover sm:h-[360px]"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="flex h-[320px] items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-white/[0.03] dark:text-gray-500 sm:h-[360px]">
                    {t("sales.noImages")}
                  </div>
                )}

                {/* SKU + Stock chips */}
                <div className="grid grid-cols-2 gap-2 p-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("sales.sku")}</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-gray-800 dark:text-gray-200">
                      {sku || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("sales.stock")}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs font-bold",
                        selectedVariation?.in_stock
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-error-600 dark:text-error-400"
                      )}
                    >
                      {selectedVariation ? `${selectedVariation.stock}` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand + Category + Attribute */}
              <div className="mt-4 rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  {brandImg ? (
                    <img
                      src={brandImg}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-gray-100 object-cover dark:border-gray-800"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.04]">
                      <Sparkles className="h-4 w-4 text-gray-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("sales.brand")}</p>
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {single.brand?.name ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("sales.category")}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {single.main_category?.name ?? "—"} •{" "}
                      {single.sub_category?.name ?? "—"} •{" "}
                      {single.child_category?.name ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("sales.attribute")}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {single.attribute?.name ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {single.status ? (
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {t("sales.active")}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-error-50 px-2.5 py-1 text-[10px] font-bold text-error-700 dark:bg-error-500/10 dark:text-error-300">
                      {t("sales.inactive")}
                    </span>
                  )}
                  {single.featured ? (
                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      {t("sales.featured")}
                    </span>
                  ) : null}
                  {single.best_deal ? (
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      {t("sales.bestDeal")}
                    </span>
                  ) : null}
                  {single.free_delivery ? (
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                      {t("sales.freeDelivery")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Selectors + Pricing ═══ */}
            <div className="col-span-12 lg:col-span-7 space-y-5">
              {/* Color + Variant Selectors */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                {/* Colors */}
                <div>
                  <Label>{t("sales.colors")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(single.available_colors ?? []).map((c) => {
                      const active = c.id === colorId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColorId(c.id)}
                          className={cn(
                            "group/color relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-all",
                            active
                              ? "bg-gradient-to-b from-brand-50 to-brand-100/50 text-brand-700 ring-brand-400 dark:from-brand-500/15 dark:to-brand-500/5 dark:text-brand-400 dark:ring-brand-500/60"
                              : "bg-white text-gray-700 ring-gray-200 hover:ring-gray-300 hover:shadow-sm dark:bg-gray-800/60 dark:text-gray-200 dark:ring-gray-700 dark:hover:ring-gray-600"
                          )}
                          title={c.name}
                        >
                          <span className="relative">
                            <span
                              className={cn(
                                "block h-5 w-5 rounded-full ring-1 ring-black/10 dark:ring-white/10",
                                active && "ring-2 ring-brand-500/40"
                              )}
                              style={{ backgroundColor: c.hex ?? "#E5E7EB" }}
                            />
                            {active && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 text-white">
                                <Check className="h-2 w-2" strokeWidth={3} />
                              </span>
                            )}
                          </span>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Variants */}
                <div className="mt-5">
                  <Label>{t("sales.variantsLabel")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(single.available_variants ?? []).map((v) => {
                      const active = v.id === variantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariantId(v.id)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition-all",
                            active
                              ? "bg-gradient-to-b from-brand-50 to-brand-100/50 text-brand-700 ring-brand-400 shadow-sm dark:from-brand-500/15 dark:to-brand-500/5 dark:text-brand-400 dark:ring-brand-500/60"
                              : "bg-white text-gray-700 ring-gray-200 hover:ring-gray-300 hover:shadow-sm dark:bg-gray-800/60 dark:text-gray-200 dark:ring-gray-700 dark:hover:ring-gray-600"
                          )}
                          title={v.attribute_name}
                        >
                          {/* Checkbox circle */}
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                              active
                                ? "border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-500"
                                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                            )}
                          >
                            {active && (
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            )}
                          </span>
                          {v.name}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                    {single.available_variants?.[0]?.attribute_name ?? ""}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
                <Label>{t("sales.pricingDetails")}</Label>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("sales.selected")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {selectedVariation
                        ? `${selectedVariation.color.name} • ${selectedVariation.variant.name}`
                        : t("sales.selectColorAndVariant")}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {t("sales.discountLbl")}:{" "}
                      {selectedVariation
                        ? discountLabel(selectedVariation)
                        : "—"}
                    </p>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("sales.buyingLabel")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {formatBdt(buyingPrice)}
                    </p>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("sales.sellingLabel")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {formatBdt(sellingPrice)}
                    </p>
                  </div>

                  <div className="col-span-4 sm:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t("sales.finalLabel")}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-brand-600 dark:text-brand-400">
                      {formatBdt(finalPrice)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {t("sales.profitLabel")}:{" "}
                      <span
                        className={cn(
                          "font-bold",
                          profit >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-error-600 dark:text-error-400"
                        )}
                      >
                        {formatBdt(profit)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Qty + Actions */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  {/* Quantity */}
                  <div>
                    <Label>{t("sales.quantity")}</Label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQty((x) => Math.max(1, x - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                      >
                        <Minus size={16} />
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) =>
                          setQty(Math.max(1, Number(e.target.value)))
                        }
                        className="h-10 w-20 rounded-xl border border-gray-200 text-center text-sm font-bold text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => setQty((x) => x + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={onClose}
                    >
                      {t("sales.cancel")}
                    </button>

                    <button
                      type="button"
                      disabled={!canAdd}
                      className={cn(
                        "flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition",
                        canAdd
                          ? "bg-brand-600 shadow-md hover:bg-brand-700"
                          : "cursor-not-allowed bg-brand-500/50"
                      )}
                      onClick={() => {
                        if (!single || !selectedVariation) return;
                        if (!selectedVariation.in_stock) {
                          toast.error(t("sales.outOfStock"));
                          return;
                        }

                        const img =
                          getCoverImage(single) ?? images[0]?.path ?? "";

                        // Compute per-unit SKU discount amount
                        const sellingP = Number(selectedVariation.selling_price ?? 0);
                        const discountAmt =
                          selectedVariation.discount_type === 1
                            ? Math.round((sellingP * Number(selectedVariation.discount ?? 0)) / 100)
                            : Number(selectedVariation.discount ?? 0);

                        const item: CartItem = {
                          key,
                          productId: single.id,
                          productVariationId: selectedVariation.id,
                          title: single.name,
                          sku: selectedVariation.sku,
                          image: img || "",
                          // unitPrice = final price already (selling_price - discount)
                          unitPrice,
                          originalPrice: sellingP,
                          discount: discountAmt,
                          // COALESCE: SKU-level free_delivery overrides product-level (mirrors backend SQL)
                          freeDelivery: selectedVariation.free_delivery != null
                            ? Boolean(selectedVariation.free_delivery)
                            : Boolean(single.free_delivery),
                          qty,
                          weight_kg: Number(selectedVariation.weight_kg ?? 0),

                          // display
                          colorName: selectedVariation.color.name,
                          variantName: selectedVariation.variant.name,

                          // legacy optional fields
                          variant: selectedVariation.color.name,
                          size: selectedVariation.variant.name,
                        };

                        onAdd(item);
                        onClose();
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t("sales.addToCart")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Long Description */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <Label>{t("sales.longDescription")}</Label>
                <RichTextPreview html={single.long_description ?? ""} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
