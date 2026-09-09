"use client";

import { CheckCircle2, ExternalLink, Mail } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { trialCopy } from "@/lib/trial/copy";
import { localizeNumber } from "@/lib/trial/months";
import type { DomainSubmitResponse } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { TrialTimeline } from "../../shared/TrialTimeline";

/** Final wizard screen: what happens next, with the same timeline the hub shows. */
export function SubmittedScreen({
  result,
  language,
  email,
}: Readonly<{ result: DomainSubmitResponse; language: MarketplaceLanguage; email?: string }>) {
  const copy = trialCopy(language).domain;
  const buying = result.hostingSource === "buy_from_trialvo";
  const title = result.existing ? copy.existingTitle : copy.submittedTitle;
  const lead = result.existing ? copy.existingLead : buying ? copy.submittedBuyLead : copy.submittedLead;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{lead}</p>
        {!buying && result.slaHours ? (
          <p className="mt-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {copy.slaLine(localizeNumber(result.slaHours, language))}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <TrialTimeline
          stage={result.fulfillmentStage ?? "received"}
          hostingSource={result.hostingSource}
          language={language}
          slaHours={result.slaHours}
        />
      </div>

      {email ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {language === "bn" ? "আপডেট পাবেন" : "Updates go to"} <strong className="text-foreground">{email}</strong>
          </span>
        </p>
      ) : null}

      <Button asChild className="h-11 w-full rounded-lg font-semibold">
        <LocalizedLink href={`/trial-status/${result.statusToken}`}>
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          {copy.viewStatus}
        </LocalizedLink>
      </Button>
    </motion.div>
  );
}

export default SubmittedScreen;
