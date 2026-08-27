"use client";

import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn, getFirstImage } from "@/lib/utils";

import ColorSelector from "@/components/color-selector/ColorSelector";
import type { ColorValue } from "@/components/color-selector/types";
import ItemQuantity from "@/components/common/ItemQuantity";
import ModalShell from "@/components/modals/ModalShell";
import SizeSelector from "@/components/size-selector/SizeSelector";
import type { SizeValue } from "@/components/size-selector/types";
import QuickAddGalleryCarousel from "./QuickAddGalleryCarousel";

import { useCartItemSync } from "@/hooks/useCartItemSync";
import { useGuestId } from "@/hooks/useGuestId";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { CreateGuestOrderPayload } from "@/lib/api/guest-order/service";
import type { ProductDetail } from "@/lib/api/product/service";
import { useAppDispatch } from "@/redux/hooks";
import { addItem, setBuyNowId, setIsCartOpen } from "@/redux/slices/cartSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { useRouter } from "next/navigation";
import { FiShoppingBag } from "react-icons/fi";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
  id: number;
  onAddToCart?: () => void;
  className?: string;
  /** Optional initial quantity — used by Budget Planner to pre-fill. Clamped to maxQty. */
  initialQty?: number;
};

export function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function findColorByIdOrName(
  colors: Array<{ id?: unknown; name?: unknown; hex?: unknown }>,
  colorId: number,
  colorName: string,
) {
  const byId = colors.find((c) => Number(c?.id) === colorId);
  if (byId) return byId;

  const name = colorName.trim();
  if (!name) return undefined;

  return colors.find((c) => String(c?.name ?? "").trim() === name);
}

export const BUY_NOW_STORAGE_KEY = "BUY_NOW_ITEM";

