import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  oldPrice?: number | null;
  /** Controls font sizes: sm = compact cards, md = default, lg = detail page */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { price: "text-sm font-semibold", old: "text-xs", badge: "text-[10px]" },
  md: { price: "text-lg font-semibold", old: "text-sm", badge: "text-xs" },
  lg: { price: "text-2xl font-semibold", old: "text-lg", badge: "text-xs" },
};

/**
 * Price display: current price + optional strikethrough old price + optional "Save $N" badge.
 */
export function PriceDisplay({ price, oldPrice, size = "md", className }: PriceDisplayProps) {
  const cls = sizeMap[size];
  const saving = oldPrice ? oldPrice - price : 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className={cn("font-display text-foreground", cls.price)}>${price}</span>
      {oldPrice && (
        <span className={cn("text-muted-foreground line-through", cls.old)}>${oldPrice}</span>
      )}
      {saving > 0 && (
        <span className={cn("bg-destructive/10 text-destructive px-2 py-0.5 rounded font-medium", cls.badge)}>
          Save ${saving}
        </span>
      )}
    </div>
  );
}
