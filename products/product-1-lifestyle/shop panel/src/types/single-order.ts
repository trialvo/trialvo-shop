// src/types/single-order.ts — Type definitions for Single Order Page feature

// ── Product Types ────────────────────────────────────────────────────────────

export type SOPColorOption = {
  id: number;
  name: string;
  name_bd?: string;
  hex?: string;
};

export type SOPVariantOption = {
  id: number;
  name: string;
  name_bd?: string;
  attribute_name?: string;
  attribute_name_bd?: string;
};

export type SOPVariation = {
  id: number;
  color: { id: number; name: string; name_bd?: string; hex?: string } | null;
  variant: {
    id: number;
    name: string;
    name_bd?: string;
    attribute?: { name: string; name_bd?: string } | null;
  } | null;
  selling_price: number;
  discount: number;
  discount_type: number;
  final_price: number;
  stock: number;
  sku: string;
  weight_kg: number;
  free_delivery: boolean;
  in_stock: boolean;
};

export type SOPBulkOffer = {
  id: number;
  product_sku_id: number;
  sku: string;
  min_qty: number;
  discount_type: number;
  discount_value: number;
  free_delivery: boolean;
  sku_selling_price: number;
};

export type SOPProductImage = {
  id: number;
  path: string;
  serial?: number;
  sku_color_id?: number | null;
  sku_variant_id?: number | null;
};

export type SOPProduct = {
  id: number;
  name: string;
  name_bd?: string;
  slug: string;
  short_description?: string;
  long_description?: string;
  free_delivery: boolean;
  sell_count: number;
  avg_rating: number;
  review_count: number;
  images: SOPProductImage[];
  variations: SOPVariation[];
  available_colors: SOPColorOption[];
  available_variants: SOPVariantOption[];
  bulk_offers: SOPBulkOffer[];
  brand?: { id: number; name: string; image?: string } | null;
};

// ── Cart Types ───────────────────────────────────────────────────────────────

export type SOPMiniCartItem = {
  skuId: number;
  colorName: string;
  variantName: string;
  qty: number;
  unitPrice: number;
  sellingPrice: number;
  weightKg: number;
  sku: string;
  colorId: number | null;
  variantId: number | null;
  freeDelivery: boolean;
};

export type SOPMiniCart = {
  productId: number;
  productName: string;
  productImage: string;
  productFreeDelivery: boolean;
  bulkOffers: SOPBulkOffer[];
  items: SOPMiniCartItem[];
};

// ── Checkout Types ───────────────────────────────────────────────────────────

export type SOPAddressType = "home" | "office" | "na";

export type SOPCheckoutStep = "form" | "phone_otp" | "email_otp" | "placing";

export type SOPOrderPermissions = {
  emailRequired: boolean;
  phoneVerifyRequired: boolean;
  emailVerifyRequired: boolean;
};

export type SOPCheckoutFormData = {
  addressType: SOPAddressType;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  areaName: string;
  locationMappingId: number | null;
  note: string;
  paymentProvider: string;
  deliveryChargeId: string;
};

export type SOPPlaceOrderPayload = {
  session_id: string;
  product_id: number;
  items: Array<{ product_sku_id: number; quantity: number }>;
  name: string;
  phone: string;
  email?: string;
  address_type: SOPAddressType;
  full_address: string;
  city: string;
  location_mapping_id?: number;
  delivery_charge_id: number;
  note?: string;
  payment_type: "cod" | "gateway";
  capi_event_id?: string;
  fbp?: string;
  fbc?: string;
};

// ── API Response Types ───────────────────────────────────────────────────────

export type SOPBaseResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type SOPProductResponse = SOPBaseResponse & {
  product?: SOPProduct;
};

export type SOPPermissionsResponse = SOPBaseResponse & {
  email_required?: boolean;
  phone_verification_required?: boolean;
  email_verification_required?: boolean;
};

export type SOPSessionResponse = SOPBaseResponse & {
  session_id?: string;
};

export type SOPOtpResponse = SOPBaseResponse & {
  session_id?: string;
};

export type SOPVerifyResponse = SOPBaseResponse;

export type SOPPlaceOrderResponse = SOPBaseResponse & {
  order_id?: number;
  payment?: {
    type?: string;
    needs_initiation?: boolean;
    url?: string | null;
  };
};

export type SOPPaymentResponse = SOPBaseResponse & {
  url?: string;
};

// ── Product Metadata (for SEO) ───────────────────────────────────────────────

export type SOPProductMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  keywords?: string;
  robots?: string;
  ogImage?: string;
};
