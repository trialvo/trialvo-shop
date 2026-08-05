// src/components/delivery-settings/types.ts
export type DeliveryChargeType =
  | "outside_of_dhaka"
  | "inside_of_dhaka"
  | "inside_chittagong"
  | "outside_chittagong"
  | "free_delivery"
  | (string & {});

export const DELIVERY_CHARGE_TYPE_LABELS: Record<string, string> = {
  outside_of_dhaka: "Outside Dhaka",
  inside_of_dhaka: "Inside Dhaka",
  inside_chittagong: "Inside Chittagong",
  outside_chittagong: "Outside Chittagong",
  free_delivery: "Free Delivery",
};

export function normalizeDeliveryType(input: unknown): DeliveryChargeType {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "outside_of_dhaka";

  // already snake_case
  if (raw.includes("_")) return raw as DeliveryChargeType;

  // convert spaces -> underscore
  const underscored = raw.replace(/\s+/g, "_");

  // a few safety aliases (if backend sends slightly different)
  const map: Record<string, DeliveryChargeType> = {
    "outside_of_dhaka": "outside_of_dhaka",
    "inside_of_dhaka": "inside_of_dhaka",
    "inside_chittagong": "inside_chittagong",
    "outside_chittagong": "outside_chittagong",
    "free_delivery": "free_delivery",
    "free_delivery_": "free_delivery",
    "free_delivery__": "free_delivery",
    "free_delivery___": "free_delivery",
    "free_delivery____": "free_delivery",
  };

  return (map[underscored] ?? (underscored as DeliveryChargeType)) as DeliveryChargeType;
}

export function deliveryTypeLabel(type: DeliveryChargeType): string {
  return DELIVERY_CHARGE_TYPE_LABELS[String(type)] ?? String(type);
}

export interface DeliveryChargeCard {
  id: number;
  title: string;

  // ✅ UI value is snake_case
  type: DeliveryChargeType;

  customer_charge: number;
  our_charge: number;

  status: boolean;

  img_path: string | null;

  created_at: string;
  updated_at: string;
}
