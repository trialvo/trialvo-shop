"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SelectDropdownOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type SelectDropdownProps<TValue extends string> = {
  value?: TValue;
  onChange: (value: TValue) => void;

  options: SelectDropdownOption<TValue>[];

  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;

  disabled?: boolean;
  className?: string;

  triggerClassName?: string;
  contentClassName?: string;
  listMaxHeightClassName?: string;

  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;

  avoidCollisions?: boolean;

  closeOnSelect?: boolean;
};

const SelectDropdown = <TValue extends string,>({
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
  listMaxHeightClassName = "max-h-[260px]",
  align = "start",
  side = "bottom",
  sideOffset = 6,
  avoidCollisions = false,
  closeOnSelect = true,
}: SelectDropdownProps<TValue>) => {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return options.find((o) => o.value === value) ?? null;
  }, [options, value]);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between rounded-none border border-[#CBCBCB] bg-white px-3",
              "text-sm font-medium text-black shadow-none",
              "hover:bg-white",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              triggerClassName,
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          avoidCollisions={avoidCollisions}
          className={cn(
            "w-(--radix-popover-trigger-width) p-0",
            "rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)]",
            contentClassName,
          )}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-10 rounded-none" />
            <CommandList className={cn(listMaxHeightClassName, "overflow-auto")}>
              <CommandEmpty>{emptyText}</CommandEmpty>

              <CommandGroup>
                {options.map((o) => {
                  const isSelected = o.value === value;

                  return (
                    <CommandItem
                      key={o.value}
                      value={`${o.label} ${o.value}`}
                      onSelect={() => {
                        onChange(o.value);
                        if (closeOnSelect) setOpen(false);
                      }}
                      className="cursor-pointer rounded-none"
                    >
                      <Check className={cn("mr-0 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate text-sm">{o.label}</span>
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

export default SelectDropdown;
