"use client";

import * as React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export type AutocompleteOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type AutocompleteProps<TValue extends string> = {
  value?: TValue;
  onChange: (next: TValue) => void;

  options: AutocompleteOption<TValue>[];

  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;

  disabled?: boolean;
  className?: string;

  /** applied to the input */
  triggerClassName?: string;

  contentClassName?: string;

  /** optional - useful to mark RHF touched */
  onBlur?: () => void;
};

const Autocomplete = <TValue extends string,>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled,
  className,
  triggerClassName,
  contentClassName,
  onBlur,
}: AutocompleteProps<TValue>) => {
  const [open, setOpen] = React.useState(false);

  // this is the text user types (query) OR the display label
  const [inputValue, setInputValue] = React.useState<string>("");

  const lastInteractionRef = React.useRef<"mouse" | "keyboard">("mouse");

  const selectedOption = React.useMemo(() => {
    if (!value) return undefined;
    return options.find((o) => o.value === value);
  }, [options, value]);

  // ✅ sync display when value/options change (default values will show)
  React.useEffect(() => {
    const next = selectedOption?.label ?? (value ?? "");
    setInputValue(next);
  }, [selectedOption, value]);

  const commitFreeText = React.useCallback(() => {
    // allow typing custom value (phone) if not in list
    const v = (inputValue ?? "").trim();
    onChange(v as TValue);
  }, [inputValue, onChange]);

  const handlePick = React.useCallback(
    (opt: AutocompleteOption<TValue>) => {
      setInputValue(opt.label);
      onChange(opt.value); // ✅ controlled value is opt.value
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Input
              value={inputValue}
              placeholder={placeholder}
              disabled={disabled}
              onPointerDown={() => {
                lastInteractionRef.current = "mouse";
              }}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onClick={() => {
                if (disabled) return;
                setOpen((p) => !p);
              }}
              onFocus={() => {
                if (disabled) return;
                if (lastInteractionRef.current === "keyboard") {
                  setOpen(true);
                }
              }}
              onBlur={() => {
                // ✅ keep RHF touched + commit typed value
                onBlur?.();
                commitFreeText();
              }}
              onKeyDown={(e) => {
                lastInteractionRef.current = "keyboard";

                if (e.key === "Escape") setOpen(false);

                if (e.key === "ArrowDown") {
                  setOpen(true);
                }

                if (e.key === "Enter") {
                  e.preventDefault();
                  commitFreeText();
                  setOpen(false);
                }
              }}
              className={cn("h-10 rounded-none border-[#CBCBCB] pr-10", triggerClassName)}
            />

            <button
              type="button"
              aria-label="Toggle options"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                if (disabled) return;
                setOpen((p) => !p);
              }}
              className={cn(
                "absolute right-0 top-0 grid h-10 w-10 place-items-center",
                "text-muted-foreground hover:text-foreground",
                "disabled:opacity-60",
              )}
            >
              <ChevronsUpDown className="h-4 w-4 opacity-60" />
            </button>
          </div>
        </PopoverAnchor>

        <PopoverContent
          className={cn("w-(--radix-popover-trigger-width) p-0", contentClassName)}
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />

            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>

              <CommandGroup>
                {options.map((o) => {
                  const isSelected = value != null && o.value === value; // ✅ compare with value

                  return (
                    <CommandItem
                      key={o.value}
                      value={`${o.label} ${o.value}`}
                      onSelect={() => handlePick(o)}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{o.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Autocomplete;
