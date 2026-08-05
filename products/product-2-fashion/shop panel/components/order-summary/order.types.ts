export type OrderItem = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  oldPrice?: number;
};

export type OrderTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  coupon?: number;
  couponDiscount?: number;
  weightKg?: number;
  weightSurcharge?: number;
  bulkDiscount?: number;
  comboDiscount?: number;
  cartWideDiscount?: number;
  total: number;
};

export type DeliveryAddress = {
  name: string;
  address: string;
  mobile: string;
  email: string;
};

export type OrderMeta = {
  date: string;
  orderId: string;
  paymentMethod: string;
};

export type OrderSuccessData = {
  confirmationEmail: string;
  deliveryAddress: DeliveryAddress;
  meta: OrderMeta;
  items: OrderItem[];
  totals: OrderTotals;
  trackOrderHref: string;
  continueShoppingHref: string;
};
