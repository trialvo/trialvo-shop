import type { ProductListItem } from "@/lib/api/product/service";

/** Lightweight slot stored in localStorage — enough to render the floating bar. */
export type CompareSlot = Pick<
  ProductListItem,
  "id" | "name" | "slug" | "images" | "thumbnail"
> & {
  price_range?: ProductListItem["price_range"];
  variations?: ProductListItem["variations"];
};

export type CompareSlots = [CompareSlot | null, CompareSlot | null];

export type CompareState = {
  slots: CompareSlots;
  /** False until localStorage has been read on the client. */
  isHydrated: boolean;
};

export const COMPARE_MAX_SLOTS = 2 as const;
export const COMPARE_STORAGE_KEY = "tech_shop_compare_slots";
