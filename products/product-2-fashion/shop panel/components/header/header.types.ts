type Category = {
  id: number;
  name: string;
};

type Brand = {
  id: number;
  name: string;
  image?: string | null;
};

type ProductImage = {
  id: number;
  path: string;
  priority: number;
};

type PriceRange = {
  min: number;
  max: number;
  has_discount: boolean;
};

type StockInfo = {
  total_stock: number;
  in_stock: boolean;
  variation_count: number;
};

type AvailableAttributes = {
  color_ids: number[];
  variant_ids: number[];
  variant_names: string[];
};

type UpdateSuggestion = {
  category_mismatch?: string;
  name_clarity?: string;
  missing_details?: {
    fabric_details?: string;
    care_instructions?: string;
    size_chart?: string;
    color_options?: string;
  };
  image_quality?: string;
  pricing_consistency?: string;
};

export type Product = {
  id: number | string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;

  img_path?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  images?: ProductImage[] | null;
  price_range?: PriceRange | null;

  short_description?: string | null;
  is_favourite?: boolean;
  
  main_category?: Category | null;
  sub_category?: Category | null;
  child_category?: Category | null;
  
  brand?: Brand | null;
  
  featured?: boolean;
  best_deal?: boolean;
  free_delivery?: boolean;
  
  sell_count?: number;
  stock_info?: StockInfo | null;
  
  available_attributes?: AvailableAttributes | null;
  
  update_suggestion?: UpdateSuggestion | null;
};