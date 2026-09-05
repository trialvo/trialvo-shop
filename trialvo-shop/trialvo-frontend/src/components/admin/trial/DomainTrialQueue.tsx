"use client";

import { Fragment, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Hand,
  Loader2,
  RotateCcw,
  Rocket,
  Server,
  X,
  Zap,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTrialRequestMutations, type TrialRequestRow } from "@/hooks/useTrialRequests";
import type { HostKind } from "@/lib/trial/types";
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
 * Own-domain fulfilment queue. Each row exposes exactly the action that moves
 * the request to its next stage, so staff never have to remember the pipeline.
 */
export function DomainTrialQueue({
  rows,
  loading,
  slaHours,
}: Readonly<{ rows: TrialRequestRow[]; loading: boolean; slaHours: number }>) {
  const { toast } = useToast();
  const { pickup, confirmHosting, reopen, reject } = useTrialRequestMutations();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fulfillTarget, setFulfillTarget] = useState<TrialRequestRow | null>(null);
  const [hostingTarget, setHostingTarget] = useState<TrialRequestRow | null>(null);
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
            const busy = pickup.isPending || confirmHosting.isPending || reopen.isPending || reject.isPending;
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
                      {r.hosting_source === "buy_from_trialvo" ? "Buy from Trialvo" : "Own"}
                      {r.host_kind ? <span className="rounded bg-muted px-1.5 py-0.5 font-mono uppercase">{r.host_kind}</span> : null}
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
                    {stage === "received" ? (
                      <Button size="sm" disabled={busy} onClick={() => run("Picked up", () => pickup.mutateAsync({ id: r.id }))}>
                        <Hand className="mr-1 h-3 w-3" /> Pick up
                      </Button>
                    ) : null}
                    {stage === "hosting_pending" ? (
                      <Button size="sm" disabled={busy} onClick={() => setHostingTarget(r)}>
                        <Server className="mr-1 h-3 w-3" /> Hosting ready
                      </Button>
                    ) : null}
                    {stage === "deploying" ? (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => setFulfillTarget(r)}>
                          <Rocket className="mr-1 h-3 w-3" /> Mark live
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

      <HostingConfirmDialog
        request={hostingTarget}
        busy={confirmHosting.isPending}
        onOpenChange={(o) => !o && setHostingTarget(null)}
        onConfirm={async (hostKind, domain) => {
          if (!hostingTarget) return;
          await run("Hosting confirmed — now deploying", () =>
            confirmHosting.mutateAsync({ id: hostingTarget.id, hostKind, domain: domain || undefined }),
          );
          setHostingTarget(null);
        }}
      />

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

function HostingConfirmDialog({
  request,
  busy,
  onOpenChange,
  onConfirm,
}: Readonly<{
  request: TrialRequestRow | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (hostKind: HostKind, domain: string) => Promise<void>;
}>) {
  const [hostKind, setHostKind] = useState<HostKind>("vps");
  const [domain, setDomain] = useState("");
  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hosting confirmed</DialogTitle>
          <DialogDescription>Record the hosting Trialvo provided for {request?.customer_name}. The request moves to “Deploying”.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Host type</Label>
            <div className="flex gap-2">
              {(["vps", "cpanel"] as HostKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setHostKind(k)}
                  aria-pressed={hostKind === k}
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm font-semibold uppercase",
                    hostKind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hosting-domain">Domain (optional)</Label>
            <Input id="hosting-domain" placeholder={request?.desired_domain || "myshop.com"} value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={() => onConfirm(hostKind, domain.trim())}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DomainTrialQueue;
