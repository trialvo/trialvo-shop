import type { ProductListItem } from "@/lib/api/product/service";
import type { CompareSlot } from "@/store/compare/types";

/**
 * Expand a persisted compare slot into a ProductListItem-shaped object
 * for picker UI. Missing list-only fields get safe defaults.
 */
export function slotToProductListItem(slot: CompareSlot): ProductListItem {
  return {
    id: slot.id,
    name: slot.name,
    slug: slot.slug,
    images: slot.images ?? [],
    thumbnail: slot.thumbnail ?? "",
    price_range: slot.price_range ?? {
      min: 0,
      max: 0,
      has_discount: false,
    },
    variations: slot.variations ?? [],
    is_favourite: false,
    status: true,
    featured: false,
    best_deal: false,
    avg_rating: 0,
    review_count: 0,
  };
}
