/**
 * Checkout result page types.
 *
 * Shared between the success, failed, and fallback pages.  They model the
 * view-layer data that is mapped from the raw `OrderDetail` API response.
 */

/* ── Item shown in the order summary ───────────────────────────────────── */

export type CheckoutOrderItem = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  oldPrice?: number;
};

/* ── Totals row ────────────────────────────────────────────────────────── */

export type CheckoutOrderTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  couponDiscount?: number;
  weightKg?: number;
  weightSurcharge?: number;
  bulkDiscount?: number;
  comboDiscount?: number;
  cartWideDiscount?: number;
  total: number;
};

/* ── Delivery address block ────────────────────────────────────────────── */

export type CheckoutDeliveryAddress = {
  name: string;
  address: string;
  mobile: string;
  email: string;
};

/* ── Meta row (date, orderId, paymentMethod) ───────────────────────────── */

export type CheckoutOrderMeta = {
  date: string;
  orderId: string;
  paymentMethod: string;
};

/* ── Success page data ─────────────────────────────────────────────────── */

export type CheckoutSuccessData = {
  orderId: string;
  confirmationEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: CheckoutDeliveryAddress;
  meta: CheckoutOrderMeta;
  items: CheckoutOrderItem[];
  totals: CheckoutOrderTotals;
  trackOrderHref: string;
  continueShoppingHref: string;
};

/* ── Failed page data ──────────────────────────────────────────────────── */

export type CheckoutFailedData = {
  orderId: number;
  title: string;
  message: string;
  supportEmail?: string;
  confirmationEmail: string;
  deliveryAddress: CheckoutDeliveryAddress;
  meta: CheckoutOrderMeta;
  items: CheckoutOrderItem[];
  totals: CheckoutOrderTotals;
  trackOrderHref: string;
  continueShoppingHref: string;
};

/* ── Fallback status normalisation ─────────────────────────────────────── */

export type PaymentFallbackStatus = "success" | "failed" | "cancel" | "unknown";
