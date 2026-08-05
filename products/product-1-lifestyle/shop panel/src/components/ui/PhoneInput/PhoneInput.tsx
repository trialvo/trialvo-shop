"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { ChevronDown, Search, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  getFlag,
  findCountryByNumber,
  formatDigits,
  type Country,
} from "./countries";
import { normalizeCountryCode } from "./countryDetection";
import { useDetectedCountryCode } from "./useDetectedCountryCode";

export interface PhoneInputHandle {
  focus: () => void;
}

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  defaultCountryCode?: string;
  autoDetectCountry?: boolean;
}

const DEFAULT_COUNTRY =
  COUNTRIES.find((c) => c.code === "US") ?? COUNTRIES[0];

function resolveCountry(code: string | null | undefined): Country {
  const countryCode = normalizeCountryCode(code) ?? DEFAULT_COUNTRY.code;
  return COUNTRIES.find((c) => c.code === countryCode) ?? DEFAULT_COUNTRY;
}

function stripNonDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function normalizeInternationalPhone(value: string): string | null {
  const compact = value.trim().replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("00")) return `+${compact.slice(2)}`;
  return null;
}

function parseInternationalPhone(
  value: string,
  preferredCountryCode?: string,
): { country: Country; local: string } | null {
  const internationalPhone = normalizeInternationalPhone(value);
  if (!internationalPhone) return null;

  const country = findCountryByNumber(internationalPhone, preferredCountryCode);
  if (!country) return null;

  const rawLocal = internationalPhone
    .slice(country.dialCode.length)
    .replace(/\D/g, "");

  return { country, local: formatDigits(rawLocal, country.maxLength) };
}

function initFromValue(
  value: string | undefined,
  defaultCode: string
): { country: Country; local: string } {
  if (!value) return { country: resolveCountry(defaultCode), local: "" };
  const trimmed = value.trim();
  const internationalValue = parseInternationalPhone(trimmed, defaultCode);
  if (internationalValue) return internationalValue;

  const defaultCountry = resolveCountry(defaultCode);
  return {
    country: defaultCountry,
    local: formatDigits(stripNonDigits(trimmed), defaultCountry.maxLength),
  };
}

