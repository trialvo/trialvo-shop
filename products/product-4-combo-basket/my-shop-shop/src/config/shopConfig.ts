// Default shop configuration
// Admin can override these via the Admin Panel (/admin)

export type OrderMode = "single" | "combo" | "combo-bundle";

export interface ModeConfig {
  /** Enables or disables the dynamic pricing and delivery features for this mode */
  isActive: boolean;
  /** The value of the discount */
  discountAmount: number;
  /** The type of discount: either a percentage or a flat amount */
  discountType: "percent" | "flat";
  /** Minimum subtotal required for the discount to apply */
  minAmountForDiscount: number;
  /**
   * Dynamic Delivery Configuration
   * Maps delivery zone ID to its configuration for this mode
   */
  deliveryConfig?: Record<
    string,
    {
      enabled: boolean;
    }
  >;
}

export interface DeliveryZone {
  id: number;
  name: string;
  charge: number;
  days?: string;
  enabled: boolean;
}

export interface ShopConfig {
  combo: ModeConfig;
  single: ModeConfig;
  "combo-bundle": ModeConfig;
  delivery_zones: DeliveryZone[];
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  combo: {
    isActive: true,
    discountAmount: 15,
    discountType: "percent",
    minAmountForDiscount: 0,
    deliveryConfig: {},
  },
  single: {
    isActive: true,
    discountAmount: 0,
    discountType: "percent",
    minAmountForDiscount: 0,
    deliveryConfig: {},
  },
  "combo-bundle": {
    isActive: true,
    discountAmount: 10,
    discountType: "percent",
    minAmountForDiscount: 0,
    deliveryConfig: {},
  },
  delivery_zones: [],
};

/** Compute pure subtotal discount pricing - delivery is calculated dynamically in checkout */
export function computePricing(subtotal: number, cfg: ModeConfig) {
  let discountAmount = 0;

  // If the rules are entirely disabled, apply no discount
  if (!cfg.isActive) {
    return {
      subtotal,
      discountAmount: 0,
      discountedSubtotal: subtotal,
      totalBase: subtotal,
    };
  }

  const rulesAmt = Number(cfg.discountAmount) || 0;
  const minRequired = Number(cfg.minAmountForDiscount) || 0;

  if (subtotal >= minRequired) {
    if (cfg.discountType === "percent") {
      discountAmount = Math.round((subtotal * rulesAmt) / 100);
    } else {
      discountAmount = rulesAmt;
    }
  }

  const discountedSubtotal = subtotal - discountAmount;
  // Delivery will be evaluated inside Checkout now based on selected zone
  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    totalBase: discountedSubtotal,
  };
}
