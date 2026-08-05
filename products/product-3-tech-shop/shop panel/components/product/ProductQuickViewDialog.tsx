"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { ExternalLink, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { ProductQuickViewGallery } from "@/components/product/ProductQuickViewGallery";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";
import type { Product } from "@/data/products";
import { useProductDetail } from "@/hooks/useProductDetail";
import { toUIProductFromDetail } from "@/lib/adapters/product";
import { syncGuestCartOrder } from "@/lib/guest-order/syncGuestCart";
import { resolveMediaUrl } from "@/lib/media/url";
import { pickVariation } from "@/lib/product/pickVariation";
import { sanitizeProductHtml } from "@/lib/security/html";
import { cn } from "@/lib/utils";

type ProductQuickViewDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Card product — used for shell while detail loads */
  product: Product;
}>;

/**
 * Quick View — gallery slider, options, info, add to cart + place order.
 */
export function ProductQuickViewDialog({
  open,
  onOpenChange,
  product,
}: ProductQuickViewDialogProps): ReactElement {
  const router = useRouter();
  const auth = useAuthContext();
  const {
    addToCart,
    setIsCartOpen,
    items,
    isInCart,
    getQuantityInCart,
  } = useCart();

  const { product: detail, isLoading, isError, isNotFound } = useProductDetail(
    product.slug,
    { enabled: open, includeReviews: false },
  );

  const uiProduct = useMemo(
    () => (detail ? toUIProductFromDetail(detail) : product),
    [detail, product],
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
  const [quantity, setQuantity] = useState(1);
  const [orderBusy, setOrderBusy] = useState(false);

  useEffect(() => {
    if (!open || !detail) return;
    setSelectedColorId(
      detail.available_colors?.[0]?.id ??
        detail.variations?.[0]?.color?.id ??
        null,
    );
    setSelectedVariantId(
      detail.available_variants?.[0]?.id ??
        detail.variations?.[0]?.variant?.id ??
        null,
    );
    setQuantity(1);
  }, [open, detail?.id]);

  const selectedSku = useMemo(
    () => pickVariation(variations, selectedColorId, selectedVariantId),
    [variations, selectedColorId, selectedVariantId],
  );

  const selectedColorName =
    colors.find((c) => c.id === selectedColorId)?.name ??
    selectedSku?.color?.name ??
    uiProduct.colors?.[0];

  const displayPrice = selectedSku?.final_price ?? uiProduct.price;
  const displayOriginal =
    selectedSku && selectedSku.final_price < selectedSku.selling_price
      ? selectedSku.selling_price
      : uiProduct.originalPrice;
  const stock = selectedSku?.stock ?? (uiProduct.inStock ? 99 : 0);
  const inStock = (selectedSku?.in_stock ?? stock > 0) && stock > 0;

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, stock || 1)));
  }, [stock, selectedSku?.id]);

  const galleryImages = useMemo(() => {
    if (!detail) {
      return [product.image, ...(product.images ?? [])].filter(Boolean);
    }
    const fromDetail = (detail.images ?? [])
      .filter((img) => {
        if (selectedColorId == null || img.sku_color_id == null) return true;
        return img.sku_color_id === selectedColorId;
      })
      .map((img) => resolveMediaUrl(img.path));

    const list =
      fromDetail.length > 0
        ? fromDetail
        : [uiProduct.image, ...(uiProduct.images ?? [])];

    return Array.from(new Set(list.filter(Boolean)));
  }, [
    detail,
    product.image,
    product.images,
    selectedColorId,
    uiProduct.image,
    uiProduct.images,
  ]);

  const shortHtml = sanitizeProductHtml(
    detail?.short_description || detail?.long_description || "",
  );

  const ensureSku = (): boolean => {
    if (!inStock) {
      toast.error("This option is out of stock");
      return false;
    }
    if (!selectedSku?.id && variations.length > 0) {
      toast.error("Please select a valid product option");
      return false;
    }
    return true;
  };

  const resolveSkuId = (): number | undefined => {
    if (selectedSku?.id) return selectedSku.id;
    return uiProduct.defaultSkuId;
  };

  const activeSkuId = selectedSku?.id ?? uiProduct.defaultSkuId;
  const lineInCart = isInCart(uiProduct, activeSkuId);
  const qtyInCart = getQuantityInCart(uiProduct, activeSkuId);
  const cartButtonLabel = addToCartLabel({
    inCart: lineInCart,
    quantityInCart: qtyInCart,
  });

  const handleAddToCart = () => {
    if (lineInCart) {
      onOpenChange(false);
      setIsCartOpen(true);
      toast.message("Already in cart", {
        description: "Remove it from the cart before adding again, or edit it on the cart page.",
      });
      return;
    }
    if (!ensureSku()) return;
    const skuId = resolveSkuId();
    if (!skuId) {
      toast.error("Please select a valid product option");
      return;
    }
    const added = addToCart(uiProduct, quantity, selectedColorName, skuId);
    if (added) {
      toast.success("Added to cart");
    }
  };

  const handlePlaceOrder = async () => {
    if (!ensureSku()) return;
    const skuId = resolveSkuId();
    if (!skuId) {
      toast.error("Please select a valid product option");
      return;
    }

    setOrderBusy(true);
    try {
      // Only add when this SKU is not already in the cart
      if (!lineInCart) {
        addToCart(uiProduct, quantity, selectedColorName, skuId, false);
      }
      setIsCartOpen(false);

      // Guest cart sync before checkout (same as CartDrawer).
      const nextItems = lineInCart
        ? items
        : [
        ...items.filter(
          (i) =>
            !(
              i.product.id === uiProduct.id &&
              i.productVariationId === skuId
            ),
        ),
        {
          product: uiProduct,
          quantity,
          color: selectedColorName,
          productVariationId: skuId,
        },
      ];

      if (!auth.isAuthenticated) {
        try {
          await syncGuestCartOrder(nextItems);
        } catch {
          /* checkout page retries sync */
        }
      }

      onOpenChange(false);
      router.push("/checkout");
    } finally {
      setOrderBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        motion="bottom-sheet"
        className={cn(
          "gap-0 overflow-hidden border-border bg-card p-0 shadow-xl",
          "flex flex-col",
          "w-full h-[min(94dvh,100%)] max-h-[94dvh]",
          "sm:h-auto sm:max-h-[min(90vh,760px)]",
          "sm:w-[min(94vw,52rem)] sm:max-w-4xl sm:rounded-sm",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-5 text-left space-y-0.5">
          <DialogTitle className="font-heading text-base sm:text-lg font-bold tracking-tight pr-8 line-clamp-2">
            {uiProduct.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {[uiProduct.brand, "Quick view"].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {isLoading && !detail ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Skeleton className="aspect-square w-full rounded-sm" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3 rounded-sm" />
                <Skeleton className="h-8 w-1/3 rounded-sm" />
                <Skeleton className="h-20 w-full rounded-sm" />
                <Skeleton className="h-10 w-full rounded-sm" />
              </div>
            </div>
          ) : isError || isNotFound ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-destructive">
                Could not load this product.
              </p>
              <AppButton asChild variant="outline" className="cursor-pointer rounded-sm">
                <Link href={`/product/${product.slug}`}>Open product page</Link>
              </AppButton>
            </div>
          ) : (
            <div className="grid gap-5 p-4 sm:grid-cols-2 sm:gap-6 sm:p-5">
              <ProductQuickViewGallery
                images={galleryImages}
                title={uiProduct.title}
              />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-medium">{uiProduct.rating}</span>
                    <span className="text-muted-foreground">
                      ({uiProduct.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-heading text-xl font-bold text-primary tabular-nums">
                      ৳{displayPrice.toLocaleString()}
                    </span>
                    {displayOriginal && displayOriginal > displayPrice ? (
                      <span className="text-sm text-muted-foreground line-through tabular-nums">
                        ৳{displayOriginal.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      inStock ? "text-emerald-700" : "text-destructive",
                    )}
                  >
                    {inStock ? `In stock${stock < 20 ? ` · ${stock} left` : ""}` : "Out of stock"}
                  </p>
                </div>

                {colors.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {colors.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColorId(c.id)}
                          className={cn(
                            "rounded-sm border px-2.5 py-1 text-xs cursor-pointer transition-colors",
                            selectedColorId === c.id
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-foreground/40",
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">{variantLabel}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={cn(
                            "rounded-sm border px-2.5 py-1 text-xs cursor-pointer transition-colors",
                            selectedVariantId === v.id
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-foreground/40",
                          )}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-medium">Quantity</p>
                  <div className="inline-flex items-center overflow-hidden rounded-sm border border-border">
                    <button
                      type="button"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-secondary disabled:opacity-40"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 border-x border-border text-center text-sm font-medium tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-secondary disabled:opacity-40"
                      disabled={quantity >= stock}
                      onClick={() =>
                        setQuantity((q) => Math.min(stock || 1, q + 1))
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {shortHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-xs text-muted-foreground line-clamp-4 [&_p]:my-0"
                    dangerouslySetInnerHTML={{ __html: shortHtml }}
                  />
                ) : uiProduct.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-4">
                    {uiProduct.description}
                  </p>
                ) : null}

                <Link
                  href={`/product/${uiProduct.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View full details
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>
          )}
        </div>

        {!isError && !isNotFound ? (
          <div className="shrink-0 border-t border-border bg-secondary/20 px-4 py-3 sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <AppButton
                type="button"
                variant="outline"
                className="cursor-pointer rounded-sm sm:flex-1"
                disabled={!inStock || isLoading || orderBusy}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {cartButtonLabel}
              </AppButton>
              <AppButton
                type="button"
                className="cursor-pointer rounded-sm sm:flex-1"
                disabled={!inStock || isLoading}
                isLoading={orderBusy}
                loadingText="Going to checkout…"
                onClick={() => void handlePlaceOrder()}
              >
                Place order
              </AppButton>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
