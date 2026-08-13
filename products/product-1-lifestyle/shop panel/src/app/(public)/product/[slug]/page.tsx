"use client";

import { ChevronRight, Home, PackageSearch, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useFavorite } from "@/hooks/useFavorite";
import { useProductBySlug, useProductReviews, useProducts, useRelatedProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import {
  selectIsInWishlist,
  setWishlistProductState,
} from "@/store/slices/wishlistSlice";

import {
  AddToCartRow, ColorPicker, ProductImageGallery,
  ProductInfoTabs, RelatedProducts, SizePicker, TrustBadges,
} from "@/components/product";
import { StarRating } from "@/components/ui";
import type { ProductDetail } from "@/lib/api/product/service";
import { IMAGE_URL } from "@/config/env";

const toImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${IMAGE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

/* ── Loading skeleton ── */
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          <Skeleton className="aspect-square" />
          <div className="space-y-4 pt-2">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Not found ── */
function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 py-32">
      <div className="w-16 h-16 bg-secondary flex items-center justify-center">
        <PackageSearch size={28} className="text-muted-foreground/50" />
      </div>
      <p className="text-lg font-semibold text-foreground">Product not found</p>
      <Link href="/shop"
        className="text-[13px] border border-accent text-accent px-6 py-2 hover:bg-accent hover:text-accent-foreground transition-all">
        Browse All Products
      </Link>
    </div>
  );
}

/* ── Product Info Panel (Right Side) ── */
interface ProductInfoPanelProps {
  product: ProductDetail;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  inWishlist: boolean;
  onAddToCart: () => boolean | void;
  onShopNow: () => boolean | void;
  onToggleWishlist: () => void;
  onShare: () => void;
  avgRating: number;
  reviewCount: number;
}

