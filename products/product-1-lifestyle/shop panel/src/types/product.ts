export interface ProductColor {
  name: string;
  value: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  image: string;
  images: string[];
  category: string;
  description: string;
  details: string[];
  sizes: string[];
  colors: ProductColor[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export interface SaleProduct extends Product {
  salePrice: number;
  originalPrice: number;
  discount: number;
}
