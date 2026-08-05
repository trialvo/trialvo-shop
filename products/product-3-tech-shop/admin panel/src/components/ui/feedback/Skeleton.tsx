import { cn } from "@/lib/utils";

type SkeletonProps = {
 className?: string;
};

/**
 * Animated pulse skeleton block.
 *
 * ```tsx
 * <Skeleton className="h-10 w-full rounded-xl" />
 * ```
 */
export function Skeleton({ className }: SkeletonProps) {
 return (
  <div
   className={cn(
    "animate-pulse rounded-lg bg-gray-100 dark:bg-white/10",
    className,
   )}
  />
 );
}

type SkeletonRowProps = {
 cols: number;
 rows?: number;
};

/**
 * Pre-built table skeleton rows.
 *
 * ```tsx
 * <SkeletonRows cols={6} rows={5} />
 * ```
 */
export function SkeletonRows({ cols, rows = 5 }: SkeletonRowProps) {
 return (
  <>
   {Array.from({ length: rows }).map((_, ri) => (
    <tr key={ri} className="border-b border-gray-100 dark:border-gray-800">
     {Array.from({ length: cols }).map((_, ci) => (
      <td key={ci} className="p-3">
       <Skeleton className="h-4 w-full" />
      </td>
     ))}
    </tr>
   ))}
  </>
 );
}
