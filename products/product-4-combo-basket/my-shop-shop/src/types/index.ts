export interface Product {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  price: number; // MRP (আসল দাম)
  originalPrice?: number; // MRP alias used in cart/checkout for strikethrough
  discountPrice?: number | null; // sell price (price − discountAmount)
  discountAmount?: number; // flat ৳ discount
  description: string;
  shortDescription: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty: number;
  tags: string[];
  features?: string[];
  specifications?: Record<string, string>;
  colors?: string[];
  isComboEligible: boolean;
  isFeatured: boolean;
  videoUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
}
