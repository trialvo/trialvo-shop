import { ArrowRight, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single right-arrow icon for the whole shop — use this for every
 * "view all / continue / next" affordance instead of →, ArrowUpRight, etc.
 */
export function RightArrowIcon({ className, ...props }: LucideProps) {
  return (
    <ArrowRight
      aria-hidden
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    />
  );
}

export default RightArrowIcon;
