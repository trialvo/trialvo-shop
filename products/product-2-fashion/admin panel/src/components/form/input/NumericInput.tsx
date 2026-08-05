/**
 * NumericInput — a controlled number input that avoids the "can't clear and retype" problem.
 *
 * The native controlled `value={someNumber}` pattern snaps back to the old value whenever
 * the field is emptied (because `safeNumber("") === fallback`), making it impossible to
 * clear the field and type a fresh number. This component keeps a string buffer for display
 * while emitting a true number through `onValueChange` only when the input is a valid finite
 * number.
 *
 * Additional guards:
 * - Always blurs on wheel scroll so the browser never increments/decrements via scroll.
 * - Rounds values to the precision implied by `step` to eliminate floating-point noise
 *   (e.g. 3 - 0.001 floating point gives 2.999000000001 without rounding).
 */
import * as React from "react";
import Input from "./InputField";

interface NumericInputProps {
  /** The authoritative numeric value (from state) */
  value: number;
  /** Called whenever the user types / arrows to a valid number */
  onValueChange: (n: number) => void;
  min?: number;
  max?: number;
  /**
   * Step size. Controls both the browser's arrow-key increment and the rounding precision.
   * Defaults to 1 (integer). Use e.g. 0.01 for 2-decimal-place fields.
   */
  step?: number;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/** Returns the number of decimal places implied by a step value (e.g. 0.001 → 3). */
function stepDecimals(step: number | undefined): number {
  if (!step || step >= 1) return 0;
  // Use the string representation to count decimal places, avoiding float issues
  const s = step.toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

/** Rounds n to `decimals` decimal places using the "round half away from zero" method. */
function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

export default function NumericInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled,
  className,
  wrapperClassName,
  placeholder,
  onFocus,
}: NumericInputProps) {
  const decimals = stepDecimals(step);

  const clampAndRound = React.useCallback(
    (n: number) => {
      const rounded = roundTo(n, decimals);
      if (min !== undefined && rounded < min) return roundTo(min, decimals);
      if (max !== undefined && rounded > max) return roundTo(max, decimals);
      return rounded;
    },
    [decimals, min, max],
  );

  // Local string buffer — allows intermediate empty / partial states while typing
  const [raw, setRaw] = React.useState<string>(() =>
    String(clampAndRound(value ?? 0)),
  );

  // Sync buffer when the external value changes (e.g. refetch / reset)
  // Only sync when the numeric value actually differs, to avoid stomping in-progress typing.
  const prevValueRef = React.useRef<number>(value);
  React.useEffect(() => {
    const rounded = clampAndRound(value ?? 0);
    if (prevValueRef.current !== rounded) {
      prevValueRef.current = rounded;
      setRaw(String(rounded));
    }
  }, [value, clampAndRound]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str); // always update the display buffer

    const n = Number(str);
    if (str.trim() !== "" && Number.isFinite(n)) {
      const final = clampAndRound(n);
      if (final !== clampAndRound(value ?? 0)) {
        onValueChange(final);
      }
    }
  };

  // On blur: reset display to the current canonical (rounded) value
  const handleBlur = () => {
    const n = Number(raw);
    const canonical = Number.isFinite(n) ? clampAndRound(n) : clampAndRound(value ?? 0);
    setRaw(String(canonical));
    // Also emit if the raw string represented a valid number that differs from state
    if (Number.isFinite(n)) {
      const final = clampAndRound(n);
      if (final !== clampAndRound(value ?? 0)) {
        onValueChange(final);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
    onFocus?.(e);
  };

  // Always blur on wheel — prevents browser from changing the value via scroll,
  // which causes floating-point drift (e.g. 3 → 2.999000... or 3.001000...)
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <Input
      type="number"
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onWheel={handleWheel}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={className}
      wrapperClassName={wrapperClassName}
      placeholder={placeholder}
    />
  );
}
