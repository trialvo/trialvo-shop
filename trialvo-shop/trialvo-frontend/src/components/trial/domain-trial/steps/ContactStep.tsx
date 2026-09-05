"use client";

import type { UseFormReturn } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { FormTextareaField, FormTextField } from "@/components/form";
import { trialCopy } from "@/lib/trial/copy";
import { endDateForMonths, formatDate, monthsLabel } from "@/lib/trial/months";
import type { DomainTrialValues } from "@/lib/validation";
import type { MarketplaceLanguage } from "@/types/marketplace";

/** Step 3 — contact details + a compact summary of what they picked. */
export function ContactStep({
  form,
  language,
  prefilled,
}: Readonly<{
  form: UseFormReturn<DomainTrialValues>;
  language: MarketplaceLanguage;
  prefilled: boolean;
}>) {
  const copy = trialCopy(language);
  const v = form.watch();
  const rows: [string, string][] = [
    [copy.domain.stepHosting, v.hostingSource === "own"
      ? `${copy.hostingSource.own} · ${v.hostKind ? copy.hostKind[v.hostKind] : ""}`
      : copy.hostingSource.buy_from_trialvo],
    [copy.domain.stepDuration, v.months ? `${monthsLabel(v.months, language)} · ${copy.domain.endsOn(formatDate(endDateForMonths(v.months), language))}` : "—"],
    [copy.domain.domainLabel, v.domain || "—"],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">{copy.domain.contactTitle}</h3>
        {prefilled ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.domain.prefilledFrom}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <FormTextField control={form.control} name="name" label={copy.common.name} autoComplete="name" requiredMark inputClassName="h-11 rounded-lg border-border bg-card" />
        <FormTextField control={form.control} name="phone" type="tel" label={copy.common.phone} autoComplete="tel" requiredMark inputClassName="h-11 rounded-lg border-border bg-card" />
        <FormTextField control={form.control} name="email" type="email" label={copy.common.email} autoComplete="email" requiredMark className="sm:col-span-2" inputClassName="h-11 rounded-lg border-border bg-card" />
        <FormTextField control={form.control} name="company" label={`${copy.common.company} (${copy.common.optional})`} autoComplete="organization" className="sm:col-span-2" inputClassName="h-11 rounded-lg border-border bg-card" />
        <FormTextareaField
          control={form.control}
          name="notes"
          label={copy.domain.notesLabel}
          placeholder={copy.domain.notesPlaceholder}
          rows={2}
          textareaClassName="min-h-[64px]"
          className="sm:col-span-2"
        />
      </div>

      <dl className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{copy.domain.summary}</p>
        {rows.map(([k, val]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-1">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium text-foreground">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ContactStep;
