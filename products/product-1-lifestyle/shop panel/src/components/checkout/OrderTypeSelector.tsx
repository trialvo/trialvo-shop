import Link from "next/link";
import { Package, Layers, Users } from "lucide-react";
import { OrderTypeCard } from "@/components/checkout/OrderTypeCard";
import type { OrderType } from "@/types";
import type { LucideIcon } from "lucide-react";

interface OrderTypeEntry {
  type: OrderType;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const ALL_ORDER_TYPES: OrderTypeEntry[] = [
  { type: "standard", icon: Package, label: "Standard Order", desc: "Regular checkout for individual items" },
  { type: "guest", icon: Users, label: "Guest Order", desc: "Checkout without an account — order tracked via guest ID" },
  { type: "bulk", icon: Layers, label: "Bulk Order", desc: "Large quantity offers controlled by admin rules" },
  { type: "combo", icon: Package, label: "Combo Order", desc: "Bundle offers controlled by admin rules" },
];

interface OrderTypeSelectorProps {
  orderType: OrderType;
  isAuthenticated: boolean;
  availableOrderTypes?: readonly OrderType[];
  onSelect: (type: OrderType) => void;
}

/**
 * Guest notice banner + grid of OrderTypeCards filtered by auth state.
 */
export function OrderTypeSelector({
  orderType,
  isAuthenticated,
  availableOrderTypes,
  onSelect,
}: OrderTypeSelectorProps) {
  const visible = ALL_ORDER_TYPES.filter((t) => {
    if (availableOrderTypes) return availableOrderTypes.includes(t.type);
    if (isAuthenticated && t.type === "guest") return false;
    if (!isAuthenticated && t.type === "standard") return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
        Choose Order Type
      </h2>

      {!isAuthenticated && (
        <div className="bg-secondary/50 border border-border p-4 rounded text-sm text-muted-foreground">
          You&apos;re checking out as a <strong className="text-foreground">guest</strong>.{" "}
          <Link href="/auth" className="text-accent underline">Sign in</Link> for a faster experience.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((t) => (
          <OrderTypeCard
            key={t.type}
            {...t}
            isSelected={orderType === t.type}
            onSelect={() => onSelect(t.type)}
          />
        ))}
      </div>
    </div>
  );
}
