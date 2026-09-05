"use client";

import type { UseFormReturn } from "react-hook-form";
import { Globe } from "lucide-react";
import { FormTextField } from "@/components/form";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { trialCopy } from "@/lib/trial/copy";
import { endDateForMonths, formatDate, monthsLabel } from "@/lib/trial/months";
import type { DomainTrialValues } from "@/lib/validation";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { MonthPicker } from "../../shared/MonthPicker";

/** Step 2 — how long, and on which domain. */
export function DurationStep({
  form,
  language,
  presets,
}: Readonly<{
  form: UseFormReturn<DomainTrialValues>;
  language: MarketplaceLanguage;
  presets: number[];
}>) {
  const copy = trialCopy(language).domain;
  const buying = form.watch("hostingSource") === "buy_from_trialvo";

  const single = presets.length === 1;

  return (
    <div className="space-y-5">
      {single ? (
        <p className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground">
          <span className="font-semibold">{monthsLabel(presets[0], language)}</span>
          <span className="text-muted-foreground"> · {copy.endsOn(formatDate(endDateForMonths(presets[0]), language))}</span>
        </p>
      ) : (
        <div>
          <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">{copy.durationQuestion}</h3>
          <FormField
            control={form.control}
            name="months"
            render={({ field }) => (
              <FormItem className="mt-3">
                <MonthPicker presets={presets} value={field.value} onChange={field.onChange} language={language} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormTextField
        control={form.control}
        name="domain"
        label={copy.domainLabel}
        placeholder={copy.domainPlaceholder}
        autoComplete="url"
        requiredMark={!buying}
        startAdornment={<Globe className="h-4 w-4" aria-hidden="true" />}
        description={buying ? copy.domainOptionalHint : undefined}
        inputClassName="font-mono h-11 rounded-lg border-border bg-card"
      />
    </div>
  );
}

export default DurationStep;
