"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrialFunnel } from "@/hooks/useTrialRequests";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<string, string> = {
  demo_requested: "Demo requested",
  demo_provisioned: "Demo live",
  domain_requested: "Domain requested",
  domain_live: "Domain live",
  converted: "Purchased",
};

/**
 * Demo → domain → purchase funnel for the last N days. Answers the one
 * question that matters for this product: does the free own-domain trial
 * actually turn demos into sales?
 */
export function TrialFunnelCard({ days = 30, className }: Readonly<{ days?: number; className?: string }>) {
  const { data, isLoading } = useTrialFunnel(days);

  if (isLoading || !data) return <Skeleton className={cn("h-40", className)} />;

  const max = Math.max(1, ...data.steps.map((s) => s.count));

  return (
    <div className={cn("admin-card p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">Trial funnel · last {data.windowDays}d</h3>
        </div>
        {data.domain.overdue > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {data.domain.overdue} overdue
          </span>
        ) : null}
      </div>

      <ol className="space-y-2.5">
        {data.steps.map((s) => (
          <li key={s.id} className="grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-3 text-xs">
            <span className="truncate font-medium text-foreground">{STEP_LABEL[s.id] || s.id}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }} />
            </span>
            <span className="tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{s.count}</span>
              {s.pctOfPrev !== undefined && s.pctOfPrev !== null ? <span className="ml-1">({s.pctOfPrev}%)</span> : null}
            </span>
          </li>
        ))}
      </ol>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
        <Stat label="From demo" value={`${data.domain.fromDemo}/${data.domain.total}`} />
        <Stat label="Buy hosting" value={String(data.domain.buyHosting)} />
        <Stat label="VPS / cPanel" value={`${data.domain.vps} / ${data.domain.cpanel}`} />
        <Stat label="Avg. fulfil" value={data.domain.avgFulfillHours !== null ? `${Math.round(data.domain.avgFulfillHours)}h` : "—"} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export default TrialFunnelCard;
