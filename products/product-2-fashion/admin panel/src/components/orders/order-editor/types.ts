// src/components/orders/order-editor/types.ts

export type OrderStatus =
  | "new"
  | "approved"
  | "processing"
  | "packaging"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "on_hold"
  | "trash";

export type PaymentStatus = "paid" | "unpaid" | "partial_paid";

export type DeliveryType = "inside_dhaka" | "out_of_dhaka";

export type PaymentMethod = "gateway" | "cod" | "mixed";

export interface OrderProductLine {
  id: string;
  sku: string;
  serialNo: string;
  name: string;
  imageUrl?: string;
  color: string;
  size: string;
  discount: number;
  unitPrice: number;
  quantity: number;
  weight_kg?: number;

  // API reference IDs for dynamic color/size selection
  productId?: number;
  productSkuId?: number;
  colorId?: number | null;
  variantId?: number | null;
  attributeId?: number | null;
  colorHex?: string | null;
}

export interface OrderEditorData {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerIp?: string;

  billingName: string;
  email: string;

  shippingAddress: string;
  city: string;
  area_name: string;
  location_mapping_id: number | null;
  postalCode: string;

  phone: string;

  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  note: string;

  products: OrderProductLine[];

  deliveryCharge: number;
  specialDiscount: number;
  advancePayment: number;
  weightKgTotal: number;
  weightExtraCharge: number;
  bulkDiscountTotal: number;
  comboDiscountTotal: number;
  cartWideDiscount: number;
  couponDiscount: number;

  courier: {
    method: string;
    consignmentId: string;
    trackingUrl?: string;
    lastUpdatedAt?: string;
  };

  customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };

  customerHistory: {
    orderId: string;
    shipping: string;
    orderDate: string;
    totalAmount: number;
    timeAgo: string;
    orderStatus: OrderStatus;
    sentBy: "manually" | "auto";
    additionalNotes: string;
  };
}
