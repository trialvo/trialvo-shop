"use client";

import React from "react";
import { cn } from "@/lib/utils";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  onValue?: T;
  offValue?: T;
  disabled?: boolean;
  className?: string;
};

const StatusToggle = <T extends string,>({
  value,
  onChange,
  onValue = "active" as T,
  offValue = "inactive" as T,
  disabled = false,
  className,
}: Props<T>) => {
  const checked = String(value).toLowerCase() === String(onValue).toLowerCase();

  return (
    <button
      onClick={() => {
        if (disabled) return;
        onChange(checked ? offValue : onValue);
      }}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border",
        "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2",
        checked
          ? "border-brand-600 bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.25)]"
          : "border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-gray-800",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      aria-label="Toggle status"
      aria-pressed={checked}
      type="button"
      disabled={disabled}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
        style={{
          transform: checked ? "translateX(22px)" : "translateX(3px)",
          transition: `transform 300ms ${SPRING}`,
        }}
      />
    </button>
  );
};

export default StatusToggle;
