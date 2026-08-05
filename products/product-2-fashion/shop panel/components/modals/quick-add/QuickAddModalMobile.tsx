"use client";

import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn, getFirstImage } from "@/lib/utils";

import ColorSelector from "@/components/color-selector/ColorSelector";
import { ColorValue } from "@/components/color-selector/types";
import ItemQuantity from "@/components/common/ItemQuantity";
import ModalShell from "@/components/modals/ModalShell";
import SizeSelector from "@/components/size-selector/SizeSelector";
import { SizeValue } from "@/components/size-selector/types";
import { useCartItemSync } from "@/hooks/useCartItemSync";
import { useGuestId } from "@/hooks/useGuestId";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import type { CreateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { ProductDetail } from "@/lib/api/product/service";
import { useAppDispatch } from "@/redux/hooks";
import { addItem, setBuyNowId, setIsCartOpen } from "@/redux/slices/cartSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useRouter } from "next/navigation";
import QuickAddGalleryCarousel from "./QuickAddGalleryCarousel";
import { findColorByIdOrName, isFiniteNumber } from "./QuickAddModal";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isTop?: boolean;
    zIndex?: number;
    id: number;
    onAddToCart?: () => void;
    className?: string;
};

const QuickAddModalMobile: React.FC<Props> = ({
    open,
    onOpenChange,
    isTop = true,
    zIndex = 60,
    id,
    onAddToCart,
    className,
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();
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
    const [qty, setQty] = React.useState<number>(1);

    React.useEffect(() => {
        if (!open) return;

        const v0 = availableVariants[0];
        const c0 = availableColors[0];

        setSelectedSizeName(v0?.name ?? "");
        setSelectedVariantId(typeof v0?.id === "number" ? v0.id : Number(v0?.id) || 0);

        setSelectedColorName(c0?.name ?? "");
        setSelectedColorId(typeof c0?.id === "number" ? c0.id : Number(c0?.id) || 0);

        const hex =
            typeof c0?.hex === "string" && c0.hex.trim().length > 0 ? c0.hex.trim() : "";
        setSelectedColorCode(hex);

        setQty(1);
    }, [open, productDetail?.id, availableVariants, availableColors]);

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
    const maxQty = React.useMemo(() => (stock > 0 ? Math.min(stock, 5) : 1), [stock]);

    React.useEffect(() => {
        if (!open) return;
        setQty((p) => Math.min(p, maxQty));
    }, [open, maxQty]);

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
        // dispatch(setSuccess("Item added to cart!"))
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
        return <div className="p-6">{t("common.loading")}</div>;
    }

    if (isError || !productDetail) {
        return <div className="p-6 text-sm text-black/70">{t("quickAdd.failedToLoad")}</div>;
    }

    return (
        <ModalShell
            open={open}
            onOpenChange={onOpenChange}
            isTop={isTop}
            zIndex={zIndex}
            contentClassName={cn(
                "w-[calc(100vw-24px)] max-w-[520px]",
                "border border-[#EDEDED] p-0",
                className
            )}
        >
            <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute -right-3 -top-3 z-10 h-8 w-8 rounded-none bg-black p-0 text-white hover:bg-black/90"
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </Button>

            <ScrollArea className="p-2">
                <QuickAddGalleryCarousel images={productDetail?.images} title={productDetail?.name} heightClassName="h-[280px] sm:h-[340px] md:h-[420px]" />

                <div className="mt-2">
                    <h3 className="text-base font-semibold text-black">{productDetail?.name}</h3>

                    <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-base font-semibold text-black">
                            {money(price)}
                        </p>

                        {typeof oldPrice === "number" &&
                            oldPrice > price ? (
                            <p className="text-sm text-[#9A9A9A] line-through">
                                {money(oldPrice)}
                            </p>
                        ) : null}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1 text-xs">
                        <p className="font-semibold text-black">{stock === 0 ? t("product.outOfStock") : t("product.inStock")}</p>
                    </div>
                    <div className="mt-2 space-y-2">
                        <SizeSelector
                            sizes={sizes}
                            selectedSize={selectedSizeName as SizeValue}
                            onChange={handleSizeChange}
                            wrap={false}
                            optionsClassName="pr-3"
                        />

                        <ColorSelector
                            colors={colors}
                            selectedColor={selectedColorName as ColorValue}
                            selectedColorCode={selectedColorCode}
                            onChange={handleColorChange}
                            wrap={false}
                            optionsClassName="pr-3"
                        />

                        <div className="flex flex-col gap-3">
                            <ItemQuantity
                                quantity={qty}
                                onDecrease={() => setQty((p) => Math.max(1, p - 1))}
                                onIncrease={() => setQty((p) => Math.min(maxQty, p + 1))}
                                max={maxQty}
                            />

                            <Button
                                type="button"
                                onClick={handleAddToCart}
                                className="h-11 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90"
                                disabled={stock === 0 || isInCart}
                            >
                                {stock === 0 ? t("product.outOfStock") : isInCart ? t("product.addedToCart") : t("product.addToCart")}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <Button
                                asChild
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="h-11 rounded-none border-[#BDBDBD] text-sm font-medium"
                            >
                                <Link href={viewDetailsHref}>{t("quickAdd.viewFullDetails")}</Link>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleBuyNow}
                                disabled={buyDisabled}
                                className="h-11 rounded-none border-[#BDBDBD] text-sm font-medium"
                            >
                                {isInCart ? t("product.openCart") : t("product.buyNow")}
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </ModalShell>
    );
};

export default QuickAddModalMobile;
