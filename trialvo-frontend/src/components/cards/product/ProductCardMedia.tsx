import { Play } from "lucide-react";
import { ProductCardBadges } from "@/components/cards/product/ProductCardBadges";
import type { ProductBadge } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductCardMediaProps = {
  imageSrc: string;
  imageAlt: string;
  badges: ProductBadge[];
  language: MarketplaceLanguage;
  showPlay?: boolean;
};

/** Top media — API thumbnail, all available badges, optional play affordance */
export function ProductCardMedia({
  imageSrc,
  imageAlt,
  badges,
  language,
  showPlay = false,
}: Readonly<ProductCardMediaProps>) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          loading="lazy"
          itemProp="image"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {language === "bn" ? "ছবি নেই" : "No image"}
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent"
        aria-hidden="true"
      />

      <ProductCardBadges
        badges={badges}
        language={language}
        placement="overlay"
      />

      {showPlay ? (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-accent shadow-md backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default ProductCardMedia;
