"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { IMAGE_URL } from "@/config/env";
import { useFavorite } from "@/hooks/useFavorite";
import { useProduct } from "@/hooks/useProducts";
import type { ProductDetail, ProductVariationDetail } from "@/lib/api/product/service";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { closeQuickView } from "@/store/slices/uiSlice";
import {
  selectIsInWishlist,
  setWishlistProductState,
} from "@/store/slices/wishlistSlice";
import type { Product } from "@/types";
import { ModalShell } from "@/components/shared/ModalShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FC } from "react";
import { toast } from "sonner";

import { AddToCartRow, ColorPicker, ProductImageGallery, SizePicker } from "@/components/product";
import { PriceDisplay, StarRating } from "@/components/ui";

const toImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${IMAGE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const toQuickViewProduct = (detail: ProductDetail): Product => {
  const finalPrices = detail.variations
    .map((variation) => variation.final_price ?? variation.selling_price)
    .filter((price) => Number.isFinite(price));
  const originalPrices = detail.variations
    .map((variation) => variation.selling_price)
    .filter((price) => Number.isFinite(price));
  const minPrice = detail.summary?.min_price ?? (finalPrices.length ? Math.min(...finalPrices) : 0);
  const maxOriginalPrice = originalPrices.length ? Math.max(...originalPrices) : minPrice;
  const hasDiscount = detail.variations.some((variation) => {
    const finalPrice = variation.final_price ?? variation.selling_price;
    return variation.discount > 0 || finalPrice < variation.selling_price;
  });
  const images = detail.images.map((image) => toImageUrl(image.path)).filter(Boolean);
  const sizes = detail.available_variants?.length
    ? detail.available_variants.map((variant) => variant.name).filter(Boolean)
    : Array.from(new Set(detail.variations.map((variation) => variation.variant?.name).filter(Boolean)));
  const colors = detail.available_colors?.length
    ? detail.available_colors.map((color) => ({
      name: color.name,
      value: color.hex || "#e5e7eb",
    }))
    : Array.from(new Map(detail.variations
      .filter((variation) => Boolean(variation.color?.name))
      .map((variation) => [
        variation.color.name,
        { name: variation.color.name, value: variation.color.hex || "#e5e7eb" },
      ])).values());
  const ratingSource = detail as ProductDetail & { avg_rating?: number; review_count?: number };

  return {
    id: detail.id,
    slug: detail.slug,
    name: detail.name,
    price: minPrice,
    oldPrice: hasDiscount ? maxOriginalPrice : null,
    badge: detail.featured ? "HOT" : detail.best_deal ? "SALE" : null,
    image: images[0] ?? "",
    images: images.length ? images : [""],
    category: detail.child_category?.name ?? detail.sub_category?.name ?? detail.main_category?.name ?? "Fashion",
    description: detail.short_description ?? detail.long_description ?? "",
    details: [],
    sizes,
    colors,
    rating: ratingSource.avg_rating ?? 0,
    reviewCount: ratingSource.review_count ?? 0,
    inStock: (detail.summary?.total_in_stock ?? detail.summary?.total_stock ?? 0) > 0,
  };
};

interface QuickViewModalContentProps {
  product: Product | null;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  inWishlist: boolean;
  onClose: () => void;
  onSizeSelect: (size: string) => void;
  onColorSelect: (color: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => boolean | void;
  onShopNow: () => boolean | void;
  onToggleWishlist: () => void;
}

const QuickViewModalContent: FC<QuickViewModalContentProps> = ({
  product,
  selectedSize,
  selectedColor,
  quantity,
  inWishlist,
  onClose,
  onSizeSelect,
  onColorSelect,
  onQuantityChange,
  onAddToCart,
  onShopNow,
  onToggleWishlist,
}) => {
  if (!product) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 sm:p-6">
        <Skeleton className="aspect-square rounded-2xl md:rounded-xl" />
        <div className="space-y-4 py-3 sm:py-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto md:overflow-hidden max-h-[85vh] sm:max-h-[80vh] md:h-[600px] md:max-h-[80vh]">
      {/* ── Image ── */}
      <ProductImageGallery
        images={product.images}
        name={product.name}
        badge={product.badge}
        variant="overlay"
        className="h-full min-h-[320px] md:min-h-0"
      />

      {/* ── Info panel ── */}
      <div className="p-5 sm:p-6 md:p-7 overflow-y-auto h-full flex flex-col">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
          {product.category}
        </p>
        <h2 className="font-display text-xl lg:text-2xl font-semibold text-foreground tracking-wide">
          {product.name}
        </h2>
        <StarRating rating={product.rating} count={product.reviewCount} size={12} className="mt-2" />
        <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="md" className="mt-3.5" />

        {product.colors.length > 0 && (
          <ColorPicker colors={product.colors} selected={selectedColor} onSelect={onColorSelect} className="mt-4" />
        )}
        {product.sizes.length > 0 && (
          <SizePicker sizes={product.sizes} selected={selectedSize} onSelect={onSizeSelect} className="mt-4" />
        )}

        <AddToCartRow
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          onAddToCart={onAddToCart}
          onShopNow={onShopNow}
          onToggleWishlist={onToggleWishlist}
          inWishlist={inWishlist}
          className="mt-5"
        />

        <Link
          href={`/product/${product.slug}`}
          onClick={onClose}
          className="mt-4 text-center text-xs tracking-[0.15em] uppercase text-accent hover:text-accent/80 underline underline-offset-4 transition-colors block"
        >
          View Full Details →
        </Link>
      </div>
    </div>
  );
};

const QuickViewModal = () => {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { isOpen, productId } = useAppSelector((s) => s.ui.quickView);
  const { useProductById } = useProduct(undefined, { enabled: false });
  const { data: productDetail } = useProductById(productId ?? 0);
  const { toggleFavorite } = useFavorite();
  const product = useMemo(
    () => productDetail ? toQuickViewProduct(productDetail) : null,
    [productDetail],
  );

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cachedProduct, setCachedProduct] = useState<Product | null>(null);

  const inWishlist = useAppSelector(selectIsInWishlist(productId ?? 0));

  // Seed first size/color like fashion PDP (and when product changes)
  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes[0] || "");
    setSelectedColor(product.colors[0]?.name || "");
    setQuantity(1);
  }, [productId, product]);

  useEffect(() => {
    if (product) setCachedProduct(product);
  }, [product]);

  useEffect(() => {
    if (!productDetail) return;
    dispatch(setWishlistProductState({
      productId: productDetail.id,
      isFavorite: productDetail.is_favourite === true,
    }));
  }, [dispatch, productDetail]);

  const selectedVariation = (): ProductVariationDetail | undefined => {
    if (!productDetail) return undefined;
    const size = selectedSize || product?.sizes[0] || "";
    const color = selectedColor || product?.colors[0]?.name || "";

    return productDetail.variations.find((variation) => {
      const matchesSize = !size || variation.variant?.name === size;
      const matchesColor = !color || variation.color?.name === color;
      return matchesSize && matchesColor;
    }) ?? productDetail.variations[0];
  };

  const handleAdd = (): boolean => {
    if (!product) return false;
    if (product.sizes.length > 0 && product.sizes[0] !== "One Size" && !selectedSize) {
      toast.error("Please select a size");
      return false;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a colour");
      return false;
    }
    const variation = selectedVariation();
    const price = variation?.final_price ?? product.price;
    dispatch(addItem({
      productId: String(product.id),
      productVariationId: variation?.id,
      title: product.name,
      price,
      originalPrice: variation?.selling_price ?? product.oldPrice ?? price,
      size: selectedSize || product.sizes[0] || "One Size",
      color: selectedColor || product.colors[0]?.name || "Default",
      image: product.image,
      quantity,
      stock: variation?.stock ?? 10,
      slug: product.slug,
      weight_kg: variation?.weight_kg ?? 0,
      freeDelivery: variation?.free_delivery === true,
    }));
    toast.success(`${product.name} added to cart`);
    return true;
  };

  const handleWishlist = () => {
    if (!product) return;

    void toggleFavorite(product.id, inWishlist)
      .then((response) => {
        const isNowFavorite = response.data?.is_favorite === true;
        toast.success(isNowFavorite ? "Added to wishlist" : "Removed from wishlist");
      })
      .catch((error: unknown) => {
        const message = error instanceof Error
          ? error.message
          : "Failed to update wishlist";
        toast.error(message);
      });
  };

  const handleClose = () => {
    dispatch(closeQuickView());
  };

  const handleShopNow = (): boolean => {
    if (!product) return false;
    if (product.sizes.length > 0 && product.sizes[0] !== "One Size" && !selectedSize) {
      toast.error("Please select a size"); return false;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a colour"); return false;
    }
    const variation = selectedVariation();
    const price = variation?.final_price ?? product.price;
    dispatch(addItem({
      productId: String(product.id),
      productVariationId: variation?.id,
      title: product.name,
      price,
      originalPrice: variation?.selling_price ?? product.oldPrice ?? price,
      size: selectedSize || product.sizes[0] || "One Size",
      color: selectedColor || product.colors[0]?.name || "Default",
      image: product.image,
      quantity,
      stock: variation?.stock ?? 10,
      slug: product.slug,
      weight_kg: variation?.weight_kg ?? 0,
      freeDelivery: variation?.free_delivery === true,
    }));
    handleClose();
    router.push("/checkout");
    return true;
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      containerClassName="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4"
      panelClassName="relative bg-background shadow-2xl w-full sm:max-w-[900px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-2xl"
      panelOpenClassName="opacity-100 translate-y-0 scale-100"
      panelClosedClassName="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
      closeButtonClassName="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-8 h-8 bg-background/85 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hover:rotate-90 active:scale-95"
      closeDurationMs={260}
    >
      <QuickViewModalContent
        product={isOpen ? product : cachedProduct}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        quantity={quantity}
        inWishlist={inWishlist}
        onClose={handleClose}
        onSizeSelect={setSelectedSize}
        onColorSelect={setSelectedColor}
        onQuantityChange={setQuantity}
        onAddToCart={handleAdd}
        onShopNow={handleShopNow}
        onToggleWishlist={handleWishlist}
      />
    </ModalShell>
  );
};

export default QuickViewModal;
