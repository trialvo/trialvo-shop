import type { PaymentType } from "@/lib/api/order/service";

export const GATEWAY_PAYMENT_PROVIDERS = [
  "sslcommerz",
  "bkash",
  "nagad",
  "shurjopay",
  "rocket",
] as const;

export type GatewayPaymentProvider = typeof GATEWAY_PAYMENT_PROVIDERS[number];
export type CheckoutPaymentType = Extract<PaymentType, "cod" | "gateway">;

export function isGatewayPaymentProvider(
  value: unknown,
): value is GatewayPaymentProvider {
  return typeof value === "string" &&
    GATEWAY_PAYMENT_PROVIDERS.includes(value as GatewayPaymentProvider);
}
