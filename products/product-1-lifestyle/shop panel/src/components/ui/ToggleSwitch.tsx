"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional label shown to the left */
  label?: string;
  /** Optional description shown below the label */
  description?: string;
  /** Additional class on the outer wrapper */
  className?: string;
  id?: string;
}

/**
 * Accessible toggle switch with optional label + description layout.
 * Replaces identical inline toggle patterns in NotificationsTab and AddressTab.
 */
export function ToggleSwitch({ checked, onChange, label, description, className, id }: ToggleSwitchProps) {
  const switchId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const button = (
    <button
      type="button"
      id={switchId}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        checked ? "bg-accent" : "bg-border"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-background transition-transform",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );

  if (!label && !description) return button;

  return (
    <div className={cn("flex items-center justify-between py-4 border-b border-border last:border-0", className)}>
      <div>
        {label && <p className="text-sm text-foreground">{label}</p>}
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {button}
    </div>
  );
}
