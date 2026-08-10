/**
 * InfoRow — label-value pair row used in detail cards.
 *
 * Usage:
 *   <InfoRow label="ফোন" value={order.phone} />
 *   <InfoRow label="স্ট্যাটাস" value="নিবন্ধিত" />
 */
export default function InfoRow({ label, value, className = "" }) {
  if (!value) return null;
  return (
    <div
      className={`flex justify-between items-start gap-3 py-1.5 ${className}`}
    >
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-[#0f172a] text-right">
        {value}
      </span>
    </div>
  );
}
