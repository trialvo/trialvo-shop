import React from "react";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

type Props = {
 icon?: React.ReactNode;
 title?: string;
 message?: string;
 action?: React.ReactNode;
 className?: string;
};

/**
 * Centered empty-state with icon + message.
 *
 * ```tsx
 * <EmptyState
 *   title="No categories found"
 *   message="Try adjusting your filters"
 *   action={<Button onClick={openCreate}>Add Category</Button>}
 * />
 * ```
 */
export default function EmptyState({ icon, title, message, action, className }: Props) {
 return (
  <div
   className={cn(
    "flex flex-col items-center justify-center gap-3 py-12 text-center",
    className,
   )}
  >
   <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
    {icon ?? <PackageOpen size={22} />}
   </span>
   {title && (
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
   )}
   {message && (
    <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">{message}</p>
   )}
   {action && <div className="mt-1">{action}</div>}
  </div>
 );
}
