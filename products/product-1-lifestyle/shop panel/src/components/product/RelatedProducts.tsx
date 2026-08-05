import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";
import { BADGE_STYLES } from "@/lib/theme";
import type { Product } from "@/types";
import type { RelatedProduct, ProductListItem } from "@/lib/api/product/service";
import { IMAGE_URL } from "@/config/env";

interface RelatedProductsProps {
  products: Array<Product | RelatedProduct | ProductListItem>;
  className?: string;
}



const toImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${IMAGE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  const normalizedProducts = products.map((p) => {
    if ("min_price" in p) {
      // RelatedProduct
      const rp = p as RelatedProduct;
      const variation = rp.variations?.[0];
      const price = variation ? variation.final_price : rp.min_price;
      const oldPrice = variation && variation.selling_price > price ? variation.selling_price : null;
      const discountPct = variation && variation.discount_type !== null && variation.discount > 0
        ? variation.discount
        : null;
      return {
        id: rp.id,
        slug: rp.slug,
        name: rp.name,
        price,
        oldPrice,
        badge: discountPct ? "SALE" : null,
        image: toImageUrl(rp.image),
        category: "Product",
        rating: 4,
      };
    } else if ("price_range" in p || "thumbnail" in p) {
      // ProductListItem
      const pli = p as ProductListItem;
      const firstVar = pli.variations?.[0];
      return {
        id: pli.id,
        slug: pli.slug,
        name: pli.name,
        price: pli.price_range?.min ?? 0,
        oldPrice: pli.price_range?.has_discount && firstVar && firstVar.selling_price > firstVar.buying_price ? firstVar.selling_price : null,
        badge: pli.best_deal ? "SALE" : pli.featured ? "HOT" : null,
        image: toImageUrl(pli.thumbnail || pli.images?.[0]?.path),
        category: "Product",
        rating: pli.avg_rating ?? 4,
      };
    }
    return p;
  });

  return (
    <div className={cn("mt-16 pt-10 border-t border-border", className)}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h2 className="font-display text-xl font-bold text-foreground tracking-tight">
          You May Also Like
        </h2>
        <Link href="/shop"
          className="flex items-center gap-1 text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground font-semibold transition-colors">
          View All <ArrowRight size={11} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6">
        {normalizedProducts.map((p) => {
          const badgeKey    = p.badge?.toUpperCase() ?? "";
          const discountPct = p.oldPrice
            ? Math.round((1 - p.price / p.oldPrice) * 100)
            : null;

          return (
            <Link href={`/product/${p.slug}`} key={p.id} className="group flex flex-col">
              {/* Image */}
              <div className="relative overflow-hidden bg-secondary aspect-[3/4] mb-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {p.badge && (
                  <span className={cn(
                    "absolute top-2 left-2 text-[9px] tracking-[0.15em] uppercase font-bold px-2 py-0.5",
                    BADGE_STYLES[badgeKey] ?? "bg-accent text-accent-foreground"
                  )}>
                    {p.badge}
                  </span>
                )}
                {discountPct && (
                  <span className="absolute top-2 right-2 bg-background text-[10px] font-bold text-foreground px-1.5 py-0.5 border border-border">
                    -{discountPct}%
                  </span>
                )}
              </div>

              {/* Info */}
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                {p.category}
              </p>
              <h3 className="text-[13px] font-semibold text-foreground truncate group-hover:text-accent transition-colors leading-snug mb-1">
                {p.name}
              </h3>
              <StarRating rating={p.rating ?? 4} size={9} className="mb-1.5" />
              <PriceDisplay price={p.price} oldPrice={p.oldPrice} size="sm" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
