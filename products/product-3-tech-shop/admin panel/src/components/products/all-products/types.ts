// src/components/products/all-products/types.ts
export type ProductStatus = "active" | "inactive";

export type CategoryPath = {
  category: string;
  subCategory?: string;
  childCategory?: string;
};

export type Product = {
  id: string;
  name: string;
  name_bd?: string | null;
  imageUrl?: string;

  positionNumber: number;
  categoryPath: CategoryPath;

  stockQty: number;
  variantCount: number;

  price: number;
  discount?: number;
  salePrice?: number;

  status: ProductStatus;

  avgRating: number;
  reviewCount: number;

  sku: string;
  slug: string;
  createdAt: string;
  hasSingleProductPage: boolean;
};

export type ProductListFilters = {
  q: string;

  mainCategoryId?: number;
  subCategoryId?: number;
  childCategoryId?: number;
  brandId?: number;

  status?: boolean;
  featured?: boolean;
  bestDeal?: boolean;

  minPrice?: number;
  maxPrice?: number;

  limit: number;
  offset: number;
};
