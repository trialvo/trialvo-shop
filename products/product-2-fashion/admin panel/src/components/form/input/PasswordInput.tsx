import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, X, Lock } from "lucide-react";

// ─── Strength helpers ─────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_META: Record<StrengthLevel, { label: string; color: string; barColor: string }> = {
  0: { label: "Too short",   color: "text-gray-400",  barColor: "bg-gray-200 dark:bg-gray-700" },
  1: { label: "Weak",        color: "text-error-500",  barColor: "bg-error-500" },
  2: { label: "Fair",        color: "text-warning-500", barColor: "bg-warning-500" },
  3: { label: "Strong",      color: "text-success-500", barColor: "bg-success-500" },
  4: { label: "Very strong", color: "text-success-600", barColor: "bg-success-600" },
};

function computeStrength(value: string, minLength: number): StrengthLevel {
  if (value.length < minLength) return 0;
  let score = 0;
  if (/[a-z]/.test(value)) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(4, Math.max(1, score)) as StrengthLevel;
}

// ─── Requirement rules ────────────────────────────────────────────────────────

type Rule = { id: string; label: string; test: (v: string) => boolean };

function defaultRules(minLength: number): Rule[] {
  return [
    { id: "length",  label: `At least ${minLength} characters`, test: v => v.length >= minLength },
    { id: "lower",   label: "One lowercase letter (a-z)",       test: v => /[a-z]/.test(v) },
    { id: "upper",   label: "One uppercase letter (A-Z)",       test: v => /[A-Z]/.test(v) },
    { id: "number",  label: "One number (0-9)",                 test: v => /[0-9]/.test(v) },
    { id: "special", label: "One special character (!@#…)",      test: v => /[^a-zA-Z0-9]/.test(v) },
  ];
}

// ─── Spring easings ───────────────────────────────────────────────────────────

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ─── Component ────────────────────────────────────────────────────────────────

export interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;

  /** Show the strength meter bar below the input (default: true) */
  showStrengthMeter?: boolean;
  /** Show the requirements checklist on focus (default: true) */
  showRequirements?: boolean;
  /** Minimum password length (default: 8) */
  minLength?: number;
  /** Custom rules — overrides the default set */
  rules?: Rule[];

  error?: boolean;
  hint?: string;

  startIcon?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export default function PasswordInput({
  value,
  onChange,
  onBlur,
  onFocus,
  id,
  name,
  placeholder = "Enter password",
  disabled = false,
  autoComplete,
  showStrengthMeter = true,
  showRequirements = true,
  minLength = 8,
  rules: customRules,
  error = false,
  hint,
  startIcon,
  className,
  wrapperClassName,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const rules = useMemo(
    () => customRules ?? defaultRules(minLength),
    [customRules, minLength],
  );

  const strength = useMemo(() => computeStrength(value, minLength), [value, minLength]);
  const meta = STRENGTH_META[strength];
  const hasValue = value.length > 0;

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  // ── State-based border class ────────────────────────────────────────────
  const stateClass = disabled
    ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    : error
      ? "bg-white border-error-500 text-gray-900 focus-within:border-error-500 dark:bg-gray-900 dark:text-white/90 dark:border-error-500"
      : "bg-white border-gray-200 text-gray-900 focus-within:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus-within:border-brand-500";

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {/* ── Input row ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex h-10 items-center rounded-xl border transition-colors duration-150",
          stateClass,
          className,
        )}
      >
        {/* Start icon */}
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30">
          {startIcon ?? <Lock size={16} />}
        </div>

        {/* Input */}
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete ?? "new-password"}
          className={cn(
            "h-full w-full bg-transparent pl-10 pr-10 text-sm outline-none",
            "placeholder:text-gray-400 dark:placeholder:text-white/30",
          )}
        />

        {/* Eye toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible(v => !v)}
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5",
            "text-gray-400 transition-colors hover:text-gray-600",
            "dark:text-gray-500 dark:hover:text-gray-300",
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* ── Strength meter ─────────────────────────────────────────────── */}
      {showStrengthMeter && hasValue && (
        <div className="mt-2 space-y-1">
          <div className="flex gap-1">
            {([1, 2, 3, 4] as const).map(level => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  strength >= level ? meta.barColor : "bg-gray-200 dark:bg-gray-700",
                )}
              />
            ))}
          </div>
          <p className={cn("text-[11px] font-medium", meta.color)}>
            {meta.label}
          </p>
        </div>
      )}

      {/* ── Requirements checklist ──────────────────────────────────────── */}
      {showRequirements && focused && hasValue && (
        <div
          className="mt-2.5 space-y-1.5"
          style={{
            animation: `fadeSlideIn 200ms ${SPRING} forwards`,
          }}
        >
          {rules.map(rule => {
            const passed = rule.test(value);
            return (
              <div
                key={rule.id}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors duration-200",
                  passed
                    ? "text-success-600 dark:text-success-400"
                    : "text-gray-400 dark:text-gray-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                    passed
                      ? "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                  )}
                  style={{
                    transform: passed ? "scale(1)" : "scale(0.85)",
                    transition: `transform 260ms ${SPRING}, background-color 200ms ease, color 200ms ease`,
                  }}
                >
                  {passed ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
                </span>
                <span className={cn("font-medium", passed && "line-through opacity-60")}>
                  {rule.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Hint text ──────────────────────────────────────────────────── */}
      {hint ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400",
          )}
        >
          {hint}
        </p>
      ) : null}

      {/* ── Keyframe injection (idempotent) ──────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
