"use client";

import { Fragment, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  RotateCcw,
  Rocket,
  Server,
  X,
  Zap,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTrialRequestMutations, type TrialRequestRow } from "@/hooks/useTrialRequests";
import { formatDate } from "@/lib/trial/months";
import { cn } from "@/lib/utils";
import { FulfillDialog } from "./FulfillDialog";
import { StageBadge } from "./StageBadge";

function ageLabel(hours: number | undefined) {
  if (hours === undefined || hours === null) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Own-domain fulfilment queue. Primary path: Approve → installer ZIP →
 * customer runs it → agent register marks LIVE. Mark live is a manual
 * escape hatch only (legacy hosting_pending or staff override).
 */
export function DomainTrialQueue({
  rows,
  loading,
  slaHours,
}: Readonly<{ rows: TrialRequestRow[]; loading: boolean; slaHours: number }>) {
  const { toast } = useToast();
  const { approve, reopen, reject } = useTrialRequestMutations();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fulfillTarget, setFulfillTarget] = useState<TrialRequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TrialRequestRow | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast({ title: label });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  if (loading) return <Skeleton className="m-4 h-40" />;
  if (rows.length === 0) {
    return (
      <div className="admin-empty">
        <Globe />
        <p>No own-domain requests match this filter</p>
      </div>
    );
  }

  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="admin-table-header">
            <th>Customer</th>
            <th>Product</th>
            <th>Hosting</th>
            <th>Months</th>
            <th>Stage</th>
            <th>Age</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const stage = r.fulfillment_stage || "received";
            const open = expanded === r.id;
            const overdue = ["received", "hosting_pending", "deploying"].includes(stage) && (r.age_hours ?? 0) >= slaHours;
            const busy = approve.isPending || reopen.isPending || reject.isPending;
            return (
              <Fragment key={r.id}>
                <tr className={cn("admin-table-row", open && "bg-muted/30")}>
                  <td>
                    <button type="button" onClick={() => setExpanded(open ? null : r.id)} className="flex items-start gap-2 text-left">
                      {open ? <ChevronUp className="mt-1 h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="mt-1 h-3.5 w-3.5 text-muted-foreground" />}
                      <span>
                        <span className="block text-sm font-medium">{r.customer_name}</span>
                        <span className="block text-xs text-muted-foreground">{r.email}</span>
                        {r.source_request_id ? (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
                            <Zap className="h-3 w-3" aria-hidden="true" /> from demo
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </td>
                  <td className="text-sm">{r.product_name?.en || r.product_slug}</td>
                  <td className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      {r.host_kind ? <span className="rounded bg-muted px-1.5 py-0.5 font-mono uppercase">{r.host_kind}</span> : "—"}
                    </span>
                    {r.desired_domain ? <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{r.desired_domain}</span> : null}
                  </td>
                  <td className="text-xs">{r.requested_months ?? "—"}</td>
                  <td>
                    <StageBadge stage={stage} />
                    {r.assigned_admin_name ? <span className="mt-1 block text-[10px] text-muted-foreground">{r.assigned_admin_name}</span> : null}
                  </td>
                  <td className={cn("text-xs", overdue && "font-semibold text-amber-600 dark:text-amber-400")}>
                    <span className="inline-flex items-center gap-1">
                      {overdue ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {ageLabel(r.age_hours)}
                    </span>
                  </td>
                  <td className="space-x-1 whitespace-nowrap text-right">
                    {stage === "received" && !r.instance_id ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => run("Installer issued — customer can download from their status page", () => approve.mutateAsync({ id: r.id }))}
                      >
                        <Check className="mr-1 h-3 w-3" /> Approve & issue installer
                      </Button>
                    ) : null}
                    {stage === "received" && r.instance_id ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/admin/trial-instances?instance=${r.instance_id}`}>
                          <ExternalLink className="mr-1 h-3 w-3" /> Instance
                        </a>
                      </Button>
                    ) : null}
                    {stage === "hosting_pending" ? (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => setFulfillTarget(r)}>
                          <Rocket className="mr-1 h-3 w-3" /> Mark live
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} aria-label="Reopen" onClick={() => run("Reopened", () => reopen.mutateAsync({ id: r.id }))}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </>
                    ) : null}
                    {stage === "deploying" ? (
                      <>
                        {r.instance_id ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={`/admin/trial-instances?instance=${r.instance_id}`}>
                              <ExternalLink className="mr-1 h-3 w-3" /> Instance
                            </a>
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setFulfillTarget(r)}>
                          <Rocket className="mr-1 h-3 w-3" /> Mark live manually
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} aria-label="Reopen" onClick={() => run("Reopened", () => reopen.mutateAsync({ id: r.id }))}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </>
                    ) : null}
                    {["received", "hosting_pending", "deploying"].includes(stage) ? (
                      <Button size="sm" variant="destructive" disabled={busy} aria-label="Reject" onClick={() => setRejectTarget(r)}>
                        <X className="h-3 w-3" />
                      </Button>
                    ) : null}
                    {r.instance_id && ["live", "expiring", "expired", "converted"].includes(stage) ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/admin/trial-instances?instance=${r.instance_id}`}>
                          <ExternalLink className="mr-1 h-3 w-3" /> Instance
                        </a>
                      </Button>
                    ) : null}
                  </td>
                </tr>
                {open ? (
                  <tr className="bg-muted/30">
                    <td colSpan={7} className="px-4 pb-4 pt-1">
                      <RequestDetails row={r} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <FulfillDialog request={fulfillTarget} onOpenChange={(o) => !o && setFulfillTarget(null)} />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Reject own-domain request"
        destructive
        confirmLabel="Reject"
        busy={reject.isPending}
        onConfirm={async () => {
          if (!rejectTarget) return;
          await run("Rejected", () => reject.mutateAsync({ id: rejectTarget.id, reason: "Not approved at this time" }));
          setRejectTarget(null);
        }}
        description="The customer sees this as not approved on their status page. Their demo (if any) keeps running."
      />
    </>
  );
}

function RequestDetails({ row }: Readonly<{ row: TrialRequestRow }>) {
  const history = Array.isArray(row.stage_history) ? row.stage_history : [];
  return (
    <div className="grid gap-4 text-xs md:grid-cols-3">
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
        <p>{row.phone || "—"}</p>
        <p>{row.company || "—"}</p>
        <p className="text-muted-foreground">Requested {formatDate(row.created_at, "en")}</p>
        {row.source_demo_started_at ? <p className="text-muted-foreground">Demo since {formatDate(row.source_demo_started_at, "en")}</p> : null}
      </div>
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
        <p className="whitespace-pre-wrap">{row.use_case || "—"}</p>
        {row.admin_notes ? <p className="whitespace-pre-wrap text-muted-foreground">Staff: {row.admin_notes}</p> : null}
      </div>
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-wide text-muted-foreground">History</p>
        {history.length === 0 ? <p>—</p> : null}
        <ol className="space-y-1">
          {history.map((h, i) => (
            <li key={`${h.stage}-${i}`} className="flex items-center gap-2">
              <StageBadge stage={h.stage} className="py-0 text-[10px]" />
              <span className="text-muted-foreground">{formatDate(h.at, "en")}{h.note ? ` · ${h.note}` : ""}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default DomainTrialQueue;
