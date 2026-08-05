/**
 * Backend initiatePayment allows only these gateway providers
 * (see Back End/controllers/order.js + guest_order.js).
 */
export const GATEWAY_PAYMENT_METHODS = [
  "sslcommerz",
  "bkash",
  "nagad",
  "shurjopay",
  "rocket",
] as const;

export type GatewayPaymentMethod = (typeof GATEWAY_PAYMENT_METHODS)[number];

const GATEWAY_SET = new Set<string>(GATEWAY_PAYMENT_METHODS);

/** Aliases that mean “pick the store default online gateway”. */
const ONLINE_ALIASES = new Set([
  "online",
  "gateway",
  "card",
  "cards",
  "online_payment",
  "online-payment",
]);

export function isCodPaymentProvider(provider: string | null | undefined): boolean {
  return String(provider ?? "").trim().toLowerCase() === "cod";
}

export function isGatewayPaymentMethod(
  value: string | null | undefined,
): value is GatewayPaymentMethod {
  return GATEWAY_SET.has(String(value ?? "").trim().toLowerCase());
}

/**
 * Map UI selection → API `payment_method` for initiatePayment.
 * Rejects unknown values instead of sending them to the API.
 */
export function resolveGatewayPaymentMethod(
  selectedProvider: string,
  defaultProvider?: string | null,
): GatewayPaymentMethod {
  const selected = selectedProvider.trim().toLowerCase();

  if (isCodPaymentProvider(selected)) {
    throw new Error("Cash on Delivery does not require online payment initiation.");
  }

  if (isGatewayPaymentMethod(selected)) {
    return selected;
  }

  // Legacy / fallback UI key "online" → use configured default or sslcommerz
  if (ONLINE_ALIASES.has(selected)) {
    const fallback = String(defaultProvider ?? "sslcommerz").trim().toLowerCase();
    if (isGatewayPaymentMethod(fallback)) {
      return fallback;
    }
    return "sslcommerz";
  }

  throw new Error(
    `Invalid payment method "${selectedProvider}". Please choose a valid online payment option.`,
  );
}

export function paymentMethodDisplayLabel(
  provider: string,
  gatewayName?: string | null,
): string {
  const key = provider.trim().toLowerCase();
  if (key === "cod") return "Cash on Delivery";
  const name = (gatewayName ?? "").trim();
  if (name && name.toLowerCase() !== "cod") return name;
  switch (key) {
    case "sslcommerz":
      return "Online Payment";
    case "bkash":
      return "bKash";
    case "nagad":
      return "Nagad";
    case "shurjopay":
      return "ShurjoPay";
    case "rocket":
      return "Rocket";
    default:
      return name || provider;
  }
}
