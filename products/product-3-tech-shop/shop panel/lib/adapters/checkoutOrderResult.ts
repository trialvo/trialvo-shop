import type { OrderDetail, OrderItem } from "@/lib/api/order/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";

export type CheckoutResultLineItem = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
  originalPrice?: number;
};

export type CheckoutDeliveryAddress = {
  name: string;
  address: string;
  mobile: string;
  email: string;
};

export type CheckoutResultMeta = {
  date: string;
  orderId: string;
  paymentMethod: string;
};

export type CheckoutResultTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  couponDiscount: number;
  total: number;
};

/**
 * Shared view-model for success / failed result pages
 * (mirrors gcp_graduatefashion_shop OrderSuccessData / OrderFailedData).
 */
export type CheckoutResultViewModel = {
  numericOrderId: number;
  orderId: string;
  confirmationEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: CheckoutDeliveryAddress;
  /** Flat address string for compact displays */
  deliveryAddressText: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  meta: CheckoutResultMeta;
  items: CheckoutResultLineItem[];
  totals: CheckoutResultTotals;
  /** @deprecated use totals — kept for existing summary helpers */
  subtotal: number;
  shipping: number;
  discount: number;
  couponDiscount: number;
  total: number;
  trackOrderHref: string;
  continueShoppingHref: string;
  supportEmail: string;
};

export type NormalizedPaymentCallbackStatus =
  | "success"
  | "failed"
  | "cancel"
  | "unknown";

export function normalizePaymentCallbackStatus(
  raw: string | null | undefined,
): NormalizedPaymentCallbackStatus {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (["success", "valid", "paid", "completed"].includes(v)) return "success";
  if (["failed", "fail", "invalid", "unpaid", "error"].includes(v)) {
    return "failed";
  }
  if (["cancel", "canceled", "cancelled"].includes(v)) return "cancel";
  return "unknown";
}

export function parseCheckoutOrderId(
  raw: string | null | undefined,
): number | null {
  if (!raw) return null;
  const digits = sanitizeAuthText(raw, 40).replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function paymentMethodLabel(type: string | undefined): string {
  switch (type) {
    case "cod":
      return "Cash on Delivery";
    case "gateway":
      return "Online Payment";
    case "mixed":
      return "Mixed Payment";
    default:
      return sanitizeAuthText(type ?? "Payment", 40);
  }
}

function mapItem(item: OrderItem): CheckoutResultLineItem {
  const unit = item.final_unit_price || item.selling_price || 0;
  const original = item.selling_price || 0;
  return {
    id: String(item.id),
    title: sanitizeAuthText(item.product_name || "Product", 120),
    image: resolveMediaUrl(item.product_image),
    quantity: item.quantity || 0,
    price: unit,
    originalPrice: original > unit ? original : undefined,
  };
}

const SUPPORT_EMAIL = "support@shoplinkbd.com";

export function toCheckoutResultViewModel(
  order: OrderDetail,
  fallbackOrderId?: string,
): CheckoutResultViewModel {
  const core = order.order;
  const totals = order.totals;
  const orderId = String(core?.id ?? fallbackOrderId ?? "");
  const numericOrderId =
    typeof core?.id === "number" && core.id > 0
      ? core.id
      : parseCheckoutOrderId(orderId) ?? 0;

  const customerEmail = sanitizeEmail(core?.customer_email || "");
  const customerName = sanitizeAuthText(core?.customer_name || "Customer", 80);
  const customerPhone = sanitizeAuthText(core?.customer_phone || "", 20);
  const addressText = sanitizeAuthText(
    core?.address?.full_address || "Address not provided",
    300,
  );
  const paymentMethod = paymentMethodLabel(core?.payment_type);
  const orderDate = core?.created_at
    ? new Date(core.created_at).toLocaleDateString("en-GB")
    : "N/A";

  const subtotal = totals?.subtotal || 0;
  const shipping = totals?.delivery_charge || 0;
  const discount = totals?.sku_discount_total ?? totals?.discount_total ?? 0;
  const couponDiscount = totals?.coupon_discount ?? 0;
  const total = totals?.grand_total || 0;

  return {
    numericOrderId,
    orderId,
    confirmationEmail: customerEmail,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress: {
      name: customerName,
      address: addressText,
      mobile: customerPhone || "N/A",
      email: customerEmail || "N/A",
    },
    deliveryAddressText: addressText,
    paymentMethod,
    paymentStatus: sanitizeAuthText(core?.payment_status || "", 20),
    orderDate,
    meta: {
      date: orderDate,
      orderId,
      paymentMethod,
    },
    items: Array.isArray(order.items) ? order.items.map(mapItem) : [],
    totals: {
      subtotal,
      delivery: shipping,
      discount,
      couponDiscount,
      total,
    },
    subtotal,
    shipping,
    discount,
    couponDiscount,
    total,
    trackOrderHref: "/order-tracking",
    continueShoppingHref: "/shop",
    supportEmail: SUPPORT_EMAIL,
  };
}
