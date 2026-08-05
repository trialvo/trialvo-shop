export type SaleSubCategory = {
  id: number;
  name: string;
  img_path: string | null;
  child_categories?: SaleChildCategory[];
};

export type SaleChildCategory = {
  id: number;
  sub_category_id: number;
  name: string;
  img_path: string | null;
};

export type SaleProductImage = {
  id: number;
  path: string;
};

export type SaleProductVariation = {
  id: number;
  sku: string;
  buying_price?: number;
  selling_price?: number;
  discount?: number;
  stock?: number;
  weight_kg?: number;
  // legacy/demo fields (if any)
  name?: string;
};

/**
 * SaleProduct is used by both:
 * - New Sale (API-driven product list)
 * - Some legacy/demo UIs that use seed data
 *
 * So this type is intentionally flexible (optional legacy keys).
 */
export type SaleProduct = {
  id: number | string;

  // API fields
  name?: string;
  slug?: string;
  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  images?: SaleProductImage[];
  variations?: SaleProductVariation[];

  // Legacy/demo fields
  title?: string;
  sku?: string;
  image?: string;
  price?: number;
  category?: string;
  subCategory?: string;
  childCategory?: string;

  variants?: { id: string; name: string }[];
  sizes?: { id: string; name: string }[];
};

export type CartItem = {
  key: string; // unique per productVariation
  productId: number | string;
  /** API required for manual-order endpoints */
  productVariationId?: number;

  title: string;
  sku: string;
  image: string;
  unitPrice: number;      // final price after per-unit discount (used for display)
  originalPrice?: number; // selling_price before discount (for discount calc base)
  discount?: number;      // per-unit SKU discount amount
  freeDelivery?: boolean; // true when the product ships free
  qty: number;
  weight_kg?: number; // variation weight in kg

  // display fields
  colorName?: string;
  variantName?: string;

  // legacy fields (optional)
  variant?: string;
  size?: string;
};

export type CustomerAddress = {
  label: string;
  addressLine: string;
  phone: string;
};

export type Customer = {
  id: number | string;
  name: string;
  phone: string;
  addresses: CustomerAddress[];
};
