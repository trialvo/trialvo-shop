"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ColorSelector from "@/components/color-selector/ColorSelector";
import type { ColorValue } from "@/components/color-selector/types";
import ItemQuantity from "@/components/common/ItemQuantity";
import ModalShell from "@/components/modals/ModalShell";
import SizeSelector from "@/components/size-selector/SizeSelector";
import type { SizeValue } from "@/components/size-selector/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductDetail } from "@/lib/api/product/service";
import { useAppDispatch } from "@/redux/hooks";
import { editItem } from "@/redux/slices/cartSlice";
import { setSuccess } from "@/redux/slices/uiSlice";
import { Loader2 } from "lucide-react";
import { FiX } from "react-icons/fi";
import QuickAddGalleryCarousel from "../quick-add/QuickAddGalleryCarousel";
import { findColorByIdOrName, isFiniteNumber } from "../quick-add/QuickAddModal";

export type QuickEditPayload = {
  cartItemId: string;
  productId: number;
  initialData: {
    size: string;
    color: string;
    quantity: number;
    productVariationId?: number;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
  payload: QuickEditPayload;
  className?: string;
};

const QuickEditModal: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 60,
  payload,
  className,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { useProductById } = useProduct();

  const { cartItemId, productId, initialData } = payload;

  const { data, isLoading, isError } = useProductById(productId);
  const productDetail = data as unknown as ProductDetail;

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

  const [selectedSizeName, setSelectedSizeName] = React.useState<string>(initialData.size);
  const [selectedColorName, setSelectedColorName] = React.useState<string>(initialData.color);
  const [selectedColorCode, setSelectedColorCode] = React.useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = React.useState<number>(0);
  const [selectedColorId, setSelectedColorId] = React.useState<number>(0);
  const [qty, setQty] = React.useState<number>(initialData.quantity);

  const [saving, setSaving] = React.useState(false);

  const normalizeString = (str: string) => str?.trim().toLowerCase() || '';

  React.useEffect(() => {
    if (!productDetail || !open) return;

    if (initialData.productVariationId) {
      const originalVariation = variations.find((v) => v?.id === initialData.productVariationId);
      if (originalVariation) {
        if (originalVariation.variant) {
          setSelectedSizeName(originalVariation.variant.name || "");
          setSelectedVariantId(
            typeof originalVariation.variant.id === "number"
              ? originalVariation.variant.id
              : Number(originalVariation.variant.id) || 0
          );
        }

        if (originalVariation.color) {
          setSelectedColorName(originalVariation.color.name || "");
          setSelectedColorId(
            typeof originalVariation.color.id === "number"
              ? originalVariation.color.id
              : Number(originalVariation.color.id) || 0
          );
          setSelectedColorCode(originalVariation.color.hex?.trim() || "");
        }
        return;
      }
    }

    const variant = availableVariants.find((v) =>
      normalizeString(v?.name) === normalizeString(initialData.size)
    );
    if (variant) {
      setSelectedVariantId(typeof variant.id === "number" ? variant.id : Number(variant.id) || 0);
    } else if (availableVariants.length > 0) {
      const firstVariant = availableVariants[0];
      setSelectedSizeName(firstVariant?.name ?? "");
      setSelectedVariantId(
        typeof firstVariant?.id === "number" ? firstVariant.id : Number(firstVariant?.id) || 0,
      );
    }

    const color = availableColors.find((c) =>
      normalizeString(c?.name) === normalizeString(initialData.color)
    );
    if (color) {
      setSelectedColorId(typeof color.id === "number" ? color.id : Number(color.id) || 0);
      setSelectedColorCode(typeof color.hex === "string" ? color.hex.trim() : "");
    } else if (availableColors.length > 0) {
      const firstColor = availableColors[0];
      setSelectedColorName(firstColor?.name ?? "");
      setSelectedColorId(typeof firstColor?.id === "number" ? firstColor.id : Number(firstColor?.id) || 0);
      setSelectedColorCode(typeof firstColor?.hex === "string" ? firstColor.hex.trim() : "");
    }
  }, [open, productDetail, initialData, availableVariants, availableColors, variations]);

  const activeVariation = React.useMemo(() => {
    if (!variations.length) return undefined;

    const exact = variations.find((v) =>
      v?.variant?.id === selectedVariantId &&
      v?.color?.id === selectedColorId
    );
    if (exact) return exact;

    if (initialData.productVariationId) {
      const original = variations.find((v) => v?.id === initialData.productVariationId);
      if (original) return original;
    }

    const byVariant = variations.find((v) => v?.variant?.id === selectedVariantId);
    if (byVariant) return byVariant;

    const byColor = variations.find((v) => v?.color?.id === selectedColorId);
    if (byColor) return byColor;

    return variations[0];
  }, [variations, selectedVariantId, selectedColorId, initialData.productVariationId]);

  React.useEffect(() => {
    if (!activeVariation) return;

    const vColor = activeVariation?.color;
    const vVariant = activeVariation?.variant;

    if (vVariant && vVariant.id !== selectedVariantId) {
      const nextVariantId = typeof vVariant.id === "number" ? vVariant.id : Number(vVariant.id) || 0;
      if (nextVariantId !== selectedVariantId) setSelectedVariantId(nextVariantId);

      const vName = String(vVariant.name ?? "").trim();
      if (vName && vName !== selectedSizeName) setSelectedSizeName(vName);
    }

    if (vColor && vColor.id !== selectedColorId) {
      const nextColorId = typeof vColor.id === "number" ? vColor.id : Number(vColor.id) || 0;
      if (nextColorId !== selectedColorId) setSelectedColorId(nextColorId);

      const cName = String(vColor.name ?? "").trim();
      if (cName && cName !== selectedColorName) setSelectedColorName(cName);
    }

    if (vColor) {
      const hex = String(vColor.hex ?? "").trim();
      if (hex) {
        setSelectedColorCode(hex);
      } else {
        const fallback = findColorByIdOrName(availableColors, selectedColorId, selectedColorName);
        const fallbackHex = typeof fallback?.hex === "string" ? fallback.hex.trim() : "";
        if (fallbackHex) setSelectedColorCode(fallbackHex);
      }
    }
  }, [activeVariation, availableColors, selectedVariantId, selectedColorId, selectedSizeName, selectedColorName]);

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
    const sp = v.selling_price;

    if (isFiniteNumber(fp) && fp >= 0 && isFiniteNumber(sp) && sp > fp) return sp;
    return undefined;
  }, [activeVariation]);

  const stock = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return 0;
    return isFiniteNumber(v.stock) ? v.stock : 0;
  }, [activeVariation]);
  const maxQty = React.useMemo(() => (stock > 0 ? Math.min(stock, 5) : 1), [stock]);

  React.useEffect(() => {
    if (qty > maxQty) setQty(maxQty);
  }, [maxQty, qty]);

  const sizes: SizeValue[] = React.useMemo(() => {
    return availableVariants
      .map((v) => v?.name)
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as SizeValue[];
  }, [availableVariants]);

  const colors: ColorValue[] = React.useMemo(() => {
    return availableColors
      .map((c) => c?.name)
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0) as ColorValue[];
  }, [availableColors]);

  const handleSizeChange = (v: SizeValue) => {
    const name = String(v);
    setSelectedSizeName(name);

    const found = availableVariants.find((x) => normalizeString(x?.name) === normalizeString(name));
    if (found) {
      const nextId = typeof found.id === "number" ? found.id : Number(found.id) || 0;
      setSelectedVariantId(nextId);
    }
  };

  const handleColorChange = (v: ColorValue) => {
    const name = String(v);
    setSelectedColorName(name);

    const found = availableColors.find((x) => normalizeString(x?.name) === normalizeString(name));
    if (found) {
      const nextId = typeof found.id === "number" ? found.id : Number(found.id) || 0;
      setSelectedColorId(nextId);

      const hex = typeof found.hex === "string" ? found.hex.trim() : "";
      setSelectedColorCode(hex);
    }
  };

  const currency = "BDT";
  const money = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSave = async () => {
    if (!activeVariation) return;
    if (saving) return;

    try {
      setSaving(true);
      dispatch(
        editItem({
          id: cartItemId,
          updates: {
            size: selectedSizeName,
            color: selectedColorName,
            quantity: qty,
            productVariationId: activeVariation.id,
            price: price,
            originalPrice: oldPrice,
            stock: stock,
          },
        }),
      );

      await new Promise((r) => setTimeout(r, 350));

      dispatch(setSuccess("Cart item updated!"));
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        isTop={isTop}
        zIndex={zIndex}
        contentClassName={cn("min-w-[800px]", className)}
      >
        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute -right-5 -top-5 h-10 w-10 rounded-none bg-black p-0 text-white"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </Button>

        <div className="p-6">
          <Skeleton className="h-7 w-56 mb-4" />

          <div className="grid gap-0 md:grid-cols-[320px_1fr]">
            <div className="md:pr-6">
              <Skeleton className="h-[320px] w-full" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
              </div>
            </div>

            <div className="pt-2 md:pt-0">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-5 w-2/3 mb-4" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>

                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (isError || !productDetail) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        isTop={isTop}
        zIndex={zIndex}
        contentClassName={cn("min-w-[500px]", className)}
      >
        <div className="p-8 text-center text-red-600">{t("quickEdit.failedToLoad")}</div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      contentClassName={cn("min-w-[800px]", className)}
    >
      <Button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute -right-5 -top-5 h-10 w-10 rounded-none bg-black p-0 text-white"
        aria-label="Close"
        disabled={saving}
      >
        <FiX className="h-5 w-5" />
      </Button>

      <div className="p-6">
        <h2 className="text-2xl font-semibold text-black mb-4">{t("quickEdit.editCartItem")}</h2>

        <div className="grid gap-0 md:grid-cols-[320px_1fr]">
          <QuickAddGalleryCarousel
            images={productDetail?.images ?? []}
            title={productDetail?.name ?? ""}
            className="md:pr-6"
            heightClassName="h-[320px]"
            imageClassName="object-contain object-top"
          />

          <div>
            <h3 className="text-base font-semibold text-black line-clamp-2 mb-1">{productDetail?.name ?? ""}</h3>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <p className="text-base font-semibold text-black">{money(price)}</p>
                {typeof oldPrice === "number" && oldPrice > price ? (
                  <p className="text-sm text-gray-500 line-through">{money(oldPrice)}</p>
                ) : null}
              </div>

              <div className="text-xs text-gray-600">{stock === 0 ? t("product.outOfStock") : t("product.inStock")}</div>
            </div>

            <div className="space-y-4">
              <SizeSelector sizes={sizes} selectedSize={selectedSizeName as SizeValue} onChange={handleSizeChange} />

              <ColorSelector
                colors={colors}
                selectedColor={selectedColorName as ColorValue}
                selectedColorCode={selectedColorCode}
                onChange={handleColorChange}
              />

              <ItemQuantity
                quantity={qty}
                onDecrease={() => setQty((p) => Math.max(1, p - 1))}
                onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
                max={maxQty}
              />

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  className="w-full h-11 rounded-none bg-black text-white hover:bg-black/90"
                  disabled={stock === 0 || saving}
                >
                  {stock === 0 ? (
                    t("product.outOfStock")
                  ) : saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("quickEdit.saving")}
                    </span>
                  ) : (
                    t("quickEdit.saveChanges")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default QuickEditModal;
