import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: boolean; // true = Active, false = Inactive
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export default function ActiveInactiveSwitch({
  value,
  onChange,
  disabled = false,
  className,
}: Props) {
  const isActive = value;

  return (
    <div className={cn("w-full max-w-[360px]", className)}>
      <div
        className={cn(
          // ✅ max height 40px
          "grid h-10 grid-cols-2 overflow-hidden rounded-xl border bg-white dark:bg-gray-900",
          disabled
            ? "border-gray-200 opacity-70 dark:border-gray-800"
            : isActive
            ? "border-success-500"
            : "border-error-500"
        )}
      >
        {/* ACTIVE side */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={cn(
            // ✅ responsive text + keep within h-10
            "h-10 w-full px-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm",
            "flex items-center justify-center gap-1.5 sm:gap-2",
            "outline-none focus-visible:outline-none",
            isActive
              ? "bg-success-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/40"
          )}
        >
          <span className="truncate">Active</span>

          <span>
            <Check size={14} className="sm:hidden" />
            <Check size={16} className="hidden sm:block" />
          </span>
        </button>

        {/* INACTIVE side */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={cn(
            "h-10 w-full px-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm",
            "flex items-center justify-center gap-1.5 sm:gap-2",
            "outline-none focus-visible:outline-none",
            !isActive
              ? "bg-error-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/40"
          )}
        >
          <span>
            <X size={14} className="sm:hidden" />
            <X size={16} className="hidden sm:block" />
          </span>

          <span className="truncate">Inactive</span>
        </button>
      </div>
    </div>
  );
}
