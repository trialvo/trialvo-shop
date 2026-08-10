import FormField from "./FormField";

/**
 * Input — a labeled text/number/email/password input.
 *
 * Usage:
 *   <Input label="নাম" value={...} onChange={...} required />
 */
export default function Input({
  label,
  required,
  hint,
  error,
  className = "",
  wrapperClassName = "",
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
      <input
        className={`input ${error ? "border-red-300 focus:ring-red-200" : ""} ${className}`}
        {...props}
      />
    </FormField>
  );
}
