"use client";

import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { trialCopy } from "@/lib/trial/copy";
import type { DomainTrialValues } from "@/lib/validation";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { HostKindToggle } from "../../shared/HostKindToggle";

/**
 * Step 1 — the hosting gate. Own-domain trials always run on the customer's
 * VPS or cPanel, so they must pick a host kind and confirm the server is ready.
 */
export function HostingStep({
  form,
  language,
}: Readonly<{
  form: UseFormReturn<DomainTrialValues>;
  language: MarketplaceLanguage;
}>) {
  const copy = trialCopy(language).domain;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">{copy.hostingQuestion}</h3>

      <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
        <FormField
          control={form.control}
          name="hostKind"
          render={({ field }) => (
            <FormItem>
              <p className="mb-2 text-sm font-semibold text-foreground">{copy.hostKindLabel}</p>
              <HostKindToggle value={field.value} onChange={field.onChange} language={language} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasHosting"
          render={({ field }) => (
            <FormItem>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors hover:bg-muted/40">
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="mt-0.5 h-5 w-5 rounded-md"
                  aria-describedby="has-hosting-hint"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{copy.readyCheckbox}</span>
                  <span id="has-hosting-hint" className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {copy.readyHint}
                  </span>
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default HostingStep;
