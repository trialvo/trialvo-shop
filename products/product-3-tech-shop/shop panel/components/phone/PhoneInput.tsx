"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type Ref,
} from "react";
import type { CountryCode } from "libphonenumber-js";
import { PhoneCountrySelect } from "@/components/phone/PhoneCountrySelect";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone/countries";
import {
  buildPhoneE164,
  formatNationalDisplay,
  getPhonePlaceholder,
  parsePhoneValue,
} from "@/lib/phone/parse";
import { useDetectedCountry } from "@/hooks/useDetectedCountry";
import { cn } from "@/lib/utils";

export type PhoneInputProps = Readonly<{
  value?: string;
  onChange?: (e164: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
  disabled?: boolean;
  required?: boolean;
  /** Skip IP geo — use this country (or BD). */
  defaultCountry?: CountryCode;
  /** Auto-select country from visitor IP / edge headers. Default true. */
  detectCountry?: boolean;
  className?: string;
  inputClassName?: string;
  triggerClassName?: string;
  labelClassName?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
}>;

/**
 * Country picker + national number → E.164.
 * - API number present → fill country + digits
 * - No number → country only (IP/default), empty digit field
 */
export function PhoneInput({
  value = "",
  onChange,
  onBlur,
  name,
  id,
  label,
  hint,
  errorMessage,
  disabled = false,
  required = false,
  defaultCountry,
  detectCountry = true,
  className,
  inputClassName,
  triggerClassName,
  labelClassName,
  placeholder,
  inputRef,
}: PhoneInputProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? name ?? autoId;
  const countrySelectId = `${inputId}-country`;

  const { country: detected, isLoading: detecting } = useDetectedCountry(
    detectCountry && !defaultCountry,
  );

  const resolvedDefault =
    defaultCountry ?? (detectCountry ? detected : DEFAULT_PHONE_COUNTRY);

  const initial = parsePhoneValue(value, resolvedDefault);
  const [country, setCountry] = useState<CountryCode>(
    initial.hasNumber ? initial.country : resolvedDefault,
  );
  const [national, setNational] = useState(
    initial.hasNumber ? initial.national : "",
  );
  const [display, setDisplay] = useState(() =>
    initial.hasNumber
      ? formatNationalDisplay(initial.national, initial.country)
      : "",
  );

  /** User changed country or typed — do not overwrite country via IP. */
  const userLockedCountry = useRef(initial.hasNumber);
  const lastSyncedValue = useRef(value);

  // Controlled value from API / form defaults / saved address
  useEffect(() => {
    if (value === lastSyncedValue.current) return;
    lastSyncedValue.current = value;

    const trimmed = value.trim();
    if (!trimmed) {
      // No API number — clear digits only; country stays (IP / user choice)
      setNational("");
      setDisplay("");
      return;
    }

    const next = parsePhoneValue(trimmed, resolvedDefault);
    if (!next.hasNumber) {
      setNational("");
      setDisplay("");
      return;
    }

    userLockedCountry.current = true;
    setCountry(next.country);
    setNational(next.national);
    setDisplay(formatNationalDisplay(next.national, next.country));
  }, [value, resolvedDefault]);

  // IP country when there is no number from the API
  useEffect(() => {
    if (!detectCountry || defaultCountry) return;
    if (detecting) return;
    if (userLockedCountry.current) return;
    if (value.trim()) return;
    setCountry(detected);
  }, [detectCountry, defaultCountry, detecting, detected, value]);

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    const e164 = buildPhoneE164(nextNational, nextCountry);
    lastSyncedValue.current = e164;
    onChange?.(e164);
  };

  const handleCountryChange = (next: CountryCode) => {
    userLockedCountry.current = true;
    setCountry(next);
    // Keep typed digits; re-format for new country. Empty stays empty.
    setDisplay(formatNationalDisplay(national, next));
    emit(next, national);
  };

  const handleNationalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;

    if (raw.trim().startsWith("+")) {
      const pasted = parsePhoneValue(raw.trim(), country);
      if (pasted.hasNumber) {
        userLockedCountry.current = true;
        setCountry(pasted.country);
        setNational(pasted.national);
        setDisplay(formatNationalDisplay(pasted.national, pasted.country));
        lastSyncedValue.current = pasted.e164;
        onChange?.(pasted.e164);
        return;
      }
    }

    const digits = raw.replace(/\D/g, "");
    setNational(digits);
    setDisplay(formatNationalDisplay(digits, country));
    emit(country, digits);
  };

  const hasError = Boolean(errorMessage);

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium mb-1 block text-foreground",
            labelClassName,
          )}
        >
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div
        className={cn(
          "flex w-full",
          hasError &&
            "[&_button]:border-destructive [&_input]:border-destructive",
        )}
      >
        <PhoneCountrySelect
          id={countrySelectId}
          value={country}
          onChange={handleCountryChange}
          disabled={disabled || (detectCountry && detecting && !value.trim())}
          triggerClassName={triggerClassName}
        />
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          required={required}
          placeholder={placeholder ?? getPhonePlaceholder(country)}
          value={display}
          onChange={handleNationalChange}
          onBlur={onBlur}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          className={cn(
            "flex h-10 w-full rounded-r-sm border border-input bg-background px-3 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName,
          )}
        />
      </div>

      {hint && !hasError ? (
        <p
          id={`${inputId}-hint`}
          className="text-[11px] text-muted-foreground mt-1"
        >
          {hint}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          id={`${inputId}-error`}
          className="text-[11px] text-destructive mt-1"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default PhoneInput;
