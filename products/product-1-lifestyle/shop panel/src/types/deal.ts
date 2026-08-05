export interface DealProductSummary {
  id: number;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  stock: number;
  price?: number;
  originalPrice?: number;
  productVariationId?: number;
}

export interface BulkOffer {
  id: string;
  productId: number;
  productVariationId?: number;
  minQuantity: number;
  pricePerUnit: number;
  originalPricePerUnit: number;
  discount: number;
  discountLabel?: string;
  freeDelivery: boolean;
  stockAvailable: number;
  product?: DealProductSummary;
}

export interface ComboDealItem {
  productId: number;
  productVariationId?: number;
  size: string;
  color: string;
  quantity: number;
  originalPricePerUnit?: number;
  dealPricePerUnit?: number;
  stockAvailable?: number;
  product?: DealProductSummary;
}

export interface ComboDeal {
  id: string;
  title: string;
  items: ComboDealItem[];
  totalItems: number;
  originalTotal: number;
  dealPrice: number;
  savings: number;
  discountPercent: number;
  freeDelivery: boolean;
  inStock: boolean;
  stockWarning?: string;
}
