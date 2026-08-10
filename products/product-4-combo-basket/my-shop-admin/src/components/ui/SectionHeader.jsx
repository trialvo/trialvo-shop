/**
 * SectionHeader — card sub-section header with icon, title and optional action.
 * Used inside cards to label sections (Customer, Shipping, Payment, etc.)
 *
 * Usage:
 *   <SectionHeader icon={User} title="গ্রাহক" />
 *   <SectionHeader icon={MapPin} title="ডেলিভারি ঠিকানা" action={<button>...</button>} />
 */
export default function SectionHeader({
  icon: Icon,
  title,
  action,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      {Icon && <Icon className="h-4 w-4 text-[#e91e63] shrink-0" />}
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex-1">
        {title}
      </h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
