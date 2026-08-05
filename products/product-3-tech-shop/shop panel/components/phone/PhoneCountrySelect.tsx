"use client";

import { useMemo, useState, type ReactElement } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findPhoneCountry, getPhoneCountries } from "@/lib/phone/countries";
import { cn } from "@/lib/utils";

type PhoneCountrySelectProps = Readonly<{
  value: CountryCode;
  onChange: (iso2: CountryCode) => void;
  disabled?: boolean;
  /** Trigger button class overrides (checkout styling, etc.) */
  triggerClassName?: string;
  id?: string;
  "aria-label"?: string;
}>;

/**
 * Searchable country + dial-code picker (all countries).
 * Dropdown auto-flips (bottom ↔ top) via Radix collision detection.
 */
export function PhoneCountrySelect({
  value,
  onChange,
  disabled = false,
  triggerClassName,
  id,
  "aria-label": ariaLabel = "Select country",
}: PhoneCountrySelectProps): ReactElement {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => getPhoneCountries(), []);
  const selected = findPhoneCountry(value) ?? countries[0]!;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 border border-r-0 border-input bg-background px-2.5 text-sm",
            "hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 rounded-l-sm",
            triggerClassName,
          )}
        >
          <span aria-hidden className="text-base leading-none">
            {selected.flag}
          </span>
          <span className="tabular-nums text-xs font-medium min-w-[2.75rem]">
            {selected.dialCode}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions
        collisionPadding={12}
        sticky="partial"
        // Below header (z-50) so sticky header always stays on top
        className="z-40 w-[min(100vw-2rem,20rem)] p-0 rounded-sm"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-sm">
          <CommandInput placeholder="Search country or code…" />
          <CommandList className="max-h-60">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.iso2}
                  value={`${country.name} ${country.iso2} ${country.dialCode}`}
                  onSelect={() => {
                    onChange(country.iso2);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2" aria-hidden>
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate text-sm">{country.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums mr-1">
                    {country.dialCode}
                  </span>
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      value === country.iso2 ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
