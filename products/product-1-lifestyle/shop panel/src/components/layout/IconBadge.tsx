import { cn } from "@/lib/utils";

interface IconBadgeProps {
  count: number;
  /** Max count before showing "N+" (default 9) */
  max?: number;
  className?: string;
}

/**
 * Circular count badge for header icon buttons (cart, wishlist).
 * Shows "N+" when count exceeds max.
 */
export function IconBadge({ count, max = 9, className }: IconBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-header-accent",
        "text-[9px] font-medium flex items-center justify-center text-primary-foreground",
        "animate-in zoom-in-50 duration-200",
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