const PhoneInput = forwardRef<PhoneInputHandle, PhoneInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      error,
      label,
      disabled = false,
      name,
      id,
      className,
      defaultCountryCode = "US",
      autoDetectCountry = true,
    },
    ref
  ) => {
    const fallbackCountryCode = normalizeCountryCode(defaultCountryCode) ?? DEFAULT_COUNTRY.code;
    const detectedCountryCode = useDetectedCountryCode(autoDetectCountry);

    const inputRef    = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef  = useRef<HTMLButtonElement>(null);
    const searchRef   = useRef<HTMLInputElement>(null);
    const listRef     = useRef<HTMLUListElement>(null);
    const userSelectedCountryRef = useRef(false);

    const [country,      setCountry]      = useState<Country>(() => initFromValue(value, fallbackCountryCode).country);
    const [localDigits,  setLocalDigits]  = useState<string>(() => initFromValue(value, fallbackCountryCode).local);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [openUpward,   setOpenUpward]   = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [search,       setSearch]       = useState("");
    const [focused,      setFocused]      = useState(false);

    useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

    useEffect(() => {
      const preferredCountryCode = detectedCountryCode ?? fallbackCountryCode;
      const { country: c, local: l } = initFromValue(value, preferredCountryCode);

      if (!value && userSelectedCountryRef.current) {
        setLocalDigits("");
        return;
      }

      setCountry(c);
      setLocalDigits(l);
    }, [detectedCountryCode, fallbackCountryCode, value]);

    const emitChange = useCallback(
      (c: Country, l: string) => {
        const digits = stripNonDigits(l);
        const full = digits ? `${c.dialCode} ${formatDigits(digits, c.maxLength)}` : "";
        onChange?.(full);
      },
      [onChange]
    );

    useEffect(() => {
      if (!dropdownOpen) return;
      const handler = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
          setSearch("");
        }
      };
      const tid = setTimeout(() => document.addEventListener("click", handler), 0);
      return () => { clearTimeout(tid); document.removeEventListener("click", handler); };
    }, [dropdownOpen]);

    useEffect(() => {
      if (!dropdownOpen || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 300 && spaceAbove > spaceBelow);
    }, [dropdownOpen]);

    useEffect(() => {
      if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
    }, [dropdownOpen]);

    const closeDropdown = useCallback((returnFocus = true) => {
      setDropdownOpen(false);
      setSearch("");
      setFocusedIndex(-1);
      if (returnFocus) setTimeout(() => triggerRef.current?.focus(), 0);
    }, []);

    const focusItem = useCallback((index: number, list: Country[]) => {
      const clamped = Math.max(0, Math.min(index, list.length - 1));
      setFocusedIndex(clamped);
      listRef.current?.querySelector<HTMLElement>(`[data-index="${clamped}"]`)?.focus();
    }, []);

    const filtered = search
      ? COUNTRIES.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dialCode.includes(search) ||
            c.code.toLowerCase().includes(search.toLowerCase())
        )
      : COUNTRIES;

    const handleTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dropdownOpen ? setTimeout(() => focusItem(0, filtered), 60) : setDropdownOpen(true);
      }
      if (e.key === "Escape") closeDropdown(false);
    };

    const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
      if      (e.key === "ArrowDown") { e.preventDefault(); focusItem(0, filtered); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); focusItem(filtered.length - 1, filtered); }
      else if (e.key === "Escape")    { closeDropdown(); }
      else if (e.key === "Tab")       { closeDropdown(false); }
    };

    const handleItemKey = (e: KeyboardEvent<HTMLLIElement>, index: number) => {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); focusItem((index + 1) % filtered.length, filtered); break;
        case "ArrowUp":   e.preventDefault(); focusItem((index - 1 + filtered.length) % filtered.length, filtered); break;
        case "Home":      e.preventDefault(); focusItem(0, filtered); break;
        case "End":       e.preventDefault(); focusItem(filtered.length - 1, filtered); break;
        case "Enter":
        case " ":         e.preventDefault(); selectCountry(filtered[index]); break;
        case "Escape":    closeDropdown(); break;
        case "Tab":       closeDropdown(false); break;
      }
    };

    const selectCountry = (c: Country) => {
      userSelectedCountryRef.current = true;
      setCountry(c);
      setLocalDigits("");
      emitChange(c, "");
      closeDropdown();
    };

    const handleLocalChange = (e: ChangeEvent<HTMLInputElement>) => {
      const internationalValue = parseInternationalPhone(e.target.value, country.code);

      if (internationalValue) {
        setCountry(internationalValue.country);
        setLocalDigits(internationalValue.local);
        emitChange(internationalValue.country, internationalValue.local);
        return;
      }

      const formatted = formatDigits(stripNonDigits(e.target.value), country.maxLength);
      setLocalDigits(formatted);
      emitChange(country, formatted);
    };

    const fieldId  = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : "phone");
    const hasValue = stripNonDigits(localDigits).length > 0;

    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label htmlFor={fieldId} className="text-xs tracking-wide text-muted-foreground uppercase block">
            {label}
          </label>
        )}

        <div
          className={cn(
            "flex items-stretch border rounded bg-background transition-colors",
            focused && !error ? "border-accent" : "",
            error ? "border-destructive" : "border-border",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              onKeyDown={handleTriggerKey}
              disabled={disabled}
              aria-label="Select country code"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              className={cn(
                "flex items-center gap-1.5 h-full px-3 border-r border-border",
                "text-sm cursor-pointer hover:bg-secondary/60 transition-colors",
                "rounded-l focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                dropdownOpen && "bg-secondary/60"
              )}
            >
              <span className="text-base leading-none select-none" aria-hidden="true">
                {getFlag(country.code)}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground tracking-wide tabular-nums">
                {country.dialCode}
              </span>
              <ChevronDown
                size={12}
                className={cn("text-muted-foreground transition-transform duration-150", dropdownOpen && "rotate-180")}
              />
            </button>


            <div
                className={cn(
                  "absolute left-0 z-50 w-[280px] sm:w-[300px]",
                  openUpward ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]",
                  openUpward ? "origin-bottom-left" : "origin-top-left",
                  "bg-background border border-border rounded-xl shadow-2xl shadow-foreground/10",
                  "flex flex-col overflow-hidden",
                  "transition-[opacity,transform] duration-200 ease-out",
                  dropdownOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                )}
                role="dialog"
                aria-label="Country search"
              >
                <div className="p-2 border-b border-border">
                  <div className="flex items-center gap-2 px-2.5 py-2 bg-secondary/50 rounded-lg">
                    <Search size={13} className="text-muted-foreground shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setFocusedIndex(-1); }}
                      onKeyDown={handleSearchKey}
                      placeholder="Search country or code…"
                      className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <ul
                  ref={listRef}
                  role="listbox"
                  aria-label="Countries"
                  aria-activedescendant={focusedIndex >= 0 ? `phone-option-${filtered[focusedIndex]?.code}` : undefined}
                  className="overflow-y-auto max-h-[240px] py-1 overscroll-contain"
                >
                  {filtered.length === 0 ? (
                    <li className="px-4 py-3 text-[12px] text-muted-foreground text-center">No countries found</li>
                  ) : (
                    filtered.map((c, i) => (
                      <li
                        key={c.code}
                        id={`phone-option-${c.code}`}
                        data-index={i}
                        role="option"
                        tabIndex={dropdownOpen ? 0 : -1}
                        aria-selected={c.code === country.code}
                        onClick={() => selectCountry(c)}
                        onKeyDown={(e) => handleItemKey(e, i)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors outline-none",
                          "hover:bg-secondary/70 focus:bg-secondary/70 text-[13px]",
                          c.code === country.code && "bg-accent/8 text-accent font-medium"
                        )}
                      >
                        <span className="text-base w-6 text-center shrink-0 select-none" aria-hidden="true">{getFlag(c.code)}</span>
                        <span className="flex-1 truncate text-foreground/85">{c.name}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{c.dialCode}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
          </div>

          <input
            ref={inputRef}
            id={fieldId}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={localDigits}
            onChange={handleLocalChange}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); onBlur?.(); }}
            disabled={disabled}
            placeholder={`e.g. ${formatDigits("0".repeat(Math.min(country.maxLength, 9)), country.maxLength)}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              "flex-1 min-w-0 px-3 py-3 bg-transparent text-foreground text-sm",
              "placeholder:text-muted-foreground/40 focus:outline-none transition-colors rounded-r"
            )}
          />

          {hasValue && !disabled && (
            <button
              type="button"
              onClick={() => { setLocalDigits(""); emitChange(country, ""); inputRef.current?.focus(); }}
              className="px-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
              aria-label="Clear phone number"
              tabIndex={-1}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {error && (
          <p id={`${fieldId}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