const QuickAddModal: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 60,
  id,
  onAddToCart,
  className,
  initialQty,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { trackAddToCart: fireAddToCart } = useAnalytics();
  const { useProductById } = useProduct();
  const { id: guestId, loading: guestIdLoading, refresh: refreshGuestId } = useGuestId({ auto: false });
  const { createGuestOrder, isLoading: isCreatingGuestOrder } = useGuestOrder();

  const productId = React.useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [id]);

  const { data, isLoading, isError } = useProductById(productId);
  const productDetail = data as unknown as ProductDetail;

  const currency = "BDT";

  const availableVariants = React.useMemo(
    () => productDetail?.available_variants ?? [],
    [productDetail?.available_variants],
  );

  const availableColors = React.useMemo(
    () => productDetail?.available_colors ?? [],
    [productDetail?.available_colors],
  );

  const variations = React.useMemo(
    () => productDetail?.variations ?? [],
    [productDetail?.variations],
  );

  const firstVariant = availableVariants[0];
  const firstColor = availableColors[0];

  const [selectedSizeName, setSelectedSizeName] = React.useState<string>(firstVariant?.name ?? "");
  const [selectedColorName, setSelectedColorName] = React.useState<string>(firstColor?.name ?? "");
  const [selectedColorCode, setSelectedColorCode] = React.useState<string>(firstColor?.hex ?? "");
  const [selectedVariantId, setSelectedVariantId] = React.useState<number>(firstVariant?.id ?? 0);
  const [selectedColorId, setSelectedColorId] = React.useState<number>(firstColor?.id ?? 0);
  const [qty, setQty] = React.useState<number>(initialQty && initialQty > 1 ? initialQty : 1);

  React.useEffect(() => {
    if (!open) return;

    let v0 = availableVariants[0];
    let c0 = availableColors[0];

    // When opened from budget planner with a suggested qty,
    // find a variation with enough stock to fulfill the requested quantity
    // instead of defaulting to the first variant which may have less stock.
    if (initialQty && initialQty > 1 && variations.length > 0) {
      const suitable = variations.find(
        (v) => typeof v?.stock === "number" && v.stock >= initialQty,
      );
      if (suitable) {
        const sv = suitable.variant;
        const sc = suitable.color;
        if (sv) {
          const match = availableVariants.find((x) => Number(x?.id) === Number(sv?.id));
          if (match) v0 = match;
        }
        if (sc) {
          const match = availableColors.find((x) => Number(x?.id) === Number(sc?.id));
          if (match) c0 = match;
        }
      }
    }

    setSelectedSizeName(v0?.name ?? "");
    const nextVariantId = typeof v0?.id === "number" ? v0.id : Number(v0?.id) || 0;
    setSelectedVariantId(nextVariantId);

    setSelectedColorName(c0?.name ?? "");
    const nextColorId = typeof c0?.id === "number" ? c0.id : Number(c0?.id) || 0;
    setSelectedColorId(nextColorId);

    const hex =
      typeof c0?.hex === "string" && c0.hex.trim().length > 0 ? c0.hex.trim() : "";
    setSelectedColorCode(hex);

    // Compute qty using the SELECTED variation's actual stock to avoid
    // the race condition with the clamping effect using the wrong variant.
    if (initialQty && initialQty > 1 && variations.length > 0) {
      const selectedVar = variations.find(
        (v) => v?.variant?.id === nextVariantId && v?.color?.id === nextColorId,
      ) ?? variations.find(
        (v) => v?.variant?.id === nextVariantId,
      ) ?? variations[0];
      const varStock = typeof selectedVar?.stock === "number" ? selectedVar.stock : 0;
      const effectiveMax = varStock > 0 ? varStock : 1;
      setQty(Math.min(initialQty, effectiveMax));
    } else {
      setQty(initialQty && initialQty > 1 ? initialQty : 1);
    }
  }, [open, productDetail?.id, availableVariants, availableColors, variations, initialQty]);

  const activeVariation = React.useMemo(() => {
    if (!variations.length) return undefined;

    const exact = variations.find(
      (v) => v?.variant?.id === selectedVariantId && v?.color?.id === selectedColorId,
    );
    if (exact) return exact;

    const byVariant = variations.find((v) => v?.variant?.id === selectedVariantId);
    if (byVariant) return byVariant;

    const byColor = variations.find((v) => v?.color?.id === selectedColorId);
    if (byColor) return byColor;

    return variations[0];
  }, [variations, selectedVariantId, selectedColorId]);

  React.useEffect(() => {
    if (!open) return;
    if (!activeVariation) return;

    const vColor = activeVariation?.color;
    const vVariant = activeVariation?.variant;

    const nextVariantId =
      typeof vVariant?.id === "number" ? vVariant.id : Number(vVariant?.id) || 0;

    if (nextVariantId > 0 && nextVariantId !== selectedVariantId) {
      setSelectedVariantId(nextVariantId);

      const vName = String(vVariant?.name ?? "").trim();
      if (vName) setSelectedSizeName(vName);
    }

    const nextColorId =
      typeof vColor?.id === "number" ? vColor.id : Number(vColor?.id) || 0;

    if (nextColorId > 0 && nextColorId !== selectedColorId) {
      setSelectedColorId(nextColorId);
    }

    const nextColorName = String(vColor?.name ?? "").trim();
    if (nextColorName && nextColorName !== selectedColorName) {
      setSelectedColorName(nextColorName);
    }

    const nextHex = String(vColor?.hex ?? "").trim();
    if (nextHex && nextHex !== selectedColorCode) {
      setSelectedColorCode(nextHex);
      return;
    }

    const fallback = findColorByIdOrName(availableColors, nextColorId, nextColorName);
    const fallbackHex = typeof fallback?.hex === "string" ? fallback.hex.trim() : "";
    if (fallbackHex && fallbackHex !== selectedColorCode) {
      setSelectedColorCode(fallbackHex);
    }
  }, [
    open,
    activeVariation,
    availableColors,
    selectedVariantId,
    selectedColorId,
    selectedColorName,
    selectedColorCode,
  ]);

  React.useEffect(() => {
    if (!open) return;
    const found = findColorByIdOrName(availableColors, selectedColorId, selectedColorName);
    const hex = typeof found?.hex === "string" ? found.hex.trim() : "";
    if (hex && hex !== selectedColorCode) setSelectedColorCode(hex);
  }, [open, availableColors, selectedColorId, selectedColorName, selectedColorCode]);

  const price = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return 0;

    const fp = v.final_price;
    if (isFiniteNumber(fp) && fp >= 0) return fp;

    return isFiniteNumber(v.selling_price) ? v.selling_price : 0;
  }, [activeVariation]);

  const oldPrice = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return undefined;

    const fp = v.final_price;
    if (isFiniteNumber(fp) && fp >= 0 && isFiniteNumber(v.selling_price) && v.selling_price > fp) {
      return v.selling_price;
    }

    return undefined;
  }, [activeVariation]);

  const stock = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return 0;
    return isFiniteNumber(v.stock) ? v.stock : 0;
  }, [activeVariation]);
  const maxQty = React.useMemo(() => {
    if (stock <= 0) return 1;
    // When opened from budget planner with a suggested qty, allow up to stock
    return initialQty && initialQty > 1 ? stock : Math.min(stock, 5);
  }, [stock, initialQty]);

  React.useEffect(() => {
    if (!open) return;
    // Skip clamping before product data is available — the reset effect
    // above already handles initial qty using the selected variant's stock.
    if (!activeVariation) return;
    // Clamp qty down to maxQty when user changes size/color
    setQty((p) => {
      if (initialQty && initialQty > 1) {
        // In budget-planner mode, try to restore the suggested qty
        // (clamped to what the current variant actually has in stock)
        return Math.min(initialQty, maxQty);
      }
      return Math.min(p, maxQty);
    });
  }, [open, maxQty, initialQty, activeVariation]);

  const sizes: SizeValue[] = React.useMemo(() => {
    return availableVariants
      .map((v) => v?.name)
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as SizeValue[];
  }, [availableVariants]);

  const sku = React.useMemo(() => activeVariation?.sku ?? "", [activeVariation]);

  const colors: ColorValue[] = React.useMemo(() => {
    return availableColors
      .map((c) => c?.name)
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as ColorValue[];
  }, [availableColors]);

  const money = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const viewDetailsHref =
    productDetail?.id == null ? "/" : `/products/${productDetail?.slug ?? "product"}/${productDetail.id}/`;

  const handleSizeChange = (v: SizeValue) => {
    const name = String(v);
    setSelectedSizeName(name);

    const found = availableVariants.find((x) => x?.name === name);
    const nextId = typeof found?.id === "number" ? found.id : Number(found?.id) || 0;
    setSelectedVariantId(nextId);
  };

  const handleColorChange = (v: ColorValue) => {
    const name = String(v);
    setSelectedColorName(name);

    const found = availableColors.find((x) => x?.name === name);
    const nextId = typeof found?.id === "number" ? found.id : Number(found?.id) || 0;
    setSelectedColorId(nextId);

    const hex = typeof found?.hex === "string" ? found.hex.trim() : "";
    setSelectedColorCode(hex);
  };

  const { isInCart } = useCartItemSync({
    productId: String(productDetail?.id),
    size: selectedSizeName,
    color: selectedColorName,
    stock,
  });

  const productIdStr = productDetail?.id ? String(productDetail.id) : "";
  const productVariationId = activeVariation?.id ?? 0;

  const itemToOrder = React.useMemo(
    () => ({
      productId: productIdStr,
      title: productDetail?.name ?? "",
      productVariationId: productVariationId,
      image: getFirstImage(productDetail) ?? "",
      price,
      originalPrice: typeof oldPrice === "number" ? oldPrice : 0,
      discount: activeVariation?.discount,
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
    [productIdStr, productDetail, productVariationId, price, oldPrice, activeVariation?.discount, activeVariation?.weight_kg, selectedSizeName, selectedColorName, qty, stock, sku, selectedVariantId, selectedColorId],
  );

  const handleAddToCart = () => {
    onOpenChange(false);
    if (!productDetail?.id) return;

    dispatch(addItem(itemToOrder));
    fireAddToCart({
      content_ids: [String(productDetail.id)],
      content_name: productDetail?.name ?? "",
      content_type: "product",
      value: price * qty,
      quantity: qty,
    });
  };

  const handleBuyNow = async () => {
    dispatch(setIsCartOpen(false));
    onOpenChange(false)
    if (!productDetail?.id) return;

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

  const buyDisabled = stock === 0 || guestIdLoading || isCreatingGuestOrder;

  if (!open) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-8 text-sm text-black/50">
        {t("common.loading")}
      </div>
    );
  }

  if (isError || !productDetail) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8 text-sm text-black/60">
        {t("quickAdd.failedToLoad")}
      </div>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      title={t("product.addToCart")}
      icon={<FiShoppingBag className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn("w-[min(920px,calc(100vw-32px))] max-w-[920px]", className)}
    >
      <div className="grid gap-0 md:grid-cols-[340px_1fr]">
        <div className="border-b border-[#F1F1F1] bg-[#F7F7F7] md:border-b-0 md:border-r">
          <QuickAddGalleryCarousel
            images={productDetail?.images ?? []}
            title={productDetail?.name ?? ""}
            className="p-4"
            heightClassName="h-[300px] md:h-[380px]"
            imageClassName="object-contain object-center"
          />
        </div>

        <div className="flex flex-col justify-center p-5 md:p-6">
          <h3 className="text-base font-medium leading-snug text-[#191919] md:text-lg">
            {productDetail?.name ?? ""}
          </h3>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <p className="text-lg font-semibold text-[#191919]">{money(price)}</p>
            {typeof oldPrice === "number" && oldPrice > price ? (
              <p className="text-sm text-black/40 line-through">{money(oldPrice)}</p>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-1.5 text-xs font-medium",
              stock === 0 ? "text-black/40" : "text-[#191919]",
            )}
          >
            {stock === 0 ? t("product.outOfStock") : t("product.inStock")}
          </p>

          <div className="mt-4 space-y-4">
            <SizeSelector
              sizes={sizes}
              selectedSize={selectedSizeName as SizeValue}
              onChange={handleSizeChange}
            />

            <ColorSelector
              colors={colors}
              selectedColor={selectedColorName as ColorValue}
              selectedColorCode={selectedColorCode}
              onChange={handleColorChange}
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <ItemQuantity
                quantity={qty}
                onDecrease={() => setQty((p) => Math.max(1, p - 1))}
                onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
                max={maxQty}
                className="rounded-md border-[#D0D0D0]"
              />

              <Button
                type="button"
                onClick={handleAddToCart}
                className="h-10 flex-1 rounded-md bg-[#191919] text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed"
                disabled={stock === 0 || isInCart}
              >
                {stock === 0
                  ? t("product.outOfStock")
                  : isInCart
                    ? t("product.addedToCart")
                    : t("product.addToCart")}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-md border-[#D0D0D0] text-sm font-medium text-[#191919] hover:border-[#191919]"
              >
                <Link href={viewDetailsHref}>{t("quickAdd.viewFullDetails")}</Link>
              </Button>

              <Button
                variant="outline"
                onClick={handleBuyNow}
                disabled={buyDisabled}
                className="h-10 rounded-md border-[#D0D0D0] text-sm font-medium text-[#191919] hover:border-[#191919] disabled:cursor-not-allowed"
              >
                {isInCart ? t("product.openCart") : t("product.buyNow")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default QuickAddModal;
