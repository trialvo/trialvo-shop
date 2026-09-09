"use client";

import { trialCopy } from "@/lib/trial/copy";
import { endDateForMonths, formatDate, localizeNumber } from "@/lib/trial/months";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/**
 * Duration presets (1/2/3 months) as big tappable tiles. The list comes from
 * admin settings, so this renders whatever is offered — never a hard-coded 3.
 */
export function MonthPicker({
  presets,
  value,
  onChange,
  language,
}: Readonly<{
  presets: number[];
  value: number | undefined;
  onChange: (months: number) => void;
  language: MarketplaceLanguage;
}>) {
  const copy = trialCopy(language).domain;
  const cols = presets.length >= 3 ? "grid-cols-3" : presets.length === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div>
      <div role="radiogroup" aria-label={copy.durationQuestion} className={cn("grid gap-2.5", cols)}>
        {presets.map((m) => {
          const selected = value === m;
          const recommended = m === presets[presets.length - 1] && presets.length > 1;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(m)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border px-3 py-4 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_hsl(var(--accent))]"
                  : "border-border bg-card hover:border-foreground/25 hover:bg-muted/40",
              )}
            >
              {recommended ? (
                <span className="absolute -top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                  {language === "bn" ? "সর্বোচ্চ" : "Max"}
                </span>
              ) : null}
              <span className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
                {localizeNumber(m, language)}
              </span>
              <span className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === "bn" ? "মাস" : m === 1 ? "month" : "months"}
              </span>
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="mt-2.5 text-center text-xs text-muted-foreground">
          {copy.endsOn(formatDate(endDateForMonths(value), language))} · {language === "bn" ? "সম্পূর্ণ ফ্রি" : "completely free"}
        </p>
      ) : null}
    </div>
  );
}

export default MonthPicker;
