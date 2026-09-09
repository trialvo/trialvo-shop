"use client";

import { ArrowRight, CheckCircle2, Clock, ExternalLink, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { trialCopy } from "@/lib/trial/copy";
import { localizeNumber, upToMonthsLabel } from "@/lib/trial/months";
import type { DemoSubmitResponse } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { CredentialsCard } from "../shared/CredentialsCard";

/**
 * What the customer sees the moment the demo exists: links + login, the
 * shared-environment warning, and the bridge to the own-domain trial.
 */
export function InstantDemoSuccess({
  result,
  language,
  maxMonths,
  domainAvailable,
  onContinueToDomain,
}: Readonly<{
  result: DemoSubmitResponse;
  language: MarketplaceLanguage;
  maxMonths: number;
  domainAvailable: boolean;
  onContinueToDomain: () => void;
}>) {
  const copy = trialCopy(language).demo;
  const ready = Boolean(result.credentials?.adminEmail);
  const title = result.existing ? copy.existingTitle : ready ? copy.readyTitle : copy.delayedTitle;
  const lead = result.existing ? copy.existingLead : ready ? copy.readyLead : copy.delayedLead;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25">
          {ready ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </span>
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{lead}</p>
        {result.trialDays ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.accessDays(localizeNumber(result.trialDays, language))}
          </p>
        ) : null}
      </div>

      {ready ? (
        <CredentialsCard
          shopUrl={result.shopUrl}
          adminUrl={result.adminUrl}
          credentials={result.credentials}
          language={language}
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant={ready ? "outline" : "default"} className="h-11 flex-1 rounded-lg font-semibold">
          <LocalizedLink href={`/trial-status/${result.statusToken}`}>
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.openAccessPage}
          </LocalizedLink>
        </Button>
        {ready && result.shopUrl ? (
          <Button asChild className="h-11 flex-1 rounded-lg bg-accent font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90">
            <a href={result.shopUrl} target="_blank" rel="noopener noreferrer">
              {copy.shop}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        ) : null}
      </div>

      <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-900 dark:text-amber-200">
        {copy.sharedNote}
      </p>

      {domainAvailable ? (
        <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.08] to-transparent p-4">
          <Sparkles className="absolute -right-3 -top-3 h-16 w-16 text-accent/10" aria-hidden="true" />
          <p className="flex items-center gap-2 font-display text-[15px] font-bold tracking-tight text-foreground">
            <Globe className="h-4 w-4 text-accent-strong" aria-hidden="true" />
            {copy.nextTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.nextLead(upToMonthsLabel(maxMonths, language))}</p>
          <Button type="button" variant="outline" onClick={onContinueToDomain} className="mt-3 h-10 w-full rounded-lg bg-background font-semibold sm:w-auto">
            {copy.nextCta}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

export default InstantDemoSuccess;
