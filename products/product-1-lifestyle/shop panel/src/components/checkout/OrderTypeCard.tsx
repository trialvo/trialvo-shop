import { cn } from "@/lib/utils";
import type { OrderType } from "@/types";
import type { LucideIcon } from "lucide-react";

interface OrderTypeCardProps {
  type: OrderType;
  icon: LucideIcon;
  label: string;
  desc: string;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Single order type selection card — icon + label + description + selection ring.
 */
export function OrderTypeCard({ icon: Icon, label, desc, isSelected, onSelect }: OrderTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "p-5 border text-left transition-all duration-200 rounded-lg",
        isSelected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border hover:border-accent/30"
      )}
    >
      <Icon
        size={20}
        className={cn("mb-2", isSelected ? "text-accent" : "text-muted-foreground")}
      />
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );
}