function ProductInfoPanel({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
  inWishlist,
  onAddToCart,
  onShopNow,
  onToggleWishlist,
  onShare,
  avgRating,
  reviewCount,
}: ProductInfoPanelProps) {
  const hasColors = product.available_colors && product.available_colors.length > 0;
  const hasVariants = product.available_variants && product.available_variants.length > 0;

  const activeVar = product.variations.find((v) => {
    const matchesColor = !hasColors || v.color?.name === selectedColor;
    const matchesVariant = !hasVariants || v.variant?.name === selectedSize;
    return matchesColor && matchesVariant;
  });

  const isColorSelected = !hasColors || !!selectedColor;
  const isSizeSelected = !hasVariants || !!selectedSize;
  const isSelectionComplete = isColorSelected && isSizeSelected;

  const finalPrices = product.variations
    .map((v) => v.final_price ?? v.selling_price)
    .filter((price) => Number.isFinite(price));

  const minPrice = product.summary?.min_price ?? (finalPrices.length ? Math.min(...finalPrices) : 0);
  const maxPrice = product.summary?.max_price ?? (finalPrices.length ? Math.max(...finalPrices) : 0);
  const totalStock = product.summary?.total_stock ?? product.variations.reduce((acc, v) => acc + (v.stock ?? 0), 0);

  let displayPrice: string;
  let displayOldPrice: number | null = null;
  let discountPct: number | null = null;

  if (isSelectionComplete && activeVar) {
    displayPrice = `$${activeVar.final_price.toFixed(2)}`;
    if (activeVar.selling_price > activeVar.final_price) {
      displayOldPrice = activeVar.selling_price;
      discountPct = Math.round((1 - activeVar.final_price / activeVar.selling_price) * 100);
    }
  } else {
    if (minPrice === maxPrice) {
      displayPrice = `$${minPrice.toFixed(2)}`;
    } else {
      displayPrice = `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
  }

  const skuText = activeVar
    ? activeVar.sku
    : product.slug.toUpperCase().replace(/-/g, "-").slice(0, 22);

  const isOutOfStock = activeVar
    ? !activeVar.in_stock || activeVar.stock <= 0
    : totalStock <= 0;

  const categoryName = product.main_category?.name || "Product";

  const colorPickerItems = product.available_colors.map((c) => ({
    name: c.name,
    value: c.hex || "#FFFFFF",
  }));

  const sizePickerItems = product.available_variants.map((v) => v.name);

  return (
    <div className="flex flex-col lg:sticky lg:top-24">

      {/* ① Product name + Share */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-snug tracking-tight flex-1">
          {product.name}
        </h1>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share product"
          className="w-10 h-10 border border-border flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Share2 size={15} />
        </button>
      </div>

      {/* ② Brand */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 border border-border/60 flex items-center justify-center bg-secondary/40 shrink-0">
          <span className="text-[8px] font-bold text-foreground/50 uppercase tracking-tight leading-none">
            {categoryName.slice(0, 4)}
          </span>
        </div>
        <span className="text-[13px] text-foreground/80 font-medium">
          {categoryName}
        </span>
      </div>

      {/* ③ Price */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-[22px] font-bold text-foreground tracking-tight">
          {displayPrice}
        </span>
        {displayOldPrice && (
          <span className="text-[15px] text-muted-foreground line-through">
            ${displayOldPrice.toFixed(2)}
          </span>
        )}
        {discountPct !== null && discountPct > 0 && (
          <span className="text-[13px] font-semibold text-sale">
            ({discountPct}% OFF)
          </span>
        )}
      </div>

      {/* ④ SKU / Stock / Selection summary */}
      <div className="space-y-1.5 pb-5 border-b border-border mb-5">
        <p className="text-[13px] text-foreground/70">
          <span className="font-medium text-foreground">SKU:</span>{" "}
          {skuText}
        </p>
        <p className={cn(
          "text-[13px] font-medium",
          !isOutOfStock ? "text-foreground" : "text-sale"
        )}>
          {!isOutOfStock ? "In Stock" : "Out of Stock"}
        </p>
        {(selectedSize || selectedColor) && (
          <p className="text-[13px] text-muted-foreground">
            Selected:{" "}
            <span className="text-foreground font-semibold">
              {[selectedSize, selectedColor].filter(Boolean).join(" / ")}
            </span>
          </p>
        )}
        <StarRating rating={avgRating} count={reviewCount} />
      </div>

      {/* ⑤ Size */}
      {sizePickerItems.length > 0 && (
        <SizePicker
          sizes={sizePickerItems}
          selected={selectedSize}
          onSelect={setSelectedSize}
          className="mb-5"
        />
      )}

      {/* ⑥ Color */}
      {colorPickerItems.length > 0 && (
        <ColorPicker
          colors={colorPickerItems}
          selected={selectedColor}
          onSelect={setSelectedColor}
          className="mb-5"
        />
      )}

      {/* ⑦ Quantity + CTA */}
      <div className="pt-1 border-t border-border mt-1">
        <AddToCartRow
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={onAddToCart}
          onShopNow={onShopNow}
          onToggleWishlist={onToggleWishlist}
          inWishlist={inWishlist}
          className="mt-5"
        />
      </div>

      {/* ⑧ Trust badges */}
      <TrustBadges className="mt-6" />
    </div>
  );
}

/* ── ProductDetailPage Orchestrator ── */
export default function ProductDetailPage() {
  const params   = useParams();
  const slug     = params.slug as string;
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { toggleFavorite } = useFavorite();

  const { data: product, isLoading, isFetching } = useProductBySlug(slug || "");

  // Local state to keep the active product details on screen during page transitions.
  // This prevents layout jumping/flashing of skeletons while fetching new products.
  const [activeProduct, setActiveProduct]   = useState<ProductDetail | null>(null);
  const [isFading, setIsFading]             = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ProductDetail | null>(null);

  const [selectedSize,  setSelectedSize]  = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity,      setQuantity]      = useState(1);

  // Sync pending product when fetched successfully
  useEffect(() => {
    if (product) {
      setPendingProduct(product);
    }
  }, [product]);

  // Smooth scroll to top and start fade-out when slug changes
  useEffect(() => {
    if (activeProduct) {
      setIsFading(true);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [slug]);

  // Swap active product details once fully faded out and new data is ready
  useEffect(() => {
    if (isFading && pendingProduct && pendingProduct.id !== activeProduct?.id) {
      const timer = setTimeout(() => {
        setActiveProduct(pendingProduct);
        setIsFading(false);
      }, 350); // Matches the 350ms transition duration
      return () => clearTimeout(timer);
    }
  }, [isFading, pendingProduct, activeProduct]);

  // Initialize activeProduct on initial mount
  useEffect(() => {
    if (product && !activeProduct) {
      setActiveProduct(product);
    }
  }, [product, activeProduct]);

  // Fashion-style: always pre-select first size + color so Shop Now / Add to Cart
  // work without forcing a manual click when only one option exists.
  useEffect(() => {
    if (!activeProduct) return;
    const sizes = (activeProduct.available_variants ?? []).map((v) => v.name).filter(Boolean);
    const colors = activeProduct.available_colors ?? [];
    setSelectedSize(sizes[0] || "");
    setSelectedColor(colors[0]?.name || "");
    setQuantity(1);
  }, [activeProduct?.id]);

  useEffect(() => {
    if (!activeProduct) return;
    dispatch(setWishlistProductState({
      productId: activeProduct.id,
      isFavorite: activeProduct.is_favourite === true,
    }));
  }, [activeProduct, dispatch]);

  const { data: reviewsData }        = useProductReviews(activeProduct?.id ?? 0);
  const { data: related }            = useRelatedProducts(activeProduct?.id ?? 0);
  const { products: allProducts }    = useProducts();

  const inWishlist = useAppSelector(selectIsInWishlist(activeProduct?.id ?? 0));

  if (isLoading && !activeProduct) {
    return <ProductDetailSkeleton />;
  }

  if (!isLoading && !isFetching && !product && !activeProduct) {
    return <ProductNotFound />;
  }

  if (!activeProduct) {
    return <ProductDetailSkeleton />;
  }

  const hasColors = activeProduct.available_colors && activeProduct.available_colors.length > 0;
  const hasVariants = activeProduct.available_variants && activeProduct.available_variants.length > 0;

  const fallbackRelated =
    related && related.length > 0
      ? related
      : (allProducts ?? []).filter((p) => p.id !== activeProduct.id).slice(0, 4);

  const badge = activeProduct.best_deal ? "SALE" : activeProduct.featured ? "HOT" : null;

  const galleryImages = activeProduct.images && activeProduct.images.length > 0
    ? activeProduct.images.map((img) => toImageUrl(img.path))
    : [];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator.share({ title: activeProduct.name, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard" });
      }
    }
  };

  const getActiveVariation = () => {
    return activeProduct.variations.find((v) => {
      const matchesColor = !hasColors || v.color?.name === selectedColor;
      const matchesVariant = !hasVariants || v.variant?.name === selectedSize;
      return matchesColor && matchesVariant;
    });
  };

  const validateSelections = () => {
    const sizeNames = (activeProduct.available_variants ?? []).map((v) => v.name);
    const needsSize =
      sizeNames.length > 0 && sizeNames[0] !== "One Size";
    if (needsSize && !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return false;
    }
    if (hasColors && activeProduct.available_colors.length > 0 && !selectedColor) {
      toast({ title: "Please select a colour", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAddToCart = (): boolean => {
    if (!validateSelections()) return false;

    const activeVar = getActiveVariation();

    const finalPrices = activeProduct.variations
      .map((v) => v.final_price ?? v.selling_price)
      .filter((price) => Number.isFinite(price));
    const minPrice = activeProduct.summary?.min_price ?? (finalPrices.length ? Math.min(...finalPrices) : 0);
    const totalStock = activeProduct.summary?.total_stock ?? activeProduct.variations.reduce((acc, v) => acc + (v.stock ?? 0), 0);

    const itemPrice = activeVar ? activeVar.final_price : minPrice;
    const itemOriginalPrice = activeVar ? activeVar.selling_price : minPrice;
    const itemStock = activeVar ? activeVar.stock : totalStock;
    const variationId = activeVar ? activeVar.id : undefined;
    const weightKg = activeVar && typeof activeVar.weight_kg === "number" ? activeVar.weight_kg : 0;
    const freeDel = activeVar && typeof activeVar.free_delivery === "boolean" ? activeVar.free_delivery : activeProduct.free_delivery;

    const firstColorObj = activeProduct.available_colors.find(c => c.name === selectedColor);
    const colorId = firstColorObj?.id;
    const matchedImg = activeProduct.images.find(img => img.sku_color_id === colorId) || activeProduct.images[0];
    const imagePath = toImageUrl(matchedImg?.path || "");

    dispatch(addItem({
      productId: String(activeProduct.id),
      productVariationId: variationId,
      title: activeProduct.name,
      image: imagePath,
      price: itemPrice,
      originalPrice: itemOriginalPrice,
      size: selectedSize || "One Size",
      color: selectedColor || "Default",
      quantity: quantity,
      stock: itemStock,
      weight_kg: weightKg,
      freeDelivery: freeDel,
      slug: activeProduct.slug,
    }));

    toast({ title: `${activeProduct.name} added to cart` });
    return true;
  };

  const handleShopNow = (): boolean => {
    if (!validateSelections()) return false;

    const activeVar = getActiveVariation();

    const finalPrices = activeProduct.variations
      .map((v) => v.final_price ?? v.selling_price)
      .filter((price) => Number.isFinite(price));
    const minPrice = activeProduct.summary?.min_price ?? (finalPrices.length ? Math.min(...finalPrices) : 0);
    const totalStock = activeProduct.summary?.total_stock ?? activeProduct.variations.reduce((acc, v) => acc + (v.stock ?? 0), 0);

    const itemPrice = activeVar ? activeVar.final_price : minPrice;
    const itemOriginalPrice = activeVar ? activeVar.selling_price : minPrice;
    const itemStock = activeVar ? activeVar.stock : totalStock;
    const variationId = activeVar ? activeVar.id : undefined;
    const weightKg = activeVar && typeof activeVar.weight_kg === "number" ? activeVar.weight_kg : 0;
    const freeDel = activeVar && typeof activeVar.free_delivery === "boolean" ? activeVar.free_delivery : activeProduct.free_delivery;

    const firstColorObj = activeProduct.available_colors.find(c => c.name === selectedColor);
    const colorId = firstColorObj?.id;
    const matchedImg = activeProduct.images.find(img => img.sku_color_id === colorId) || activeProduct.images[0];
    const imagePath = toImageUrl(matchedImg?.path || "");

    dispatch(addItem({
      productId: String(activeProduct.id),
      productVariationId: variationId,
      title: activeProduct.name,
      image: imagePath,
      price: itemPrice,
      originalPrice: itemOriginalPrice,
      size: selectedSize || "One Size",
      color: selectedColor || "Default",
      quantity: quantity,
      stock: itemStock,
      weight_kg: weightKg,
      freeDelivery: freeDel,
      slug: activeProduct.slug,
    }));

    router.push("/checkout");
    return true;
  };

  const handleToggleWishlist = () => {
    void toggleFavorite(activeProduct.id, inWishlist)
      .then((response) => {
        const isNowFavorite = response.data?.is_favorite === true;
        toast({
          title: isNowFavorite ? "Added to wishlist" : "Removed from wishlist",
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error
          ? error.message
          : "Failed to update wishlist";
        toast({ title: message, variant: "destructive" });
      });
  };

  return (
    <div className={cn(
      "min-h-screen bg-background transition-all duration-[350ms] ease-in-out",
      (isFading || isFetching && !product)
        ? "opacity-0 scale-[0.99] blur-[2px] pointer-events-none"
        : "opacity-100 scale-100 blur-0"
    )}>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href={`/shop?category=${activeProduct.main_category?.name}`} className="hover:text-foreground transition-colors">
            {activeProduct.main_category?.name}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{activeProduct.name}</span>
        </nav>
      </div>

      {/* ── Main product section ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* ── Left: Gallery ── */}
          <ProductImageGallery
            images={galleryImages}
            name={activeProduct.name}
            badge={badge}
            variant="vertical"
          />

          {/* ── Right: Info panel ── */}
          <ProductInfoPanel
            product={activeProduct}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            quantity={quantity}
            setQuantity={setQuantity}
            inWishlist={inWishlist}
            onAddToCart={handleAddToCart}
            onShopNow={handleShopNow}
            onToggleWishlist={handleToggleWishlist}
            onShare={handleShare}
            avgRating={reviewsData?.avg_rating ?? 0}
            reviewCount={reviewsData?.total_reviews ?? 0}
          />
        </div>

        {/* ── Info tabs ── */}
        <ProductInfoTabs
          description={activeProduct.long_description || activeProduct.short_description || ""}
          details={[]}
          reviews={reviewsData?.reviews ?? []}
          starBreakdown={reviewsData?.star_breakdown}
          avgRating={reviewsData?.avg_rating}
          className="mt-14"
        />

        {/* ── Related products ── */}
        <RelatedProducts products={fallbackRelated} />
      </section>
    </div>
  );
}
