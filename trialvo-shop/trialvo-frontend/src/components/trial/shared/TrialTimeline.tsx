"use client";

import { Check, Clock, Loader2, X } from "lucide-react";
import { trialCopy } from "@/lib/trial/copy";
import { formatDate } from "@/lib/trial/months";
import type { FulfillmentStage, HostingSource, StageHistoryEntry } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/**
 * Vertical progress for the own-domain pipeline. Steps are derived from the
 * hosting source (the "hosting" step only exists when we sell the hosting) and
 * coloured from the current stage, with timestamps from stage_history.
 */
export function TrialTimeline({
  stage,
  history = [],
  hostingSource,
  language,
  slaHours,
  className,
}: Readonly<{
  stage: FulfillmentStage | null | undefined;
  history?: StageHistoryEntry[];
  hostingSource?: HostingSource | null;
  language: MarketplaceLanguage;
  slaHours?: number;
  className?: string;
}>) {
  const copy = trialCopy(language);
  const steps: FulfillmentStage[] = hostingSource === "buy_from_trialvo"
    ? ["received", "hosting_pending", "deploying", "live"]
    : ["received", "deploying", "live"];

  // Terminal outcomes replace the final step so the line still ends somewhere sensible.
  const terminal = stage && ["expiring", "expired", "converted", "rejected"].includes(stage) ? stage : null;
  const visible = terminal ? [...steps.slice(0, -1), "live" as FulfillmentStage, terminal] : steps;

  const current = stage || "received";
  const currentIdx = visible.indexOf(current);
  const rejected = current === "rejected";

  const at = (s: FulfillmentStage) => {
    const entry = [...history].reverse().find((h) => h.stage === s);
    return entry ? formatDate(entry.at, language) : null;
  };

  return (
    <ol className={cn("relative", className)}>
      {visible.map((s, i) => {
        const done = i < currentIdx || (i === currentIdx && ["live", "converted"].includes(s));
        const active = i === currentIdx && !done;
        const isLast = i === visible.length - 1;
        const label = copy.stages[s];
        const when = at(s);
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-0.75rem)] w-0.5 rounded-full",
                  i < currentIdx ? "bg-accent" : "bg-border",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                done && !rejected && "border-accent bg-accent text-accent-foreground",
                active && !rejected && "border-accent text-accent",
                !done && !active && "border-border text-muted-foreground",
                rejected && i === currentIdx && "border-destructive bg-destructive text-destructive-foreground",
              )}
            >
              {rejected && i === currentIdx ? (
                <X className="h-3 w-3" strokeWidth={3} />
              ) : done ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : active ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={cn("font-display text-sm font-bold tracking-tight", active || done ? "text-foreground" : "text-muted-foreground")}>
                  {label.label}
                </span>
                {when ? <span className="text-[11px] text-muted-foreground">{when}</span> : null}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {label.body}
                {active && s === "deploying" && slaHours
                  ? ` ${copy.domain.slaLine(String(slaHours))}.`
                  : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default TrialTimeline;
