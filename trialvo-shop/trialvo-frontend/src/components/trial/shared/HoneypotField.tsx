"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * Bot trap. Must stay empty. Two things used to go wrong here:
 *
 *  1. Positioning it with `-left-[9999px]` inside a `relative` +
 *     `overflow-y-auto` modal made the field scroll back into view, so
 *     humans (and Chrome autofill) treated it as a real "Website" input.
 *  2. Chrome then dumped the user's email into it. Zod required the field
 *     to be empty, `handleSubmit` failed, and no error was shown — the
 *     Send button looked stuck.
 *
 * `sr-only` clips it out of the layout. Autocomplete is disabled, and the
 * parent form no longer validates this field.
 */
export function HoneypotField({
  registration,
  label,
}: Readonly<{ registration: UseFormRegisterReturn; label: string }>) {
  return (
    <div className="sr-only" aria-hidden="true">
      <label htmlFor={`hp-${registration.name}`}>{label}</label>
      <input
        id={`hp-${registration.name}`}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        {...registration}
      />
    </div>
  );
}

export default HoneypotField;
