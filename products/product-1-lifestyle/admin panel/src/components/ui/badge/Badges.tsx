import { cn } from "@/lib/utils";

type StatusBadgeProps = {
 active: boolean;
 activeLabel?: string;
 inactiveLabel?: string;
 className?: string;
};

/**
 * Active / Inactive dot badge.
 *
 * ```tsx
 * <StatusBadge active={product.status} />
 * <StatusBadge active={user.enabled} activeLabel="Enabled" inactiveLabel="Disabled" />
 * ```
 */
export function StatusBadge({
 active,
 activeLabel = "Active",
 inactiveLabel = "Inactive",
 className,
}: StatusBadgeProps) {
 return active ? (
  <span
   className={cn(
    "inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700",
    "ring-1 ring-inset ring-green-200/60",
    "dark:bg-green-500/10 dark:text-green-400 dark:ring-green-700/40",
    className,
   )}
  >
   <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
   {activeLabel}
  </span>
 ) : (
  <span
   className={cn(
    "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500",
    "ring-1 ring-inset ring-gray-200/60",
    "dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700/40",
    className,
   )}
  >
   <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
   {inactiveLabel}
  </span>
 );
}

export type Priority = 1 | 2 | 3 | number;

const PRIORITY_MAP: Record<number, { label: string; cls: string }> = {
 1: {
  label: "Low",
  cls: "bg-gray-100 text-gray-500 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700/40",
 },
 2: {
  label: "Normal",
  cls: "bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-700/40",
 },
 3: {
  label: "High",
  cls: "bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-700/40",
 },
};

type PriorityBadgeProps = {
 priority: Priority;
 className?: string;
};

/**
 * Priority badge (Low / Normal / High).
 *
 * ```tsx
 * <PriorityBadge priority={category.priority} />
 * ```
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
 const p = Math.min(Math.max(Math.round(priority), 1), 3);
 const cfg = PRIORITY_MAP[p] ?? PRIORITY_MAP[1];
 return (
  <span
   className={cn(
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
    cfg.cls,
    className,
   )}
  >
   {cfg.label}
  </span>
 );
}

type FeaturedBadgeProps = {
 featured: boolean;
 className?: string;
};

/**
 * Featured / Not Featured badge.
 */
export function FeaturedBadge({ featured, className }: FeaturedBadgeProps) {
 return featured ? (
  <span
   className={cn(
    "inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700",
    "ring-1 ring-inset ring-brand-200/60",
    "dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-700/40",
    className,
   )}
  >
   ★ Yes
  </span>
 ) : (
  <span
   className={cn(
    "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400",
    "ring-1 ring-inset ring-gray-200/60",
    "dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700/40",
    className,
   )}
  >
   No
  </span>
 );
}
