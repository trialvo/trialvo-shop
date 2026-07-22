import React, { useState } from 'react';
import { Check, X, Loader2, ClipboardList, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAdminTrialRequests, useTrialRequestMutations } from '@/hooks/useTrialRequests';
import { useTrialSettings, defaultDaysForType } from '@/hooks/useTrialSettings';
import { TrialStatusBadge } from '@/components/admin/TrialStatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { QueryError } from '@/components/admin/QueryError';

const AdminTrialRequestsPage: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminTrialRequests();
  const { data: trialSettings } = useTrialSettings();
  const { approve, reject } = useTrialRequestMutations();
  const [filter, setFilter] = useState('pending');
  const [approveTarget, setApproveTarget] = useState<{ id: string; trialType: string } | null>(null);
  const [approveDays, setApproveDays] = useState(14);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const rows = data?.filter((r) => filter === 'all' || r.status === filter) || [];

  const openApprove = (id: string, trialType: string) => {
    setApproveTarget({ id, trialType });
    setApproveDays(defaultDaysForType(trialSettings, trialType));
  };

  const onApprove = async () => {
    if (!approveTarget) return;
    try {
      await approve.mutateAsync({ id: approveTarget.id, days: approveDays });
      toast({ title: 'Approved & provisioned', description: `Trial period: ${approveDays} days` });
      setApproveTarget(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const onReject = async () => {
    if (!rejectTarget) return;
    try {
      await reject.mutateAsync({ id: rejectTarget, reason: 'Not approved at this time' });
      toast({ title: 'Rejected' });
      setRejectTarget(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const typeLabel = (t: string) => (t === 'hosted' ? 'Option 1 (Hosted)' : 'Option 2 (Self-hosted)');

  return (
    <div className="space-y-5">
      <div className="admin-page-header">
        <h1>Trial Requests</h1>
        <p>Approve or reject customer trial requests</p>
      </div>

      {trialSettings && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <Clock className="w-3.5 h-3.5" />
            Option 1 default: {trialSettings.hostedDays}d
            {trialSettings.autoApproveHosted && ' · auto-approve ON'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            Option 2 default: {trialSettings.selfHostedDays}d
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {['pending', 'active', 'rejected', 'all'].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      {isError && (
        <QueryError what="trial requests" error={error} onRetry={() => refetch()} className="m-1" />
      )}

      <div className="admin-card overflow-x-auto">
        {isLoading ? <Skeleton className="h-40 m-4" /> : (
          <table className="w-full">
            <thead>
              <tr className="admin-table-header">
                <th>Customer</th><th>Product</th><th>Type</th><th>Days</th><th>Status</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="admin-table-row">
                  <td>
                    <div className="text-sm font-medium">{r.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td>{r.product_name?.en || r.product_slug}</td>
                  <td className="text-xs">{typeLabel(r.trial_type)}</td>
                  <td className="text-xs">{r.requested_days}d</td>
                  <td><TrialStatusBadge status={r.status} /></td>
                  <td className="text-right space-x-1">
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => openApprove(r.id, r.trial_type)} disabled={approve.isPending}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectTarget(r.id)} disabled={reject.isPending} aria-label="Reject request">
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="admin-empty"><ClipboardList /><p>No requests</p></div>
        )}
      </div>

      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve trial request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {approveTarget?.trialType === 'hosted'
                ? 'Option 1 — Trialvo will host this trial on our infrastructure.'
                : 'Option 2 — Customer installs on their own domain.'}
            </p>
            <div className="space-y-1.5">
              <Label>Trial period (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={approveDays}
                onChange={(e) => setApproveDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <p className="text-[11px] text-muted-foreground">
                Default for this option: {defaultDaysForType(trialSettings, approveTarget?.trialType || 'hosted')} days
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button onClick={onApprove} disabled={approve.isPending}>
              {approve.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve & provision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject trial request"
        destructive
        confirmLabel="Reject"
        busy={reject.isPending}
        onConfirm={onReject}
        description="The customer will see this request as not approved. You can still approve a future request from them."
      />
    </div>
  );
};

export default AdminTrialRequestsPage;
