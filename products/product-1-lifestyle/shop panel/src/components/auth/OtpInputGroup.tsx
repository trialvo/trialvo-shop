"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";

/** Number of OTP digits — kept as a named constant for easy reconfiguration. */
const OTP_LENGTH = 6;

interface OtpInputGroupProps {
  /** Current array of single-char digit strings (length must equal OTP_LENGTH). */
  value: string[];
  /** Called with the new full array whenever a digit changes. */
  onChange: (next: string[]) => void;
  /** Validation error shown beneath the group. */
  error?: string;
  /** Disables all inputs. */
  disabled?: boolean;
}

/**
 * A row of individual digit inputs for one-time password entry.
 *
 * - Auto-advances focus on digit entry.
 * - Backs up focus on Backspace when the current cell is empty.
 * - Handles paste: spreads the pasted string across all cells.
 * - Fully keyboard-navigable and screen-reader annotated.
 */
export function OtpInputGroup({ value, onChange, error, disabled }: OtpInputGroupProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>(
    Array.from<null>({ length: OTP_LENGTH }).fill(null),
  );

  const focusAt = (idx: number) => {
    inputsRef.current[idx]?.focus();
  };

  const handleChange = (idx: number, raw: string) => {
    // Accept only a single digit
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < OTP_LENGTH - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      focusAt(idx - 1);
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusAt(idx - 1);
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      e.preventDefault();
      focusAt(idx + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...value];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    // Focus the cell after the last pasted digit
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    focusAt(nextFocus);
  };

  return (
    <div>
      <div
        role="group"
        aria-label="One-time password"
        className="flex gap-2 justify-between"
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            value={value[i] ?? ""}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              // Smaller fixed size instead of aspect-square / flex-1
              "w-9 h-9 text-center text-base font-semibold border rounded-sm",
              "bg-background text-foreground",
              "focus:outline-none transition-all duration-200",
              "focus:ring-1 focus:ring-accent/30",
              value[i]
                ? "border-accent"
                : "border-border text-muted-foreground",
              "focus:border-accent",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}
