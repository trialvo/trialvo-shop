"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { CartLineOptionFields } from "@/components/cart/CartLineOptionFields";
import { AppButton } from "@/components/shared/AppButton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/hooks/useCart";
import { useProductDetail } from "@/hooks/useProductDetail";
import { toUIProductFromDetail } from "@/lib/adapters/product";
import { pickVariation } from "@/lib/product/pickVariation";
import type { CartItem } from "@/store/cart/types";
import { CART_QTY_MAX, CART_QTY_MIN } from "@/store/cart/types";

type CartLineEditDialogProps = Readonly<{
  item: CartItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * Full cart-line editor — loads product detail so color, variant, qty, and
 * price can all change for the selected line.
 */
export function CartLineEditDialog({
  item,
  open,
  onOpenChange,
}: CartLineEditDialogProps): ReactElement {
  const { replaceCartItem } = useCart();
  const { product: cartProduct, quantity, productVariationId, color } = item;

  const { product: detail, isLoading, isError, isNotFound } = useProductDetail(
    cartProduct.slug,
    { enabled: open, includeReviews: false },
  );

  const uiProduct = useMemo(
    () => (detail ? toUIProductFromDetail(detail) : cartProduct),
    [detail, cartProduct],
  );

  const variations = detail?.variations ?? [];
  const colors = detail?.available_colors ?? [];
  const variants = detail?.available_variants ?? [];
  const variantLabel =
    variants[0]?.attribute_name?.split(" - ")[0]?.trim() || "Size";

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [draftQty, setDraftQty] = useState(quantity);

  // Seed options from the current cart line when detail loads
  useEffect(() => {
    if (!open || !detail) return;

    const currentSku =
      variations.find((v) => v.id === productVariationId) ?? null;

    setSelectedColorId(
      currentSku?.color?.id ??
        colors.find((c) => c.name === color)?.id ??
        colors[0]?.id ??
        variations[0]?.color?.id ??
        null,
    );
    setSelectedVariantId(
      currentSku?.variant?.id ??
        variants[0]?.id ??
        variations[0]?.variant?.id ??
        null,
    );
    setDraftQty(quantity);
  }, [open, detail?.id, productVariationId, quantity, color]);

  const selectedSku = useMemo(
    () => pickVariation(variations, selectedColorId, selectedVariantId),
    [variations, selectedColorId, selectedVariantId],
  );

  const selectedColorName =
    colors.find((c) => c.id === selectedColorId)?.name ??
    selectedSku?.color?.name ??
    color;

  const displayPrice = selectedSku?.final_price ?? uiProduct.price;
  const stock = selectedSku?.stock ?? (uiProduct.inStock ? CART_QTY_MAX : 0);
  const inStock = (selectedSku?.in_stock ?? stock > 0) && stock > 0;
  const maxQty = Math.min(CART_QTY_MAX, Math.max(CART_QTY_MIN, stock || 1));

  useEffect(() => {
    setDraftQty((q) => Math.min(Math.max(CART_QTY_MIN, q), maxQty));
  }, [maxQty, selectedSku?.id]);

  const nextSkuId = selectedSku?.id ?? uiProduct.defaultSkuId;
  const linePreview = displayPrice * draftQty;

  const hasChanges =
    draftQty !== quantity ||
    nextSkuId !== productVariationId ||
    (selectedColorName ?? "") !== (color ?? "") ||
    displayPrice !== cartProduct.price;

  const canSave =
    !isLoading &&
    !isError &&
    !isNotFound &&
    inStock &&
    draftQty >= CART_QTY_MIN &&
    draftQty <= maxQty &&
    Boolean(nextSkuId || variations.length === 0) &&
    hasChanges;

  const handleSave = () => {
    if (!inStock) {
      toast.error("This option is out of stock");
      return;
    }
    if (variations.length > 0 && !selectedSku?.id) {
      toast.error("Please select a valid product option");
      return;
    }
    if (!nextSkuId && variations.length > 0) {
      toast.error("Please select a valid product option");
      return;
    }

    const nextProduct = {
      ...uiProduct,
      price: displayPrice,
      originalPrice:
        selectedSku && selectedSku.final_price < selectedSku.selling_price
          ? selectedSku.selling_price
          : uiProduct.originalPrice,
      inStock,
      defaultSkuId: nextSkuId ?? uiProduct.defaultSkuId,
    };

    replaceCartItem({
      previousProductId: cartProduct.id,
      previousVariationId: productVariationId,
      product: nextProduct,
      quantity: draftQty,
      color: selectedColorName,
      productVariationId: nextSkuId,
    });

    toast.success("Cart item updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm w-[calc(100%-1.5rem)] max-w-md gap-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-4 py-3.5 text-left">
          <DialogTitle className="font-heading flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary shrink-0" aria-hidden />
            Edit cart item
          </DialogTitle>
          <DialogDescription className="text-xs line-clamp-2">
            Change options, quantity, or remove this line from the cart page.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uiProduct.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-sm border border-border object-cover bg-secondary/30"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium line-clamp-2">
                {uiProduct.title}
              </p>
              {uiProduct.brand ? (
                <p className="text-[11px] text-muted-foreground">
                  {uiProduct.brand}
                </p>
              ) : null}
              {isLoading ? (
                <Skeleton className="h-5 w-24 rounded-sm" />
              ) : (
                <p className="text-sm font-bold font-heading text-primary tabular-nums">
                  ৳{displayPrice.toLocaleString()}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    each
                  </span>
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full rounded-sm" />
              <Skeleton className="h-8 w-2/3 rounded-sm" />
              <Skeleton className="h-8 w-32 rounded-sm" />
            </div>
          ) : isError || isNotFound ? (
            <div className="space-y-2 rounded-sm border border-border bg-secondary/30 p-3">
              <p className="text-sm text-destructive">
                Could not load product options.
              </p>
              <p className="text-xs text-muted-foreground">
                You can still change quantity on the cart line, or open the
                product page.
              </p>
              <AppButton
                asChild
                variant="outline"
                size="sm"
                className="rounded-sm cursor-pointer"
              >
                <Link href={`/product/${cartProduct.slug}`}>Open product</Link>
              </AppButton>
            </div>
          ) : (
            <>
              <p
                className={
                  inStock
                    ? "text-xs font-medium text-emerald-700"
                    : "text-xs font-medium text-destructive"
                }
              >
                {inStock
                  ? `In stock${stock < 20 ? ` · ${stock} left` : ""}`
                  : "Out of stock"}
              </p>

              <CartLineOptionFields
                colors={colors.map((c) => ({ id: c.id, name: c.name }))}
                variants={variants.map((v) => ({ id: v.id, name: v.name }))}
                variantLabel={variantLabel}
                selectedColorId={selectedColorId}
                selectedVariantId={selectedVariantId}
                quantity={draftQty}
                maxQuantity={maxQty}
                onColorChange={setSelectedColorId}
                onVariantChange={setSelectedVariantId}
                onQuantityChange={setDraftQty}
              />
            </>
          )}

          <div className="flex items-center justify-between rounded-sm bg-secondary/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Line total</span>
            <span className="text-sm font-bold font-heading text-primary tabular-nums">
              ৳{linePreview.toLocaleString()}
            </span>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border bg-secondary/20 px-4 py-3 sm:space-x-0">
          <AppButton
            type="button"
            variant="outline"
            className="flex-1 rounded-sm cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            className="flex-1 rounded-sm cursor-pointer"
            disabled={!canSave}
            onClick={handleSave}
          >
            Save changes
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
