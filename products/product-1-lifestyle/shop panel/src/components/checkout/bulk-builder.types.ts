export type BulkBuilderColor = {
  name: string;
  value: string;
};

export type BulkBuilderProduct = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  category: string;
  sizes: string[];
  colors: BulkBuilderColor[];
  inStock: boolean;
  productVariationId: number;
  stock: number;
  minQuantity?: number;
  quantityStep?: number;
  discountLabel?: string;
  freeDelivery?: boolean;
};
