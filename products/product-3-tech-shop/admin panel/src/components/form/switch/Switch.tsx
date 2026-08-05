"use client";

import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type SwitchSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: "h-5 w-9",      thumb: "h-3.5 w-3.5", translate: "translateX(14px)" },
  md: { track: "h-6 w-11",     thumb: "h-4.5 w-4.5", translate: "translateX(18px)" },
  lg: { track: "h-7 w-[52px]", thumb: "h-5 w-5",     translate: "translateX(24px)" },
};

type SwitchColor = "brand" | "success" | "gray";

const COLOR_MAP: Record<SwitchColor, { trackOn: string; glowOn: string }> = {
  brand: {
    trackOn: "bg-brand-500 border-brand-600",
    glowOn: "shadow-[0_0_8px_rgba(99,102,241,0.3)]",
  },
  success: {
    trackOn: "bg-success-500 border-success-600",
    glowOn: "shadow-[0_0_8px_rgba(34,197,94,0.3)]",
  },
  gray: {
    trackOn: "bg-gray-800 border-gray-900 dark:bg-gray-200 dark:border-gray-300",
    glowOn: "",
  },
};

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: SwitchSize;
  color?: SwitchColor;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked = false,
  onChange,
  label,
  description,
  size = "md",
  color = "brand",
  disabled = false,
  className,
  id,
}) => {
  const isControlled = typeof checked === "boolean";
  const [isChecked, setIsChecked] = useState(isControlled ? checked : defaultChecked);

  useEffect(() => {
    if (isControlled) setIsChecked(checked);
  }, [checked, isControlled]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setIsChecked(next);
    onChange?.(next);
  }, [disabled, isChecked, isControlled, onChange]);

  const s = SIZE_MAP[size];
  const c = COLOR_MAP[color];
  const trackOff = "border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700";

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex select-none items-center gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        handleToggle();
      }}
    >
      <span
        role="switch"
        aria-checked={isChecked}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full border",
          "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
          "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2",
          s.track,
          isChecked ? cn(c.trackOn, c.glowOn) : trackOff,
        )}
      >
        <span
          className={cn("absolute left-[3px] rounded-full bg-white shadow-sm", s.thumb)}
          style={{
            transform: isChecked ? s.translate : "translateX(0)",
            transition: `transform 300ms ${SPRING}`,
          }}
        />
      </span>

      {(label || description) && (
        <span className="min-w-0 select-none">
          {label && (
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
};

export default Switch;
