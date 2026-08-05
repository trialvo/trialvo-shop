import { IMAGE_URL } from "@/config/env";
import type {
  OrderCoupon,
  OrderCourier,
  OrderListItem,
  OrderPayment,
  OrderStatus as ApiOrderStatus,
  OrderType as ApiOrderType,
  PaymentStatus,
  PaymentType,
} from "@/lib/api/order/service";
import type { OrderStatus, OrderType } from "@/types";

export type OrderDisplayItem = {
  id: string;
  productId: string;
  productVariationId: number;
  title: string;
  image: string;
  slug: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
};

export type OrderDisplayTotals = {
  subtotal: number;
  discount: number;
  delivery: number;
  paid: number;
  due: number;
  grandTotal: number;
};

export type OrderDisplay = {
  id: string;
  items: OrderDisplayItem[];
  total: number;
  status: OrderStatus;
  rawStatus: ApiOrderStatus;
  date: string;
  shippingAddress: string;
  city: string;
  zip: string;
  orderType: OrderType;
  apiOrderType: ApiOrderType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  latestPayment: OrderPayment | null;
  courier: OrderCourier | null;
  coupons: OrderCoupon[];
  totals: OrderDisplayTotals;
};

export function toOrderDisplay(order: OrderListItem): OrderDisplay {
  const items = asArray(order.items).map((item) => ({
    id: String(item.id),
    productId: String(item.product_id),
    productVariationId: item.product_sku_id,
    title: item.product_name,
    image: toImageUrl(item.product_image),
    slug: item.product_slug,
    sku: item.sku,
    size: item.attribute_name ?? item.variant_name ?? "One Size",
    color: item.color_name ?? "Default",
    quantity: item.quantity,
    unitPrice: item.final_unit_price,
    originalPrice: item.selling_price,
    lineTotal: item.line_total,
  }));

  const payments = asArray(order.payments);
  const couriers = asArray(order.couriers);
  const latestPayment = [...payments].sort((a, b) => b.id - a.id)[0] ?? null;
  const courier = [...couriers].sort((a, b) => b.id - a.id)[0] ?? null;

  return {
    id: String(order.id),
    items,
    total: toNumber(order.grand_total),
    status: toOrderStatus(order.order_status),
    rawStatus: order.order_status,
    date: order.placed_at ?? order.created_at,
    shippingAddress: order.address?.full_address ?? "",
    city: order.address?.city ?? "",
    zip: order.address?.zip_code ?? "",
    orderType: toOrderType(order.order_type),
    apiOrderType: order.order_type,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    paymentType: order.payment_type,
    paymentStatus: order.payment_status,
    paymentLabel: toPaymentLabel(order.payment_type, latestPayment),
    latestPayment,
    courier,
    coupons: asArray(order.coupons),
    totals: {
      subtotal: toNumber(order.subtotal),
      discount: toNumber(order.discount_total),
      delivery: toNumber(order.delivery_charge),
      paid: toNumber(order.paid_amount),
      due: toNumber(order.due_amount),
      grandTotal: toNumber(order.grand_total),
    },
  };
}

export function toOrderStatus(status: ApiOrderStatus): OrderStatus {
  if (status === "shipped" || status === "out_for_delivery") return "shipped";
  if (status === "delivered") return "delivered";
  if (status === "cancelled" || status === "returned" || status === "trash") {
    return "cancelled";
  }
  return "processing";
}

function toOrderType(orderType: ApiOrderType): OrderType {
  if (orderType === "guest" || orderType === "admin_stranger") return "guest";
  return "standard";
}

function toPaymentLabel(paymentType: PaymentType, payment: OrderPayment | null): string {
  if (paymentType === "cod") return "Cash on Delivery";
  if (paymentType === "mixed") return "Partial Payment";
  return payment?.provider ? formatLabel(payment.provider) : "Online Payment";
}

function formatLabel(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toImageUrl(value: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${IMAGE_URL.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asArray<T>(value: T[]): T[] {
  return Array.isArray(value) ? value : [];
}
