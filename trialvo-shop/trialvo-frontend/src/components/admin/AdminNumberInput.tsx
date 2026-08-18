import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AdminNumberInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  emptyAs?: number;
};

function formatDisplay(n: number, integer: boolean): string {
  if (!Number.isFinite(n)) return '';
  if (integer) return String(Math.trunc(n));
  return String(n);
}

function parseDraft(raw: string, integer: boolean): number | null {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null;
  const n = integer ? parseInt(trimmed, 10) : parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min?: number, max?: number): number {
  let v = n;
  if (min != null && v < min) v = min;
  if (max != null && v > max) v = max;
  return v;
}

/**
 * Admin numeric field that replaces the current value on first keystroke
 * (selects on focus) and does not keep a leading 0 like "025".
 */
export function AdminNumberInput({
  value,
  onValueChange,
  min,
  max,
  step,
  integer = false,
  emptyAs = 0,
  className,
  onFocus,
  onBlur,
  ...rest
}: AdminNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatDisplay(value, integer));

  useEffect(() => {
    if (!focused) setDraft(formatDisplay(value, integer));
  }, [value, focused, integer]);

  const commit = (raw: string) => {
    const parsed = parseDraft(raw, integer);
    const next = clamp(parsed == null ? emptyAs : parsed, min, max);
    onValueChange(next);
    setDraft(formatDisplay(next, integer));
  };

  return (
    <Input
      {...rest}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      spellCheck={false}
      min={min}
      max={max}
      step={step}
      className={cn(className)}
      value={focused ? draft : formatDisplay(value, integer)}
      onFocus={(e) => {
        setFocused(true);
        setDraft(formatDisplay(value, integer));
        onFocus?.(e);
        requestAnimationFrame(() => e.currentTarget.select());
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/^(-?)0+(?=\d)/, '$1');
        if (raw !== '' && !/^-?\d*\.?\d*$/.test(raw)) return;
        if (integer && raw.includes('.')) return;
        setDraft(raw);
        const parsed = parseDraft(raw, integer);
        if (parsed != null) onValueChange(parsed);
      }}
      onBlur={(e) => {
        setFocused(false);
        commit(draft);
        onBlur?.(e);
      }}
    />
  );
}
