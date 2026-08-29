import { DynamicBadge } from "@/components/ui/DynamicBadge";
import { localize } from "@/lib/localize";
import type { ProductBadge } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

export type ProductCardBadgesProps = {
  badges: ProductBadge[];
  language: MarketplaceLanguage;
  /** Overlay on media vs inline on card body */
  placement?: "overlay" | "inline";
};

/** Renders every API-derived badge via the shared DynamicBadge */
export function ProductCardBadges({
  badges,
  language,
  placement = "overlay",
}: Readonly<ProductCardBadgesProps>) {
  const visible = badges.slice(0, 2);
  if (visible.length === 0) return null;

  const surface = placement === "overlay" ? "overlay" : "flat";

  return (
    <ul
      className={cn(
        // Wider gap than a chip row needs, since plain labels would otherwise
        // read as one run-on string.
        "flex flex-wrap gap-x-3 gap-y-1",
        placement === "overlay" && "absolute left-3 top-3 z-10 max-w-[70%]",
        placement === "inline" && "relative",
      )}
      aria-label={language === "bn" ? "প্রোডাক্ট ব্যাজ" : "Product badges"}
    >
      {visible.map((badge) => (
        <li key={badge.id} className="min-w-0">
          <DynamicBadge
            label={localize(badge.label, language)}
            icon={badge.icon}
            iconFilled={badge.id === "featured"}
            variant={badge.tone}
            surface={surface}
            size="sm"
          />
        </li>
      ))}
    </ul>
  );
}

export default ProductCardBadges;
