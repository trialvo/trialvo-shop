/**
 * Cart types matching the SKU-based cart model used by the API.
 * Each cart line is keyed by `productId|size|color`.
 */

export interface CartItem {
  id: string;                       // line key: "productId|size|color"
  productId: string;                // product id as string
  productVariationId?: number;      // the product_sku_id sent to API
  title: string;
  name?: string;
  image: string;
  price: number;                    // final selling price
  discount?: number;                // discount amount (originalPrice - price)
  originalPrice: number;
  size: string;
  color: string;
  quantity: number;
  stock: number;
  weight_kg?: number;
  freeDelivery?: boolean;
  slug?: string;
}

export type CartItemInput = Omit<CartItem, "quantity" | "id"> & {
  id?: string;
  quantity?: number;
  overrideQuantity?: boolean;
};