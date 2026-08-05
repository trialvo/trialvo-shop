"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

import { useRouter } from "next/navigation";
import { API_URL, IMAGE_URL } from "@/config/env";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalName, toPublicUrl } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import HtmlContent from "@/components/product-details/extra/HtmlContent";
import ReviewSection from "@/components/review/ReviewSection";
import StarRating from "@/components/review/StarRating";
import LangToggleButton from "@/components/header/LangToggleButton";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
type Variation = {
  id: number;
  color: { id: number; name: string; name_bd?: string; hex?: string } | null;
  variant: { id: number; name: string; name_bd?: string; attribute?: { name: string; name_bd?: string } | null } | null;
  selling_price: number;
  discount: number;
  discount_type: number;
  final_price: number;
  stock: number;
  sku: string;
  weight_kg: number;
  free_delivery: boolean;
  in_stock: boolean;
};

type BulkOffer = {
  id: number;
  product_sku_id: number;
  sku: string;
  min_qty: number;
  discount_type: number;
  discount_value: number;
  free_delivery: boolean;
  sku_selling_price: number;
};

type ProductImage = { id: number; path: string; serial?: number; sku_color_id?: number | null; sku_variant_id?: number | null };

type SinglePageProduct = {
  id: number;
  name: string;
  name_bd?: string;
  slug: string;
  short_description?: string;
  long_description?: string;
  free_delivery: boolean;
  sell_count: number;
  avg_rating: number;
  review_count: number;
  images: ProductImage[];
  variations: Variation[];
  available_colors: { id: number; name: string; name_bd?: string; hex?: string }[];
  available_variants: { id: number; name: string; name_bd?: string; attribute_name?: string; attribute_name_bd?: string }[];
  bulk_offers: BulkOffer[];
  brand?: { id: number; name: string; image?: string } | null;
};

export type MiniCartItem = {
  skuId: number;
  colorName: string;
  variantName: string;
  qty: number;
  unitPrice: number;
  sellingPrice: number;
  weightKg: number;
  sku: string;
  colorId: number | null;
  variantId: number | null;
  freeDelivery: boolean;
};

export type MiniCart = {
  productId: number;
  productName: string;
  productImage: string;
  productFreeDelivery: boolean;
  bulkOffers: BulkOffer[];
  items: MiniCartItem[];
};

type Props = { slug: string; id: number | string };

// ── Helpers ──────────────────────────────────────────────────────────────────
const imgUrl = (path?: string) => {
  if (!path) return "/placeholder.webp";
  const url = toPublicUrl(path);
  return url || "/placeholder.webp";
};

const apiBase = `${API_URL.replace(/\/+$/, "")}/api/v1`;
const SOP_CART_KEY = "sop_cart";

