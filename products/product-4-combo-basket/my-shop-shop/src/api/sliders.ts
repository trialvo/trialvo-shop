import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────

export interface ApiSliderProduct {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number; // MRP
  discount_amount?: number; // flat BDT discount
  sell_price?: number; // price - discount_amount (virtual)
  original_price?: number; // legacy
  rating: number;
  review_count: number;
}

export interface ApiSlider {
  id: number;
  title: string;
  subtitle: string;
  highlight: string;
  description: string;
  badge: string;
  badge_color: string;
  banner_image: string;
  accent_from: string;
  accent_to: string;
  bg_from: string;
  bg_via: string;
  bg_to: string;
  price: string;
  original_price: string;
  discount: string;
  link: string;
  cta_text: string;
  cta_secondary: string;
  button_style: "gradient" | "solid" | "outline";
  product_id: number | null;
  product: ApiSliderProduct | null;
  sort_order: number;
  is_active: boolean;
  category: string;
  free_delivery: boolean;
  authentic: boolean;
}

export interface SliderListResponse {
  success: boolean;
  sliders: ApiSlider[];
}

// ─── Hook ─────────────────────────────────────────────────

export function useSliders() {
  return useQuery<SliderListResponse>({
    queryKey: ["sliders"],
    queryFn: async () => {
      const { data } = await apiClient.get("/sliders");
      return data;
    },
    staleTime: 60_000,
  });
}

// ─── Map API slider → HeroBanner slide shape ──────────────

function sanitizePrice(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/^[\?৳BDT\s]+/, "").trim();
  return digits ? `BDT ${digits}` : "";
}

export function toSlide(s: ApiSlider) {
  const product = s.product;
  const displayImage =
    s.banner_image ||
    (product?.image ??
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80");

  // Resolve product pricing using the new model:
  //   price = MRP, discount_amount = flat discount, sell_price = final price
  let productFinalPrice: number | null = null;
  let productMrp: number | null = null;
  let productDiscountPct = 0;
  if (product) {
    const mrp = Number(product.price || 0);
    const discountAmt = Number(product.discount_amount || 0);
    const sellPrice =
      product.sell_price !== undefined
        ? Number(product.sell_price)
        : discountAmt > 0
          ? Math.max(0, mrp - discountAmt)
          : mrp;

    productFinalPrice = sellPrice;
    productMrp = discountAmt > 0 ? mrp : null;
    productDiscountPct =
      discountAmt > 0 && mrp > 0 ? Math.round((discountAmt / mrp) * 100) : 0;
  }

  const displayPrice =
    sanitizePrice(s.price) ||
    (productFinalPrice !== null
      ? `BDT ${productFinalPrice.toLocaleString()}`
      : "");

  const displayOriginalPrice =
    sanitizePrice(s.original_price) ||
    (productMrp !== null ? `BDT ${productMrp.toLocaleString()}` : "");

  // Use slider's manual discount text; fallback to auto-computed % from product
  const displayDiscount =
    s.discount || (productDiscountPct > 0 ? `${productDiscountPct}% OFF` : "");

  const displayLink =
    s.link || (product ? `/products/${product.slug}` : "/products");
  const displayRating = product?.rating ?? 4.5;
  const displayReviews = product?.review_count ?? 0;

  return {
    id: s.id,
    badge: s.badge || "FEATURED",
    badgeColor: s.badge_color || "from-pink-500 to-rose-600",
    title: s.title,
    subtitle: s.subtitle || "",
    highlight: s.highlight,
    description: s.description,
    price: displayPrice,
    originalPrice: displayOriginalPrice,
    discount: displayDiscount,
    rating: displayRating,
    reviews: displayReviews,
    category: s.category || "",
    image: displayImage,
    freeDelivery: s.free_delivery,
    authentic: s.authentic,
    accentFrom: s.accent_from || "#e91e63",
    accentTo: s.accent_to || "#ff4081",
    bgFrom: s.bg_from || "#0f172a",
    bgVia: s.bg_via || "#1a1035",
    bgTo: s.bg_to || "#1e0a2e",
    link: displayLink,
    ctaText: s.cta_text || "এখনই কিনুন",
    ctaSecondary: s.cta_secondary || "সব পণ্য দেখুন",
    buttonStyle: s.button_style || "gradient",
  };
}
