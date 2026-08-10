import FormField from "./FormField";

/**
 * Textarea — a labeled resizable textarea.
 *
 * Usage:
 *   <Textarea label="বিবরণ" rows={4} value={...} onChange={...} />
 */
export default function Textarea({
  label,
  required,
  hint,
  error,
  className = "",
  wrapperClassName = "",
  rows = 4,
  ...props
}) {
  return (
    <FormField
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        rows={rows}
        className={`input resize-none ${error ? "border-red-300" : ""} ${className}`}
        {...props}
      />
    </FormField>
  );
}
