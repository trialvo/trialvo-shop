"use client";

import Select from "@/components/common/form/Select";
import { cn } from "@/lib/utils";
import * as React from "react";

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
  /** When true, shows search inside the menu (default true for catalog/header). */
  searchable?: boolean;
};

/**
 * Thin wrapper around the shared Select so every dropdown matches
 * the profile Gender field (and the rest of the shop form chrome).
 */
const SelectDropdown = <TValue extends string,>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className,
  triggerClassName,
  contentClassName,
  searchable = true,
}: SelectDropdownProps<TValue>) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={(next) => onChange(next as TValue)}
      placeholder={placeholder}
      disabled={disabled}
      searchable={searchable}
      className={className}
      triggerClassName={triggerClassName}
      menuClassName={cn(contentClassName)}
    />
  );
};

export default SelectDropdown;
