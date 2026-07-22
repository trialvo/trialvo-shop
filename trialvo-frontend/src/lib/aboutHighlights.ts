import type { Product } from "@/data/products";
import { localize } from "@/lib/localize";
import type {
  AboutHighlightItem,
  AboutHighlightViewModel,
} from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

/**
 * Map highlight definitions to display values.
 * Product count comes from the live products API when available.
 */
export function toAboutHighlightViewModels(
  highlights: AboutHighlightItem[],
  language: MarketplaceLanguage,
  products: Product[] | undefined,
): AboutHighlightViewModel[] {
  const productCount = products?.length;

  return highlights.map((item) => {
    let value = item.fallbackValue;

    if (item.id === "products" && typeof productCount === "number") {
      value = String(productCount);
    } else if (item.id === "trial") {
      value = language === "bn" ? "উপলব্ধ" : "Available";
    } else if (item.id === "delivery") {
      value = language === "bn" ? "দ্রুত" : "Fast";
    } else if (item.id === "support") {
      value = language === "bn" ? "সক্রিয়" : "Active";
    }

    return {
      id: item.id,
      icon: item.icon,
      value,
      label: localize(item.label, language),
    };
  });
}
