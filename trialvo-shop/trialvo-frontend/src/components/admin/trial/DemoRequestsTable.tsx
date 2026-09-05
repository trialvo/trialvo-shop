"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, X, Zap } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TrialStatusBadge } from "@/components/admin/TrialStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTrialRequestMutations, type TrialRequestRow } from "@/hooks/useTrialRequests";
import { formatDate } from "@/lib/trial/months";

/**
 * Instant demos are provisioned automatically, so this table is mostly
 * read-only. Approve/reject only appear for the rare request that fell back to
 * `pending` (provisioner failure or auto-approve turned off).
 */
export function DemoRequestsTable({
  rows,
  loading,
  demoDays,
}: Readonly<{ rows: TrialRequestRow[]; loading: boolean; demoDays: number }>) {
  const { toast } = useToast();
  const { approve, reject } = useTrialRequestMutations();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const onApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id, days: demoDays });
      toast({ title: "Demo provisioned", description: "Access emailed to the customer." });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  if (loading) return <Skeleton className="m-4 h-40" />;
  if (rows.length === 0) {
    return (
      <div className="admin-empty">
        <Zap />
        <p>No demo requests match this filter</p>
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
            <th>Requested</th>
            <th>Status</th>
            <th>Expires</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="admin-table-row">
              <td>
                <div className="text-sm font-medium">{r.customer_name}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </td>
              <td className="text-sm">{r.product_name?.en || r.product_slug}</td>
              <td className="text-xs text-muted-foreground">{formatDate(r.created_at, "en")}</td>
              <td><TrialStatusBadge status={r.instance_status || r.status} /></td>
              <td className="text-xs text-muted-foreground">{r.instance_expires ? formatDate(r.instance_expires, "en") : "—"}</td>
              <td className="space-x-1 whitespace-nowrap text-right">
                {r.status === "pending" ? (
                  <>
                    <Button size="sm" disabled={approve.isPending} onClick={() => onApprove(r.id)}>
                      {approve.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                      Provision
                    </Button>
                    <Button size="sm" variant="destructive" aria-label="Reject" disabled={reject.isPending} onClick={() => setRejectTarget(r.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : null}
                {r.instance_id ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={`/admin/trial-instances?instance=${r.instance_id}`}>
                      <ExternalLink className="mr-1 h-3 w-3" /> Instance
                    </a>
                  </Button>
                ) : null}
                {r.public_token ? (
                  <Button asChild size="sm" variant="ghost" aria-label="Open customer hub">
                    <a href={`/en/trial-status/${r.public_token}`} target="_blank" rel="noreferrer">Hub</a>
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Reject demo request"
        destructive
        confirmLabel="Reject"
        busy={reject.isPending}
        onConfirm={async () => {
          if (!rejectTarget) return;
          try {
            await reject.mutateAsync({ id: rejectTarget, reason: "Not approved at this time" });
            toast({ title: "Rejected" });
          } catch (e: unknown) {
            toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
          }
          setRejectTarget(null);
        }}
        description="The customer will see this demo as not approved."
      />
    </>
  );
}

export default DemoRequestsTable;
