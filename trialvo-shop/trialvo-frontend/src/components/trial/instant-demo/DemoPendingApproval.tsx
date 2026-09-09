"use client";

import { Clock, ExternalLink, Mail } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { trialCopy } from "@/lib/trial/copy";
import type { DemoSubmitResponse } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";

/**
 * Instant demo when auto-approve is off: the request is filed, credentials
 * arrive by email after an admin signs off.
 */
export function DemoPendingApproval({
  result,
  language,
  email,
}: Readonly<{ result: DemoSubmitResponse; language: MarketplaceLanguage; email?: string }>) {
  const copy = trialCopy(language).demo;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25">
          <Clock className="h-7 w-7" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">{copy.awaitingTitle}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{copy.awaitingLead}</p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{copy.awaitingHint}</p>
      </div>

      {email ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {copy.awaitingAt(email)}
          </span>
        </p>
      ) : result.message ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{result.message}</span>
        </p>
      ) : null}

      <Button asChild className="h-11 w-full rounded-lg font-semibold">
        <LocalizedLink href={`/trial-status/${result.statusToken}`}>
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          {copy.openAccessPage}
        </LocalizedLink>
      </Button>
    </motion.div>
  );
}

export default DemoPendingApproval;
