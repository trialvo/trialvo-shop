"use client";

import Link from "next/link";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/data/products";
import type { ProductDetail } from "@/lib/api/product/service";
import type { Review } from "@/lib/api/review/service";
import { useCart } from "@/hooks/useCart";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { productToCompareSlot } from "@/lib/adapters/compareSlot";
import { useWishlist } from "@/context/WishlistContext";
import { AppButton } from '@/components/shared/AppButton';
import { ViewAllLink } from "@/components/shared/SectionHeader";
import {
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  CreditCard,
  Check,
  Share2,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { buildProductBreadcrumbTrail } from "@/lib/breadcrumbs/buildProductBreadcrumbTrail";
import { sanitizeProductHtml } from "@/lib/security/html";
import { resolveMediaUrl } from "@/lib/media/url";
import { pickVariation } from "@/lib/product/pickVariation";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";
import { toast } from "sonner";

type ProductDetailClientProps = {
  product: Product;
  detail: ProductDetail;
  related: Product[];
  reviews?: Review[];
  reviewSummary?: { count: number; average: number };
};

export default function ProductDetailClient({
  product,
  detail,
  related,
  reviews = [],
  reviewSummary = { count: 0, average: 0 },
}: ProductDetailClientProps) {
  const { addToCart, isInCart, getQuantityInCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const variations = detail.variations ?? [];
  const colors = detail.available_colors ?? [];
  const variants = detail.available_variants ?? [];
  const variantLabel =
    variants[0]?.attribute_name?.split(" - ")[0]?.trim() || "Size";

  const [selectedColorId, setSelectedColorId] = useState<number | null>(
    colors[0]?.id ?? variations[0]?.color?.id ?? null,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants[0]?.id ?? variations[0]?.variant?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "specs" | "description" | "questions" | "reviews"
  >("description");
  const [selectedImage, setSelectedImage] = useState(0);

  const selectedSku = useMemo(
    () => pickVariation(variations, selectedColorId, selectedVariantId),
    [variations, selectedColorId, selectedVariantId],
  );

  const selectedColorName =
    colors.find((c) => c.id === selectedColorId)?.name ??
    selectedSku?.color?.name ??
    product.colors?.[0];

  const displayPrice = selectedSku?.final_price ?? product.price;
  const displayOriginal =
    selectedSku && selectedSku.final_price < selectedSku.selling_price
      ? selectedSku.selling_price
      : product.originalPrice;
  const stock = selectedSku?.stock ?? (product.inStock ? 99 : 0);
  const inStock = (selectedSku?.in_stock ?? stock > 0) && stock > 0;

  // Cap quantity when SKU changes
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, stock || 1)));
  }, [stock, selectedSku?.id]);

  // Prefer images matching selected color SKU when available
  const galleryImages = useMemo(() => {
    const fromDetail = (detail.images ?? [])
      .filter((img) => {
        if (selectedColorId == null || img.sku_color_id == null) return true;
        return img.sku_color_id === selectedColorId;
      })
      .map((img) => resolveMediaUrl(img.path));

    const list =
      fromDetail.length > 0
        ? fromDetail
        : [product.image, ...(product.images || [])];

    return Array.from(new Set(list.filter(Boolean)));
  }, [detail.images, selectedColorId, product.image, product.images]);

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColorId]);

  const wishlisted = isInWishlist(product.id);
  const safeDescriptionHtml = sanitizeProductHtml(detail.long_description);
  const categoryHref = product.category
    ? buildShopCategoryHref(product.category)
    : "/shop";

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied");
    } catch {
      /* user cancelled share */
    }
  };

  const activeSkuId = selectedSku?.id;
  const lineInCart = activeSkuId
    ? isInCart(product, activeSkuId)
    : isInCart(product);
  const qtyInCart = activeSkuId
    ? getQuantityInCart(product, activeSkuId)
    : getQuantityInCart(product);
  const cartButtonLabel = addToCartLabel({
    inCart: lineInCart,
    quantityInCart: qtyInCart,
  });

  const handleAddToCart = () => {
    if (lineInCart) {
      setIsCartOpen(true);
      toast.message("Already in cart", {
        description:
          "Remove it from the cart before adding again, or edit it on the cart page.",
      });
      return;
    }
    if (!inStock) {
      toast.error("This option is out of stock");
      return;
    }
    if (!selectedSku?.id) {
      toast.error("Please select a valid product option");
      return;
    }
    // product_sku_id is required by both /user/order and /guest/order
    const added = addToCart(
      product,
      quantity,
      selectedColorName,
      selectedSku.id,
    );
    if (added) toast.success("Added to cart");
  };

  const reviewCount = reviewSummary.count || product.reviewCount || 0;
  const rating =
    reviewSummary.average > 0 ? reviewSummary.average : product.rating;

  const breadcrumbItems = useMemo(
    () => buildProductBreadcrumbTrail(detail),
    [detail],
  );

  return (
    <Layout>
      <div className="container py-4 md:py-8 pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Share:</span>
            <button
              type="button"
              className="hover:text-primary"
              aria-label="Share product"
              onClick={() => {
                void handleShare();
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const slot = productToCompareSlot(product);
              return slot ? (
                <AddToCompareButton product={slot} variant="full" />
              ) : null;
            })()}
            <button
              type="button"
              onClick={() => {
                void toggleWishlist(product.id);
              }}
              className={`flex items-center gap-1 hover:text-primary ${
                wishlisted ? "text-destructive" : ""
              }`}
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={wishlisted ? "currentColor" : "none"}
              />{" "}
              Save to Wishlist
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10">
          <div className="space-y-3">
            <div className="aspect-square rounded-sm overflow-hidden bg-secondary/30 border border-border">
              <img
                src={galleryImages[selectedImage] || product.image}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            {galleryImages.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                {galleryImages.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-sm overflow-hidden border-2 shrink-0 ${
                      selectedImage === i ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h1 className="font-heading text-lg md:text-2xl font-bold leading-tight">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>
                Price:{" "}
                <strong className="text-primary text-base">
                  ৳{displayPrice.toLocaleString()}
                </strong>
              </span>
              {displayOriginal ? (
                <span className="line-through">
                  ৳{displayOriginal.toLocaleString()}
                </span>
              ) : null}
              <span>
                Status:{" "}
                <strong className={inStock ? "text-success" : "text-destructive"}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </strong>
              </span>
              {selectedSku?.sku ? (
                <span>SKU: {selectedSku.sku}</span>
              ) : (
                <span>Product Code: {product.id}</span>
              )}
            </div>

            {(rating > 0 || reviewCount > 0) && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              </div>
            )}

            {product.brand ? (
              <p className="text-xs text-muted-foreground mt-1">
                Brand:{" "}
                <Link
                  href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                  className="text-primary hover:underline"
                >
                  {product.brand}
                </Link>
              </p>
            ) : null}

            {product.highlights && product.highlights.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Key Features</h3>
                <ul className="space-y-1">
                  {product.highlights.map((h) => (
                    <li
                      key={h}
                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                    >
                      <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />{" "}
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {colors.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-medium mb-1.5">
                  Available Colors
                  {selectedColorName ? `: ${selectedColorName}` : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((c) => {
                    const available = variations.some(
                      (v) =>
                        v.color?.id === c.id &&
                        (selectedVariantId == null ||
                          v.variant?.id === selectedVariantId) &&
                        (v.in_stock || v.stock > 0),
                    );
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!available && colors.length > 1}
                        onClick={() => setSelectedColorId(c.id)}
                        className={`px-3 py-1.5 rounded-sm border text-xs transition-all inline-flex items-center gap-1.5 ${
                          selectedColorId === c.id
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        } ${!available ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {c.hex ? (
                          <span
                            className="h-3 w-3 rounded-sm border border-border shrink-0"
                            style={{ backgroundColor: c.hex }}
                            aria-hidden
                          />
                        ) : null}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {variants.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-medium mb-1.5">
                  {variantLabel}
                  {selectedSku?.variant?.name
                    ? `: ${selectedSku.variant.name}`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((v) => {
                    const available = variations.some(
                      (sku) =>
                        sku.variant?.id === v.id &&
                        (selectedColorId == null ||
                          sku.color?.id === selectedColorId) &&
                        (sku.in_stock || sku.stock > 0),
                    );
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`min-w-[2.75rem] px-3 py-1.5 rounded-sm border text-xs transition-all ${
                          selectedVariantId === v.id
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        } ${!available ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {inStock && stock <= 10 ? (
              <p className="mt-3 text-xs text-warning font-medium">
                Only {stock} left in stock
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-border rounded-sm overflow-hidden bg-secondary/20">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-secondary text-sm transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 py-2 font-semibold text-sm min-w-[2.5rem] text-center border-l border-r border-border">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, stock), q + 1))
                  }
                  className="px-3 py-2 hover:bg-secondary text-sm transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <AppButton
                variant={lineInCart ? "outline" : "primary"}
                className="font-bold h-10 flex-1 shadow-md hover:shadow-lg transition-all rounded-sm"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
                {inStock ? cartButtonLabel : "Out of Stock"}
              </AppButton>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 text-[10px] p-2 bg-secondary/30 rounded-sm text-center">
                <Truck className="h-4 w-4 text-primary" /> Fast Delivery
              </div>
              <div className="flex flex-col items-center gap-1 text-[10px] p-2 bg-secondary/30 rounded-sm text-center">
                <CreditCard className="h-4 w-4 text-primary" /> Cash on Delivery
              </div>
              <div className="flex flex-col items-center gap-1 text-[10px] p-2 bg-secondary/30 rounded-sm text-center">
                <Shield className="h-4 w-4 text-primary" />{" "}
                {detail.free_delivery
                  ? "Free Delivery"
                  : product.warranty || "Official Warranty"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <div className="flex border-b border-border gap-0 overflow-x-auto scrollbar-hidden">
              {(
                ["description", "specs", "questions", "reviews"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-semibold capitalize transition-all border-b-2 ${
                    activeTab === tab
                      ? "text-primary border-primary bg-primary/5"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {tab === "specs"
                    ? "Specification"
                    : tab === "questions"
                      ? "Questions (0)"
                      : tab === "reviews"
                        ? `Reviews (${reviewCount})`
                        : tab}
                </button>
              ))}
            </div>
            <div className="py-6 border border-t-0 border-border rounded-b-sm p-4 sm:p-6 bg-card">
              {activeTab === "specs" && product.specifications ? (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-heading font-semibold text-lg mb-4 text-primary border-b pb-2">
                    Technical Specification
                  </h3>
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([k, v]) => (
                        <tr
                          key={k}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-3 text-sm font-semibold w-1/3 text-muted-foreground">
                            {k}
                          </td>
                          <td className="py-3 text-sm">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {activeTab === "specs" && !product.specifications ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  No technical specifications available for this product.
                </p>
              ) : null}

              {activeTab === "description" ? (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-heading font-semibold text-lg mb-4">
                    {product.title}
                  </h3>
                  {safeDescriptionHtml ? (
                    <div
                      className="text-sm text-muted-foreground leading-relaxed space-y-3 product-description prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary"
                      dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description available.
                    </p>
                  )}
                </div>
              ) : null}

              {activeTab === "questions" ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-heading font-semibold text-lg">
                        Product Inquiries
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Have a question? Get detailed info from our experts.
                      </p>
                    </div>
                    <AppButton
                      variant="outline"
                      size="sm"
                      className="rounded-sm text-xs font-semibold"
                      asChild
                    >
                      <Link href="/contact">Ask Question</Link>
                    </AppButton>
                  </div>
                  <div className="text-center py-12 bg-secondary/10 rounded-sm border border-dashed border-border">
                    <p className="text-sm text-muted-foreground italic">
                      No questions asked yet. Be the first to ask!
                    </p>
                  </div>
                </div>
              ) : null}

              {activeTab === "reviews" ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-heading font-semibold text-lg">
                        Customer Reviews
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Authentic feedback from verified owners.
                      </p>
                    </div>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/10 rounded-sm border border-dashed border-border">
                      <p className="text-sm text-muted-foreground italic">
                        No reviews yet. Share your experience with this product!
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {reviews.map((review) => (
                        <li
                          key={review.id}
                          className="border border-border rounded-sm p-4 bg-secondary/10"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold">
                              {review.user_name}
                            </p>
                            {typeof review.rating === "number" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                {review.rating}
                              </span>
                            ) : null}
                          </div>
                          {review.review_text ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.review_text}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <aside>
            <div className="border border-border rounded-sm p-4 bg-card sticky top-24">
              <h3 className="font-heading font-semibold text-sm mb-4 text-center border-b pb-2">
                You May Also Like
              </h3>
              <div className="space-y-4">
                {related.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex gap-3 group">
                    <Link
                      href={`/product/${p.slug}`}
                      className="w-16 h-16 rounded-sm overflow-hidden shrink-0 border border-border hover:border-primary transition-colors"
                    >
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/product/${p.slug}`}
                        className="text-xs font-semibold line-clamp-2 hover:text-primary transition-colors leading-snug"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-bold text-primary">
                          ৳{p.price.toLocaleString()}
                        </span>
                        {p.originalPrice ? (
                          <span className="text-[10px] text-muted-foreground line-through">
                            ৳{p.originalPrice.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                {related.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    More products coming soon
                  </p>
                ) : null}
              </div>
              <AppButton
                variant="outline"
                className="w-full mt-6 text-xs h-8 rounded-sm font-semibold"
                asChild
              >
                <Link href={categoryHref}>
                  View More
                </Link>
              </AppButton>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
                Related Products
              </h2>
              <ViewAllLink href="/shop" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-[41] flex items-center gap-3 border-t border-border bg-card/95 p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden">
        <div className="flex-1">
          <span className="text-base font-bold font-heading text-primary">
            ৳{displayPrice.toLocaleString()}
          </span>
        </div>
        <AppButton
          variant={lineInCart ? "outline" : "accent"}
          className="font-bold text-xs h-9 rounded-sm max-w-[45%]"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          <span className="truncate">
            {inStock
              ? addToCartLabel({
                  inCart: lineInCart,
                  quantityInCart: qtyInCart,
                  compact: true,
                })
              : "N/A"}
          </span>
        </AppButton>
        <AppButton
          variant="primary"
          className="font-bold text-xs h-9 flex-1 rounded-sm"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {lineInCart ? "In cart" : "Buy Now"}
        </AppButton>
      </div>
    </Layout>
  );
}