// ── Component ────────────────────────────────────────────────────────────────
export default function SingleOrderPageClient({ slug, id }: Props) {
  const router = useRouter();
  const productId = useMemo(() => { const n = Number(id); return Number.isFinite(n) && n > 0 ? n : 0; }, [id]);
  const { trackViewContent } = useAnalytics();
  const { t, language } = useTranslation();

  const [product, setProduct] = useState<SinglePageProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [miniCart, setMiniCart] = useState<MiniCartItem[]>([]);

  // Fetch product
  useEffect(() => {
    if (!productId) { setError("Invalid product"); setLoading(false); return; }
    fetch(`${apiBase}/user/product/${productId}/single-page-data`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.product) {
          setProduct(data.product);
          const v0 = data.product.variations[0];
          if (v0?.color?.id) setSelectedColor(v0.color.id);
          if (v0?.variant?.id) setSelectedVariant(v0.variant.id);
        } else {
          setError(data.message || "Product not available");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [productId]);

  // Analytics: view_item
  useEffect(() => {
    if (!product || !product.variations[0]) return;
    trackViewContent({
      content_ids: [String(product.id)],
      content_name: product.name,
      content_type: "product",
      value: product.variations[0].final_price,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Derived
  const selectedSku = useMemo(() => {
    if (!product) return null;
    return product.variations.find(v =>
      (selectedColor === null || v.color?.id === selectedColor) &&
      (selectedVariant === null || v.variant?.id === selectedVariant)
    ) ?? product.variations[0] ?? null;
  }, [product, selectedColor, selectedVariant]);

  const unitPrice = useMemo(() => {
    if (!selectedSku) return 0;
    return selectedSku.final_price;
  }, [selectedSku]);

  // Bulk offers for selected SKU
  const skuBulkOffers = useMemo(() => {
    if (!product || !selectedSku) return [];
    return product.bulk_offers.filter(b => b.product_sku_id === selectedSku.id).sort((a, b) => a.min_qty - b.min_qty);
  }, [product, selectedSku]);

  // Filter images by selected color
  const filteredImages = useMemo(() => {
    if (!product) return [];
    if (selectedColor) {
      const colorImgs = product.images.filter(img => img.sku_color_id === selectedColor);
      if (colorImgs.length > 0) return colorImgs;
    }
    return product.images;
  }, [product, selectedColor]);

  useEffect(() => { setActiveImg(0); }, [selectedColor]);

  const miniCartTotal = useMemo(() => miniCart.reduce((s, i) => s + i.unitPrice * i.qty, 0), [miniCart]);

  // Add to mini-cart
  const addToCart = useCallback(() => {
    if (!selectedSku || !product) return;
    setMiniCart(prev => {
      const existing = prev.findIndex(i => i.skuId === selectedSku.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + qty };
        return updated;
      }
      return [...prev, {
        skuId: selectedSku.id,
        colorName: selectedSku.color ? getLocalName(selectedSku.color.name, selectedSku.color.name_bd, language) : "—",
        variantName: selectedSku.variant ? getLocalName(selectedSku.variant.name, selectedSku.variant.name_bd, language) : "—",
        qty,
        unitPrice,
        sellingPrice: selectedSku.selling_price,
        weightKg: selectedSku.weight_kg,
        sku: selectedSku.sku,
        colorId: selectedSku.color?.id ?? null,
        variantId: selectedSku.variant?.id ?? null,
        freeDelivery: selectedSku.free_delivery,
      }];
    });
    setQty(1);
  }, [selectedSku, product, qty, unitPrice, language]);

  const removeFromCart = useCallback((skuId: number) => {
    setMiniCart(prev => prev.filter(i => i.skuId !== skuId));
  }, []);

  const updateCartQty = useCallback((skuId: number, newQty: number) => {
    if (newQty < 1) return;
    setMiniCart(prev => prev.map(i => i.skuId === skuId ? { ...i, qty: newQty } : i));
  }, []);

  const proceedToCheckout = useCallback(() => {
    if (!product || miniCart.length === 0) return;
    const cart: MiniCart = {
      productId: product.id,
      productName: product.name,
      productImage: product.images[0]?.path || "",
      productFreeDelivery: product.free_delivery,
      bulkOffers: product.bulk_offers,
      items: miniCart,
    };
    sessionStorage.setItem(SOP_CART_KEY, JSON.stringify(cart));
    router.push(`/single-order-page/${slug}/${id}/checkout`);
  }, [product, miniCart, slug, id, router]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;
  if (error || !product) return <ErrorState message={error} />;

  const productName = getLocalName(product.name, product.name_bd, language);

  return (
    <div className="min-h-screen bg-white">
      {/* Header — matches parent project's header: h-17.5 with box-shadow */}
      <header data-sop="true" className="sticky top-0 z-50 bg-background h-17.5 shadow-[0px_0px_20px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto flex h-full items-center justify-between">
          <div className="flex h-17.5 items-center">
            <div className="overflow-hidden mr-8.25">
              <Link href="/" className="flex items-center gap-2 focus:outline-none" aria-label="Go to homepage">
                <img src="/logo-default.svg" alt="Graduate" width={140} height={36} className="h-11.25 w-36.25 object-contain" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangToggleButton />
          </div>
        </div>
      </header>

      <section data-sop="true" className="container mx-auto max-[501px]:pt-11.5 max-[501px]:px-2 pb-6">
        {/* ── Product Top: Gallery + Info ─────────────────────────────── */}
        <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-15 md:grid-cols-12">
          {/* Gallery */}
          <div className="flex gap-4 flex-col col-span-12 md:flex-row md:col-span-6">
            {/* Thumbnails */}
            {filteredImages.length > 1 && (
              <div className="order-2 w-full md:order-1 md:w-20">
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:h-110">
                  {filteredImages.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)}
                      className={`relative h-[72px] w-[72px] sm:h-20 sm:w-20 shrink-0 overflow-hidden border bg-white cursor-pointer transition-all duration-300 ${i === activeImg ? "border-black" : "border-[#D9D9D9]"}`}>
                      <ImageWithFallback src={imgUrl(img.path)} alt="" fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Main image */}
            <div className={`order-1 w-full ${filteredImages.length > 1 ? "md:order-2" : ""}`}>
              <div className="relative aspect-square w-full overflow-hidden border border-[#F1F1F1] bg-white">
                <ImageWithFallback
                  src={imgUrl(filteredImages[activeImg]?.path)}
                  alt={productName}
                  fill
                  preload
                  className="object-contain"
                  sizes="(max-width: 500px) 100vw, (max-width: 1024px) 100vw, 680px"
                />
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="relative col-span-12 md:col-span-6">
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-1">
                <h1 className="w-full text-base font-medium text-black sm:w-130">{productName}</h1>
                {product.brand && (
                  <div className="flex items-center gap-2 pt-1">
                    {product.brand.image && (
                      <div className="relative h-6 w-6 overflow-hidden rounded-sm border border-black/10 bg-white">
                        <ImageWithFallback src={imgUrl(product.brand.image)} alt={product.brand.name} fill className="object-contain p-0.5" sizes="24px" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-black/70">{product.brand.name}</span>
                    {selectedSku?.free_delivery && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 transition-all duration-300">
                        <span>🚚</span><span>{t("product.freeDelivery") || "Free Delivery"}</span>
                      </div>
                    )}
                  </div>
                )}
                {!product.brand && selectedSku?.free_delivery && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 transition-all duration-300">
                    <span>🚚</span><span>{t("product.freeDelivery") || "Free Delivery"}</span>
                  </div>
                )}

                {/* Rating */}
                {product.avg_rating > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <StarRating rating={product.avg_rating} size={14} />
                    <span className="text-xs text-gray-500">{product.avg_rating.toFixed(1)} ({product.review_count} {t("review.reviews") || "reviews"})</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <div className="text-base font-semibold">
                    BDT {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  {selectedSku && unitPrice < selectedSku.selling_price && (
                    <div className="text-xs text-[#888888] line-through">
                      {selectedSku.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>

              {/* SKU + Stock + Selected */}
              <div className="space-y-1 text-sm font-medium">
                <div><span className="font-medium">{t("product.sku") || "SKU"}:</span> {selectedSku?.sku || "—"}</div>
                <div><span className="font-medium">{selectedSku && selectedSku.stock > 0 ? (t("product.inStock") || "In Stock") : (t("product.outOfStock") || "Out of Stock")}</span></div>
                <div className="text-xs text-black/60">
                  {t("product.selected") || "Selected"}: {selectedSku?.variant ? getLocalName(selectedSku.variant.name, selectedSku.variant.name_bd, language) : "—"} / {selectedSku?.color ? getLocalName(selectedSku.color.name, selectedSku.color.name_bd, language) : "—"}
                </div>
              </div>

              {/* Color Picker — matches parent ColorSelector */}
              {product.available_colors.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-sm font-medium flex items-center gap-1">
                    <span>{t("product.color") || "Color"}:</span>
                    <span className="font-semibold">
                      {selectedSku?.color ? getLocalName(selectedSku.color.name, selectedSku.color.name_bd, language) : "—"}
                    </span>
                    {selectedSku?.color?.hex && (
                      <span
                        className="h-4 w-4 rounded-[2px] border border-black/10 ml-0.5"
                        style={{ backgroundColor: selectedSku.color.hex }}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.available_colors.map(c => (
                      <button key={c.id} type="button" onClick={() => setSelectedColor(c.id)}
                        className={`relative px-2.75 py-2 rounded-none border text-sm font-medium transition-all duration-300 ${selectedColor === c.id ? "bg-black text-white border-black" : "bg-white text-black border-[#999999] hover:border-black"}`}>
                        {getLocalName(c.name, c.name_bd, language)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant Picker — matches parent SizeSelector */}
              {product.available_variants.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-sm font-medium">
                    {getLocalName(product.available_variants[0]?.attribute_name || "Size", product.available_variants[0]?.attribute_name_bd, language)}:{" "}
                    <span className="font-semibold">
                      {selectedSku?.variant ? getLocalName(selectedSku.variant.name, selectedSku.variant.name_bd, language) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.available_variants.map(v => (
                      <button key={v.id} type="button" onClick={() => setSelectedVariant(v.id)}
                        className={`relative px-2.75 py-2 rounded-none border text-sm font-medium transition-all duration-300 ${selectedVariant === v.id ? "bg-black text-white border-black" : "bg-white text-black border-[#999999] hover:border-black"}`}>
                        {getLocalName(v.name, v.name_bd, language)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Discount Tiers */}
              {skuBulkOffers.length > 0 && (
                <div className="rounded-sm border border-green-200 bg-green-50/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-green-800">🎉 {t("singleOrder.bulkDiscounts") || "Bulk Discounts"}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-green-700">
                        <th className="pb-1">{t("singleOrder.minQty") || "Min Qty"}</th>
                        <th className="pb-1">{t("singleOrder.discount") || "Discount"}</th>
                        <th className="pb-1">{t("singleOrder.unitPrice") || "Unit Price"}</th>
                        <th className="pb-1">{t("singleOrder.freeDelivery") || "Free Delivery"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuBulkOffers.map(b => {
                        const disc = b.discount_type === 1 ? `${b.discount_value}%` : `৳${b.discount_value}`;
                        const bulkUnitPrice = b.discount_type === 1
                          ? b.sku_selling_price * (1 - b.discount_value / 100)
                          : b.sku_selling_price - b.discount_value;
                        return (
                          <tr key={b.id} className={`border-t border-green-200 ${qty >= b.min_qty ? "font-semibold text-green-800" : "text-green-600"}`}>
                            <td className="py-1">{b.min_qty}+</td>
                            <td className="py-1">{disc}</td>
                            <td className="py-1">৳{Math.round(bulkUnitPrice)}</td>
                            <td className="py-1">{b.free_delivery ? "✓" : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quantity — matches parent ItemQuantity */}
              <div className="space-y-1.5">
                <div className="text-sm">
                  <span className="font-medium">{t("product.quantity") || "Quantity"}:</span>{" "}
                  <span className="font-semibold">{String(qty).padStart(2, "0")}</span>
                </div>
                <div className="flex w-[100px] items-center border border-[#999999]">
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className={`flex items-center justify-center p-2.25 ${qty <= 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    aria-label="Decrease quantity"
                  >
                    <FiMinus className={`h-4.5 w-4.5 ${qty <= 1 ? "text-[#6A6678]/60" : "text-[#6A6678]"}`} />
                  </button>
                  <span className="min-w-7 text-center text-sm font-medium">
                    {String(qty).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(selectedSku?.stock ?? 99, q + 1))}
                    disabled={qty >= (selectedSku?.stock ?? 99)}
                    className={`flex items-center justify-center p-2.25 ${qty >= (selectedSku?.stock ?? 99) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    aria-label="Increase quantity"
                  >
                    <FiPlus className={`h-4.5 w-4.5 ${qty >= (selectedSku?.stock ?? 99) ? "text-[#6A6678]/60" : "text-[#6A6678]"}`} />
                  </button>
                </div>
              </div>

              {/* Add to Order */}
              <div className="flex items-center gap-4">
                <button
                  onClick={addToCart}
                  disabled={!selectedSku || selectedSku.stock === 0}
                  className="h-9 flex-1 rounded-none bg-black text-white text-sm font-semibold hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("singleOrder.addToOrder") || "Add to Order"} +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mini Cart ──────────────────────────────────────────────── */}
        {miniCart.length > 0 && (
          <div className="mb-8 border border-gray-200 bg-gray-50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">{t("singleOrder.yourOrder") || "Your Order"} ({miniCart.length})</h2>
              <span className="text-base font-bold">BDT {miniCartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-3">
              {miniCart.map(item => (
                <div key={item.skuId} className="flex items-center justify-between gap-4 bg-white p-3 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.colorName} / {item.variantName}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku} · ৳{item.unitPrice.toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(item.skuId, item.qty - 1)} className="h-7 w-7 border text-sm font-bold">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.skuId, item.qty + 1)} className="h-7 w-7 border text-sm font-bold">+</button>
                  </div>
                  <span className="text-sm font-semibold w-20 text-right">৳{(item.unitPrice * item.qty).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(item.skuId)} className="text-red-500 hover:text-red-700 text-sm font-medium">✕</button>
                </div>
              ))}
            </div>
            <button
              onClick={proceedToCheckout}
              className="mt-4 w-full h-11 bg-black text-white text-sm font-bold hover:bg-black/90"
            >
              {t("singleOrder.proceedToCheckout") || "Proceed to Checkout"} →
            </button>
          </div>
        )}

        {/* ── Description ────────────────────────────────────────────── */}
        {product.long_description && (
          <section className="w-full">
            <div className="py-2.5 border-b border-[#CACACA]">
              <h3 className="text-base font-medium text-black">{t("productDetails.description") || "Description"}</h3>
            </div>
            <div className="mt-4 space-y-6 text-sm leading-6 text-black">
              <HtmlContent html={product.long_description} className="mt-4" />
            </div>
          </section>
        )}

        {/* ── Shipping Policy ────────────────────────────────────────── */}
        <section className="w-full pt-10">
          <div className="py-2.5 border-b border-[#CACACA]">
            <h3 className="text-base font-medium text-black">{t("productDetails.shippingPolicy") || "Shipping Policy"}</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-black">
            <p>{t("singleOrder.shippingLine1") || "Free delivery across Bangladesh is available only on eligible orders. Delivery within 2-3 working days inside Dhaka, 3-5 working days outside Dhaka."}</p>
            <p>{t("singleOrder.shippingLine2") || "Delivery charge: ৳80 inside Dhaka and ৳150 outside Dhaka. If the order is not accepted at the time of delivery, this charge must be paid."}</p>
            <p className="rounded-md border border-black/10 bg-black/[0.04] px-4 py-3 font-medium">{t("singleOrder.shippingLine3") || "Additional Note: If the product weight exceeds 1kg, an extra charge of ৳30 per additional kg will be applied."}</p>
          </div>
        </section>

        {/* ── Reviews (read-only) ─────────────────────────────────── */}
        <ReviewSection productId={product.id} readOnly />

        {/* ── Sticky Bottom Bar (mobile) ──────────────────────────── */}
        {miniCart.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-60 sm:hidden border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500">{miniCart.length} item(s)</p>
                <p className="text-sm font-bold">BDT {miniCartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={proceedToCheckout} className="h-11 flex-1 bg-black text-white text-sm font-bold">
                {t("singleOrder.checkout") || "Checkout"} →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Skeleton header matching parent height */}
      <div className="h-17.5 bg-background shadow-[0px_0px_20px_rgba(0,0,0,0.08)]" />
      <div className="container mx-auto py-4">
        <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-15 md:grid-cols-12">
          <div className="md:col-span-6"><div className="aspect-square animate-pulse bg-gray-100 border border-[#F1F1F1]" /></div>
          <div className="md:col-span-6 space-y-5">
            <div className="h-6 w-3/4 animate-pulse bg-gray-100" />
            <div className="h-5 w-1/3 animate-pulse bg-gray-100" />
            <div className="h-4 w-1/2 animate-pulse bg-gray-100" />
            <div className="h-10 w-full animate-pulse bg-gray-100" />
            <div className="h-10 w-full animate-pulse bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-6xl">😕</p>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Page Not Available</h2>
        <p className="mt-2 text-gray-500">{message || "This product is not available for quick order."}</p>
      </div>
    </div>
  );
}
