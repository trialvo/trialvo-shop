/**
 * FormField — wraps any input/select/textarea with a consistent label and
 * optional hint/error text.
 *
 * Usage:
 *   <FormField label="পণ্যের নাম" required hint="URL-safe নাম">
 *     <input className="input" ... />
 *   </FormField>
 */
export default function FormField({
  label,
  required = false,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-[#e91e63]"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}
    </div>
  );
}
