import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Numeric rating out of 5 */
  rating: number;
  /** Optional review count shown after stars */
  count?: number;
  /** Icon size in px (default 14) */
  size?: number;
  className?: string;
}

/**
 * Five-star rating row. Filled stars are determined by Math.floor(rating).
 */
export function StarRating({ rating, count, size = 14, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            className={s <= Math.floor(rating) ? "fill-accent text-accent" : "text-border"}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          {rating} ({count})
        </span>
      )}
    </div>
  );
}
