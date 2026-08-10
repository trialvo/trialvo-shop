/**
 * Badge — status/label pill.
 *
 * Usage:
 *   <Badge variant="success">সক্রিয়</Badge>
 *   <Badge variant="danger">বাতিল</Badge>
 *   <Badge color="bg-blue-100 text-blue-700">Custom</Badge>
 */
const VARIANTS = {
  success: "bg-emerald-50  text-emerald-700  border-emerald-200",
  danger: "bg-red-50      text-red-600      border-red-200",
  warning: "bg-amber-50    text-amber-700    border-amber-200",
  info: "bg-blue-50     text-blue-700     border-blue-200",
  primary: "bg-pink-50     text-[#e91e63]    border-pink-200",
  neutral: "bg-slate-100   text-slate-600    border-slate-200",
  purple: "bg-violet-50   text-violet-700   border-violet-200",
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
  dot = false,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === "success"
              ? "bg-emerald-500"
              : variant === "danger"
                ? "bg-red-500"
                : variant === "warning"
                  ? "bg-amber-500"
                  : "bg-slate-400"
          }`}
        />
      )}
      {children}
    </span>
  );
}
