import FormField from "./FormField";

/**
 * Select — a labeled <select> dropdown.
 *
 * Usage:
 *   <Select label="ক্যাটাগরি" value={...} onChange={...} required>
 *     <option value="">বেছে নিন</option>
 *     <option value="1">ক্যাটাগরি ১</option>
 *   </Select>
 */
export default function Select({
  label,
  required,
  hint,
  error,
  className = "",
  wrapperClassName = "",
  children,
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
      <select
        className={`input ${error ? "border-red-300" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}
