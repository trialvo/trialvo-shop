/**
 * OrderStatusBadge — consistent badge for order status with dot indicator.
 * Exports ORDER_STATUS_STYLE and ORDER_STATUS_BN for use in status update buttons.
 */
export const ORDER_STATUS_STYLE = {
  pending: "bg-amber-50  text-amber-700  border border-amber-200",
  confirmed: "bg-blue-50   text-blue-700   border border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50    text-red-700    border border-red-200",
};

export const ORDER_STATUS_DOT = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  processing: "bg-indigo-400",
  shipped: "bg-purple-400",
  delivered: "bg-emerald-400",
  cancelled: "bg-red-400",
};

export const ORDER_STATUS_BN = {
  pending: "মুলতুবি",
  confirmed: "নিশ্চিত",
  processing: "প্রক্রিয়াধীন",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
};

export default function OrderStatusBadge({
  status,
  size = "sm",
  className = "",
}) {
  const style = ORDER_STATUS_STYLE[status] || "bg-slate-100 text-slate-600";
  const dot = ORDER_STATUS_DOT[status] || "bg-slate-400";
  const label = ORDER_STATUS_BN[status] || status || "—";
  const sz =
    size === "lg"
      ? "px-3 py-1 text-sm gap-1.5"
      : "px-2.5 py-0.5 text-[11px] gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sz} ${style} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
