import { Package } from "lucide-react";

/**
 * EmptyState — displayed when a list has no items.
 *
 * Usage:
 *   <EmptyState icon={Package} message="কোনো পণ্য পাওয়া যায়নি" action={<button>...</button>} />
 */
export default function EmptyState({
  icon: Icon = Package,
  message = "কোনো তথ্য পাওয়া যায়নি",
  hint,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-slate-400 ${className}`}
    >
      <Icon className="h-12 w-12 mb-3 text-slate-200" />
      <p className="text-sm font-medium">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-300">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
