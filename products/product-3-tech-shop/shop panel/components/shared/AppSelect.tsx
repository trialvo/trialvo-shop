"use client";

import { useId, useMemo, useState, type ReactElement } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  appSelectContentZIndex,
  type AppSelectLayer,
  type AppSelectOption,
} from "@/lib/ui/appSelect";
import { cn } from "@/lib/utils";

export type AppSelectProps<T extends string = string> = Readonly<{
  value: T | "";
  onChange: (value: T | "") => void;
  onBlur?: () => void;
  options: readonly AppSelectOption<T>[] | AppSelectOption<T>[];
  placeholder?: string;
  /** Show search box when list is long (default: auto if options > 8). */
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
  labelClassName?: string;
  errorMessage?: string;
  hint?: string;
  id?: string;
  name?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /** page = under header; modal = above dialogs. Default modal-safe. */
  layer?: AppSelectLayer;
  emptyLabel?: string;
  required?: boolean;
}>;

/**
 * App-wide select dropdown — Popover flips top/bottom via collision detection
 * (same pattern as PhoneCountrySelect).
 */
export function AppSelect<T extends string = string>({
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select…",
  searchable,
  disabled = false,
  label,
  labelClassName,
  errorMessage,
  hint,
  id,
  name,
  className,
  triggerClassName,
  contentClassName,
  layer = "modal",
  emptyLabel = "No options found.",
  required = false,
}: AppSelectProps<T>): ReactElement {
  const autoId = useId();
  const triggerId = id ?? name ?? autoId;
  const [open, setOpen] = useState(false);

  const showSearch =
    searchable ?? (Array.isArray(options) && options.length > 8);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const hasError = Boolean(errorMessage);

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={triggerId}
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

      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            name={name}
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={hasError || undefined}
            className={cn(
              "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-background px-2.5 text-left text-xs",
              "hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasError && "border-destructive",
              triggerClassName,
            )}
          >
            <span
              className={cn(
                "truncate",
                !selected && "text-muted-foreground",
              )}
            >
              {selected?.label ?? placeholder}
            </span>
            <ChevronsUpDown
              className="h-3.5 w-3.5 shrink-0 opacity-50"
              aria-hidden
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions
          collisionPadding={12}
          sticky="partial"
          className={cn(
            appSelectContentZIndex(layer),
            "w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0 rounded-sm",
            contentClassName,
          )}
          onOpenAutoFocus={(e) => {
            if (!showSearch) e.preventDefault();
          }}
        >
          <Command className="rounded-sm" shouldFilter={showSearch}>
            {showSearch ? (
              <CommandInput placeholder="Search…" className="cursor-text" />
            ) : null}
            <CommandList className="max-h-56">
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    disabled={option.disabled}
                    className="cursor-pointer"
                    onSelect={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                      onBlur?.();
                    }}
                  >
                    <span className="flex-1 truncate text-sm">{option.label}</span>
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hint && !hasError ? (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-[11px] text-destructive mt-1" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default AppSelect;
