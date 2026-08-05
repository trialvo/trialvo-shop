"use client";

import ColorSelector from "@/components/color-selector/ColorSelector";
import type { ColorValue } from "@/components/color-selector/types";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import ItemQuantity from "@/components/common/ItemQuantity";
import SizeSelector from "@/components/size-selector/SizeSelector";
import type { SizeValue } from "@/components/size-selector/types";
import { Button } from "@/components/ui/button";
import { useCartItemSync } from "@/hooks/useCartItemSync";
import { useGuestId } from "@/hooks/useGuestId";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import type { CreateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { cn, getFirstImage, getLocalName, toPublicUrl } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { addItem, setBuyNowId, setIsCartOpen } from "@/redux/slices/cartSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { useRouter } from "next/navigation";
import React from "react";
import { FiHeart } from "react-icons/fi";
import ShareButton from "./ShareButton";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductDetailsData, ProductDetailsVariation } from "./types";
import AddToCompareButton from "@/components/compare/AddToCompareButton";

type Props = {
  product: ProductDetailsData;
  /** Called whenever the user selects a different color */
  onColorChange?: (colorId: number) => void;
  /** Called whenever the user selects a different size/variant */
  onVariantChange?: (variantId: number) => void;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function pickActiveVariation(
  variations: ProductDetailsVariation[],
  variantId: number,
  colorId: number,
): ProductDetailsVariation | undefined {
  if (!variations.length) return undefined;

  const exact = variations.find((v) => v.variant?.id === variantId && v.color?.id === colorId);
  if (exact) return exact;

  const byVariant = variations.find((v) => v.variant?.id === variantId);
  if (byVariant) return byVariant;

  const byColor = variations.find((v) => v.color?.id === colorId);
  if (byColor) return byColor;

  return variations[0];
}

function getPrice(v?: ProductDetailsVariation): { price: number; oldPrice?: number } {
  if (!v) return { price: 0 };

  const sp = v.selling_price;
  const fp = v.final_price;

  if (isFiniteNumber(fp) && fp >= 0) {
    const old = isFiniteNumber(sp) && sp > fp ? sp : undefined;
    return { price: fp, oldPrice: old };
  }

  return { price: isFiniteNumber(sp) ? sp : 0 };
}

export const BUY_NOW_STORAGE_KEY = "BUY_NOW_ITEM";

const ProductInfoPanel: React.FC<Props> = ({ product, onColorChange, onVariantChange }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { trackViewContent, trackAddToCart: fireAddToCart } = useAnalytics();
  const handleFavoriteClick = useHandleFavoriteClick();
  const { id: guestId, loading: guestIdLoading, refresh: refreshGuestId } = useGuestId({ auto: false });
  const { createGuestOrder, isLoading: isCreatingGuestOrder } = useGuestOrder();
  const { t, language } = useTranslation();

  const sizes = product?.available_variants ?? [];
  const colors = product?.available_colors ?? [];
  const variations = product?.variations ?? [];

  const brandName = product?.brand?.name ?? "";
  const brandImg = product?.brand?.image ? toPublicUrl(product.brand.image) : "";

  const defaultVariantId = React.useMemo(() => {
    const fromVar = variations[0]?.variant?.id;
    if (typeof fromVar === "number" && fromVar > 0) return fromVar;

    const fromSizes = sizes[0]?.id;
    return typeof fromSizes === "number" && fromSizes > 0 ? fromSizes : 0;
  }, [variations, sizes]);

  const defaultColorId = React.useMemo(() => {
    const fromVar = variations[0]?.color?.id;
    if (typeof fromVar === "number" && fromVar > 0) return fromVar;

    const fromColors = colors[0]?.id;
    return typeof fromColors === "number" && fromColors > 0 ? fromColors : 0;
  }, [variations, colors]);

  const [selectedVariantId, setSelectedVariantId] = React.useState<number>(defaultVariantId);
  const [selectedColorId, setSelectedColorId] = React.useState<number>(defaultColorId);
  const [qty, setQty] = React.useState<number>(1);

  React.useEffect(() => {
    setSelectedVariantId(defaultVariantId);
    setSelectedColorId(defaultColorId);
    setQty(1);
  }, [product.id, defaultVariantId, defaultColorId]);

  /* ── Analytics: ViewContent ── */
  React.useEffect(() => {
    if (!product?.id) return;
    const { price: p } = getPrice(variations[0]);
    trackViewContent({
      content_ids: [String(product.id)],
      content_name: product?.name ?? "",
      content_type: "product",
      value: p,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const activeVariation = React.useMemo(() => {
    return pickActiveVariation(variations, selectedVariantId, selectedColorId);
  }, [variations, selectedVariantId, selectedColorId]);

  const { price, oldPrice } = React.useMemo(() => getPrice(activeVariation), [activeVariation]);

  const sku = React.useMemo(() => activeVariation?.sku ?? "", [activeVariation]);

  const isFreeDelivery = React.useMemo(() => {
    const fd = activeVariation?.free_delivery;
    return fd === true;
  }, [activeVariation]);

  const stock = React.useMemo(() => {
    const s = activeVariation?.stock;
    return typeof s === "number" && Number.isFinite(s) ? s : 0;
  }, [activeVariation]);
  const maxQty = React.useMemo(() => (stock > 0 ? Math.min(stock, 5) : 1), [stock]);

  React.useEffect(() => {
    setQty((p) => Math.min(Math.max(1, p), stock > 0 ? stock : 1));
  }, [stock]);

  const selectedSizeName = React.useMemo(() => {
    const found = sizes.find((s) => s.id === selectedVariantId);
    return found ? getLocalName(found.name, found.name_bd, language) : "";
  }, [sizes, selectedVariantId, language]);

  const selectedColorName = React.useMemo(() => {
    const found = colors.find((c) => c.id === selectedColorId);
    return found ? getLocalName(found.name, found.name_bd, language) : "";
  }, [colors, selectedColorId, language]);

  const selectedColorCode = React.useMemo(() => {
    const found = colors.find((c) => c.id === selectedColorId);
    return found?.hex ?? "";
  }, [colors, selectedColorId]);

  const sizeNames = React.useMemo<SizeValue[]>(
    () =>
      sizes
        .map((s) => getLocalName(s.name, s.name_bd, language))
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as SizeValue[],
    [sizes, language],
  );

  const colorNames = React.useMemo<ColorValue[]>(
    () =>
      colors
        .map((c) => getLocalName(c.name, c.name_bd, language))
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as ColorValue[],
    [colors, language],
  );

  /**
   * Sizes that are NOT available for the currently selected color.
   * When selectedColorId = 0 (no color chosen), nothing is marked unavailable.
   */
  const unavailableSizeNames = React.useMemo<ReadonlySet<SizeValue>>(() => {
    if (!selectedColorId) return new Set();
    const availableVariantIds = new Set(
      variations
        .filter((vr) => (vr.color?.id ?? (vr as any).color_id) === selectedColorId)
        .map((vr) => vr.variant?.id ?? (vr as any).variant_id ?? 0)
        .filter((id) => id > 0)
    );
    const unavailable = sizes
      .filter((s) => !availableVariantIds.has(s.id))
      .map((s) => getLocalName(s.name, s.name_bd, language))
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
    return new Set(unavailable as SizeValue[]);
  }, [selectedColorId, variations, sizes, language]);

  /**
   * Colors that are NOT available for the currently selected variant (size).
   * When selectedVariantId = 0, nothing is marked unavailable.
   */
  const unavailableColorNames = React.useMemo<ReadonlySet<ColorValue>>(() => {
    if (!selectedVariantId) return new Set();
    const availableColorIds = new Set(
      variations
        .filter((vr) => (vr.variant?.id ?? (vr as any).variant_id) === selectedVariantId)
        .map((vr) => vr.color?.id ?? (vr as any).color_id ?? 0)
        .filter((id) => id > 0)
    );
    const unavailable = colors
      .filter((c) => !availableColorIds.has(c.id))
      .map((c) => getLocalName(c.name, c.name_bd, language))
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
    return new Set(unavailable as ColorValue[]);
  }, [selectedVariantId, variations, colors, language]);

  const handleSizeChange = (v: SizeValue) => {
    const displayName = String(v);
    const found = sizes.find(
      (x) => getLocalName(x.name, x.name_bd, language) === displayName,
    );
    const newVariantId = found?.id ?? 0;
    setSelectedVariantId(newVariantId);
    onVariantChange?.(newVariantId);

    // If current color doesn't have this size, auto-switch to first color that does
    const colorIdsForNewVariant = variations
      .filter((vr) => (vr.variant?.id ?? (vr as any).variant_id) === newVariantId)
      .map((vr) => vr.color?.id ?? (vr as any).color_id ?? 0)
      .filter((id) => id > 0);

    if (selectedColorId > 0 && colorIdsForNewVariant.length > 0 && !colorIdsForNewVariant.includes(selectedColorId)) {
      const fallbackColorId = colorIdsForNewVariant[0];
      setSelectedColorId(fallbackColorId);
      onColorChange?.(fallbackColorId);
    }
  };

  const handleColorChange = (v: ColorValue) => {
    const displayName = String(v);
    const found = colors.find(
      (x) => getLocalName(x.name, x.name_bd, language) === displayName,
    );
    const newColorId = found?.id ?? 0;
    setSelectedColorId(newColorId);
    onColorChange?.(newColorId);

    // If the currently selected size isn't available for the new color, reset it
    const variantIdsForNewColor = variations
      .filter((vr) => (vr.color?.id ?? (vr as any).color_id) === newColorId)
      .map((vr) => vr.variant?.id ?? (vr as any).variant_id ?? 0)
      .filter((id) => id > 0);

    if (selectedVariantId > 0 && !variantIdsForNewColor.includes(selectedVariantId)) {
      // Pick first available size for new color, or clear
      const fallbackVariantId = variantIdsForNewColor[0] ?? 0;
      setSelectedVariantId(fallbackVariantId);
      onVariantChange?.(fallbackVariantId);
    }
  };

  const { isInCart } = useCartItemSync({
    productId: String(product.id),
    size: selectedSizeName,
    color: selectedColorName,
    stock,
  });

  const productVariationId = activeVariation?.id ?? 0;

  const itemToOrder = React.useMemo(
    () => ({
      productId: String(product.id),
      title: product?.name ?? "",
      productVariationId,
      image: getFirstImage(product) ?? "",
      price,
      discount: activeVariation?.discount,
      originalPrice: typeof oldPrice === "number" ? oldPrice : 0,
      size: selectedSizeName || "N/A",
      color: selectedColorName || "N/A",
      quantity: qty,
      stock,
      sku: sku || undefined,
      variantId: selectedVariantId || undefined,
      colorId: selectedColorId || undefined,
      weight_kg: typeof activeVariation?.weight_kg === "number" && activeVariation.weight_kg > 0
        ? activeVariation.weight_kg
        : undefined,
    }),
    [
      productVariationId,
      product,
      price,
      oldPrice,
      activeVariation?.discount,
      selectedSizeName,
      selectedColorName,
      qty,
      stock,
      sku,
      selectedVariantId,
      selectedColorId,
    ],
  );

  const handleAddToCart = () => {
    if (!product?.id) return;
    dispatch(addItem(itemToOrder));
    fireAddToCart({
      content_ids: [String(product.id)],
      content_name: product?.name ?? "",
      content_type: "product",
      value: price * qty,
      quantity: qty,
    });
  };

  const handleBuyNow = async () => {
    dispatch(setIsCartOpen(false));
    if (!product?.id) return;

    if (isInCart) {
      dispatch(setIsCartOpen(true));
      dispatch(openDrawer({ key: "cart" }));
    } else {
      handleAddToCart();
      dispatch(setBuyNowId(productVariationId));
      router.push("/checkout");
      const resolvedGuestId = guestId ?? (await refreshGuestId());
      if (!resolvedGuestId) {
        console.error("Guest ID not available");
        return;
      }

      try {
        const guestOrderPayload: CreateGuestOrderPayload = {
          id: resolvedGuestId,
          items: [
            {
              product_sku_id: Number(productVariationId),
              quantity: qty,
            },
          ],
        };

        await createGuestOrder(guestOrderPayload);
      } catch (error) {
        console.error("Failed to create guest order:", error);
      }
    }
  };

  const addDisabled = stock === 0 || isInCart;
  const buyDisabled = stock === 0 || guestIdLoading || isCreatingGuestOrder;

  const mobileBottomBarPadding = "";

  return (
    <div
      className={cn(
        "relative col-span-12 sm:col-span-6",
        mobileBottomBarPadding,
        "sm:pb-0",
      )}
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="w-full text-base font-medium text-black sm:w-130">{getLocalName(product?.name ?? "", product?.name_bd, language)}</h1>

            <ShareButton
              onClick={() => {
                if (typeof window !== "undefined" && "share" in navigator) {
                  navigator
                    .share({
                      title: product?.name ?? "",
                      url: window.location.href,
                    })
                    .catch(() => { });
                }
              }}
            />
          </div>

          {brandName ? (
            <div className="flex items-center gap-2 pt-1">
              {brandImg ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-sm border border-black/10 bg-white">
                  <ImageWithFallback src={brandImg} alt={brandName} fill className="object-contain p-0.5" sizes="24px" />
                </div>
              ) : null}

              <span className="text-xs font-medium text-black/70">{brandName}</span>
            </div>
          ) : null}

          <div className="flex items-baseline gap-3">
            <div className="text-base font-semibold">
              BDT {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {typeof oldPrice === "number" && oldPrice > price ? (
              <div className="text-xs text-[#888888] line-through">
                {oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            ) : null}
          </div>
        </div>

        {isFreeDelivery && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <span>🚚</span>
            <span>Free Delivery</span>
          </div>
        )}

        <div className="space-y-1 text-sm font-medium">
          <div>
            <span className="font-medium">{t("product.sku")}:</span> {sku || "—"}
          </div>
          <div>
            <span className="font-medium">{stock === 0 ? t("product.outOfStock") : t("product.inStock")}</span>
          </div>

          <div className="text-xs text-black/60">
            {t("product.selected")}: {selectedSizeName || "—"} / {selectedColorName || "—"}
          </div>
        </div>

        <SizeSelector
          sizes={sizeNames}
          selectedSize={(selectedSizeName as SizeValue) ?? ("" as SizeValue)}
          onChange={handleSizeChange}
          unavailableSizes={unavailableSizeNames}
        />

        <ColorSelector
          colors={colorNames}
          selectedColor={(selectedColorName as ColorValue) ?? ("" as ColorValue)}
          onChange={handleColorChange}
          selectedColorCode={selectedColorCode}
          unavailableColors={unavailableColorNames}
        />

        <div className="hidden space-y-1.5 sm:block">
          <div className="text-sm">
            <span className="font-medium">{t("product.quantity")}:</span>{" "}
            <span className="font-semibold">{String(qty).padStart(2, "0")}</span>
          </div>

          <ItemQuantity
            quantity={qty}
            onDecrease={() => setQty((p) => Math.max(1, p - 1))}
            onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
            max={maxQty}
          />
        </div>

        <div className="flex items-end justify-between sm:hidden">
          <div className="space-y-1.5">
            <div className="text-sm">
              <span className="font-medium">{t("product.quantity")}:</span>{" "}
              <span className="font-semibold">{String(qty).padStart(2, "0")}</span>
            </div>

            <ItemQuantity
              quantity={qty}
              onDecrease={() => setQty((p) => Math.max(1, p - 1))}
              onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
              max={maxQty}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleFavoriteClick(product)}
            className="h-9 w-9 rounded-none border-[#999999] p-0"
            aria-label={t("product.addToWishlist")}
          >
            <FiHeart
              className={cn(
                "h-5 w-5",
                product?.is_favourite ? "fill-[#E52D2D] text-[#E52D2D]" : "text-black",
              )}
            />
          </Button>
        </div>

        {/* ── Desktop action row ── */}
        <div className="hidden items-center gap-4 pt-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFavoriteClick(product)}
            className="h-9 w-9 rounded-none border-[#999999] p-0"
            aria-label={t("product.addToWishlist")}
          >
            <FiHeart
              className={cn(
                "h-5 w-5",
                product?.is_favourite ? "fill-[#E52D2D] text-[#E52D2D]" : "text-black",
              )}
            />
          </Button>

          <Button
            type="button"
            className="h-9 flex-1 rounded-none bg-black text-white hover:bg-black/90 disabled:cursor-not-allowed"
            disabled={addDisabled}
            onClick={handleAddToCart}
          >
            {stock === 0 ? t("product.outOfStock") : isInCart ? t("product.addedToCart") : t("product.addToCart")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 rounded-none border-[#BDBDBD]"
            onClick={handleBuyNow}
            disabled={buyDisabled}
          >
            {
              isInCart ? t("product.openCart") : t("product.buyNow")
            }
          </Button>
        </div>

        {/* ─── Add to Compare (desktop, under action row) ─── */}
        <div className="hidden sm:block pt-1">
          <AddToCompareButton
            product={{ id: product.id, name: product.name, slug: product.slug, thumbnail: undefined, images: (product as any).images }}
            variant="full"
          />
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-60 sm:hidden",
          "border-t border-black/10 bg-white",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 px-4 py-3">
          <Button
            type="button"
            className="h-11 flex-1 rounded-none bg-black text-white hover:bg-black/90 disabled:cursor-not-allowed"
            disabled={addDisabled}
            onClick={handleAddToCart}
          >
            {stock === 0 ? t("product.outOfStock") : isInCart ? t("product.addedToCart") : t("product.addToCart")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-none border-[#BDBDBD]"
            onClick={handleBuyNow}
            disabled={buyDisabled}
          >
            {
              isInCart ? t("product.openCart") : t("product.buyNow")
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoPanel;
