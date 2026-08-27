// File: components/modals/quick-edit/QuickEditModalMobile.tsx
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
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductDetail } from "@/lib/api/product/service";
import { useAppDispatch } from "@/redux/hooks";
import { editItem } from "@/redux/slices/cartSlice";
import { FiEdit2 } from "react-icons/fi";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import QuickAddGalleryCarousel from "../quick-add/QuickAddGalleryCarousel";
import { findColorByIdOrName, isFiniteNumber } from "../quick-add/QuickAddModal";
import { QuickEditPayload } from "./QuickEditModal";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
  payload: QuickEditPayload;
  className?: string;
};

const QuickEditModalMobile: React.FC<Props> = ({
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

  React.useEffect(() => {
    if (!productDetail || !open) return;

    const variant = availableVariants.find(v => v?.name === initialData.size);
    if (variant) {
      setSelectedVariantId(typeof variant.id === "number" ? variant.id : Number(variant.id) || 0);
    } else if (availableVariants.length > 0) {
      const firstVariant = availableVariants[0];
      setSelectedSizeName(firstVariant?.name ?? "");
      setSelectedVariantId(typeof firstVariant?.id === "number" ? firstVariant.id : Number(firstVariant?.id) || 0);
    }

    const color = availableColors.find(c => c?.name === initialData.color);
    if (color) {
      setSelectedColorId(typeof color.id === "number" ? color.id : Number(color.id) || 0);
      setSelectedColorCode(typeof color.hex === "string" ? color.hex.trim() : "");
    } else if (availableColors.length > 0) {
      const firstColor = availableColors[0];
      setSelectedColorName(firstColor?.name ?? "");
      setSelectedColorId(typeof firstColor?.id === "number" ? firstColor.id : Number(firstColor?.id) || 0);
      setSelectedColorCode(typeof firstColor?.hex === "string" ? firstColor.hex.trim() : "");
    }
  }, [open, productDetail, initialData, availableVariants, availableColors]);

  const activeVariation = React.useMemo(() => {
    if (!variations.length) return undefined;

    if (initialData.productVariationId) {
      const byId = variations.find(v => v?.id === initialData.productVariationId);
      if (byId) return byId;
    }

    const exact = variations.find(
      (v) => v?.variant?.id === selectedVariantId && v?.color?.id === selectedColorId,
    );
    if (exact) return exact;

    const byVariant = variations.find((v) => v?.variant?.id === selectedVariantId);
    if (byVariant) return byVariant;

    const byColor = variations.find((v) => v?.color?.id === selectedColorId);
    if (byColor) return byColor;

    return variations[0];
  }, [variations, selectedVariantId, selectedColorId, initialData.productVariationId]);

  React.useEffect(() => {
    if (!activeVariation) return;

    const vColor = activeVariation?.color;
    if (vColor) {
      const hex = String(vColor?.hex ?? "").trim();
      if (hex) {
        setSelectedColorCode(hex);
      } else {
        const fallback = findColorByIdOrName(
          availableColors,
          selectedColorId,
          selectedColorName
        );
        const fallbackHex = typeof fallback?.hex === "string" ? fallback.hex.trim() : "";
        if (fallbackHex) setSelectedColorCode(fallbackHex);
      }
    }
  }, [activeVariation, availableColors, selectedColorId, selectedColorName]);

  const price = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return 0;

    const fp = v.final_price;
    if (isFiniteNumber(fp) && fp >= 0) return fp;

    return isFiniteNumber(v.selling_price) ? v.selling_price : 0;
  }, [activeVariation]);

  const stock = React.useMemo(() => {
    const v = activeVariation;
    if (!v) return 0;
    return isFiniteNumber(v.stock) ? v.stock : 0;
  }, [activeVariation]);
  const maxQty = React.useMemo(() => (stock > 0 ? Math.min(stock, 5) : 1), [stock]);

  React.useEffect(() => {
    if (qty > maxQty) {
      setQty(maxQty);
    }
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

  const handleSave = () => {
    dispatch(editItem({
      id: cartItemId,
      updates: {
        size: selectedSizeName,
        color: selectedColorName,
        quantity: qty,
        productVariationId: activeVariation?.id,
        price: price,
        stock: stock,
      }
    }));

    onOpenChange(false);
  };

  const currency = "BDT";
  const money = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (!open) return null;

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        isTop={isTop}
        zIndex={zIndex}
        title={t("quickEdit.editItem")}
        icon={<FiEdit2 className="h-4 w-4" strokeWidth={1.75} />}
        contentClassName={cn("max-w-[400px]", className)}
        bodyClassName="p-6 text-center"
      >
        <div>{t("common.loading")}</div>
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
        title={t("quickEdit.editItem")}
        icon={<FiEdit2 className="h-4 w-4" strokeWidth={1.75} />}
        contentClassName={cn("max-w-[400px]", className)}
        bodyClassName="p-6 text-center text-sm text-black/70"
      >
        <div>
          {t("quickAdd.failedToLoad")}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      title={t("quickEdit.editItem")}
      icon={<FiEdit2 className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn("max-w-[400px]", className)}
    >
      <ScrollArea className="p-4">

        <QuickAddGalleryCarousel
          images={productDetail?.images ?? []}
          title={productDetail?.name ?? ""}
          heightClassName="h-[200px]"
        />

        <div className="mt-3">
          <h3 className="text-base font-semibold text-black">
            {productDetail?.name ?? ""}
          </h3>

          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-base font-semibold text-black">
              {money(price)}
            </p>
            <p className="text-xs text-gray-600">{stock === 0 ? t("product.outOfStock") : t("product.inStock")}</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <SizeSelector
              sizes={sizes}
              selectedSize={selectedSizeName as SizeValue}
              onChange={handleSizeChange}
              wrap={false}
              optionsClassName="pr-3"
            />
          </div>

          <div>
            <ColorSelector
              colors={colors}
              selectedColor={selectedColorName as ColorValue}
              selectedColorCode={selectedColorCode}
              onChange={handleColorChange}
              wrap={false}
              optionsClassName="pr-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("product.quantity")}
            </label>
            <ItemQuantity
              quantity={qty}
              onDecrease={() => setQty((p) => Math.max(1, p - 1))}
              onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
              max={maxQty}
            />
          </div>

          <Button
            type="button"
            onClick={handleSave}
            className="w-full h-11 rounded-none bg-black text-white hover:bg-black/90"
            disabled={stock === 0}
          >
            {stock === 0 ? t("product.outOfStock") : t("quickEdit.saveChanges")}
          </Button>
        </div>
      </ScrollArea>
    </ModalShell>
  );
};

export default QuickEditModalMobile;
