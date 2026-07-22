import React, { useState } from 'react';
import {
  Snowflake, Sun, Trash2, Key, Loader2, Server, HardDrive, RotateCcw, AlertTriangle, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  useAdminTrialInstances, useTrialInstanceMutations, type TrialInstanceRow,
} from '@/hooks/useTrialInstances';
import { useTrialAnalytics } from '@/hooks/useTrialAnalytics';
import { api } from '@/lib/api';
import { InstanceDetail } from '@/components/admin/InstanceDetail';
import { TrialStatusBadge } from '@/components/admin/TrialStatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { QueryError } from '@/components/admin/QueryError';

const AdminTrialInstancesPage: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminTrialInstances();
  const { data: analytics, isLoading: analyticsLoading } = useTrialAnalytics();
  const { freeze, unfreeze, extend, destroy, credentials, backup, listBackups, restore } = useTrialInstanceMutations();
  const [selected, setSelected] = useState<TrialInstanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [destroyTarget, setDestroyTarget] = useState<string | null>(null);
  const [destroyHard, setDestroyHard] = useState(false);

  const showCreds = async (id: string) => {
    try {
      const c = await credentials.mutateAsync(id);
      toast({ title: 'Credentials', description: `${c.adminEmail} / ${c.adminPassword}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const requestBackup = async (id: string) => {
    try {
      const res = await backup.mutateAsync(id);
      toast({ title: 'Backup queued', description: `Command ${res.commandId?.slice(0, 8)}…` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const restoreLatest = async (id: string) => {
    try {
      const rows = await listBackups.mutateAsync(id);
      const latest = rows.find((b) => b.status === 'completed') || rows[0];
      if (!latest) {
        toast({ title: 'No backups', description: 'Queue a backup first', variant: 'destructive' });
        return;
      }
      await restore.mutateAsync({ id, backupId: latest.id });
      toast({ title: 'Restore queued', description: `Using backup ${latest.id.slice(0, 8)}…` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Opens the in-app confirm dialog (typed confirmation) instead of window.prompt.
  const confirmDestroy = (id: string) => {
    setDestroyHard(false);
    setDestroyTarget(id);
  };

  const runDestroy = async () => {
    if (!destroyTarget) return;
    const mode = destroyHard ? 'hard' : 'soft';
    try {
      await destroy.mutateAsync({ id: destroyTarget, mode });
      toast({ title: 'Destroy queued', description: `Status → destroying (${mode})` });
      setDestroyTarget(null);
      setDrawerOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const downloadInstaller = async (id: string) => {
    try {
      const res = await api.downloadBlob(`/admin/trial-instances/${id}/installer`, 'installer.zip');
      toast({ title: 'Installer downloaded', description: res.filename });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const openDetail = (row: TrialInstanceRow) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="admin-page-header">
        <h1>Trial Instances</h1>
        <p>Monitor and control running trials (freeze, extend, backup, destroy)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {analyticsLoading || !analytics ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <Metric label="Active" value={analytics.instances.active} />
            <Metric label="Frozen" value={analytics.instances.frozen} />
            <Metric label="Pending req" value={analytics.requests.pending} />
            <Metric label="Paid convert" value={analytics.conversion.paidConversions} hint={`${analytics.conversion.conversionRatePct}% rate`} />
            <Metric
              label="Heartbeat OK"
              value={analytics.uptime.healthyPct != null ? `${analytics.uptime.healthyPct}%` : '—'}
              hint={`${analytics.uptime.staleInstances} stale`}
            />
            <Metric label="Expiring ≤3d" value={analytics.alerts.expiringSoon} warn={analytics.alerts.outdatedAgents > 0} hint={analytics.alerts.outdatedAgents ? `${analytics.alerts.outdatedAgents} outdated agents` : undefined} />
          </>
        )}
      </div>

      {isError && (
        <QueryError what="trial instances" error={error} onRetry={() => refetch()} className="m-1" />
      )}

      <div className="admin-card overflow-x-auto">
        {isLoading ? <Skeleton className="h-40 m-4" /> : (
          <table className="w-full">
            <thead>
              <tr className="admin-table-header">
                <th>Install</th><th>Product</th><th>Type</th><th>Status</th><th>Agent</th><th>Expires</th><th>Heartbeat</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((i) => {
                const outdated = Boolean(i.meta?.agent_outdated);
                const canDestroy = !['destroyed', 'destroying'].includes(i.status);
                return (
                  <tr
                    key={i.id}
                    className="admin-table-row cursor-pointer"
                    onClick={() => openDetail(i)}
                  >
                    <td><code className="text-xs">{i.install_id.slice(0, 12)}…</code></td>
                    <td>{i.product_name?.en || i.product_slug}</td>
                    <td>{i.trial_type}</td>
                    <td><TrialStatusBadge status={i.status} /></td>
                    <td className="text-xs">
                      {outdated ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {i.agent_version || 'unknown'}
                        </span>
                      ) : (i.agent_version || '—')}
                    </td>
                    <td className="text-xs">{i.expires_at ? new Date(i.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="text-xs">{i.last_heartbeat_at ? new Date(i.last_heartbeat_at).toLocaleString() : '—'}</td>
                    <td className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => showCreds(i.id)} title="Credentials" aria-label="Show credentials"><Key className="w-4 h-4" /></Button>
                      {i.trial_type === 'self_hosted' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadInstaller(i.id)} title="Download installer" aria-label="Download installer"><Package className="w-4 h-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => requestBackup(i.id)} title="Backup now" aria-label="Backup now" disabled={backup.isPending}><HardDrive className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => restoreLatest(i.id)} title="Restore latest" aria-label="Restore latest backup" disabled={restore.isPending || listBackups.isPending}><RotateCcw className="w-4 h-4" /></Button>
                      {i.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => freeze.mutate(i.id)} title="Freeze" aria-label="Freeze instance"><Snowflake className="w-4 h-4" /></Button>
                      )}
                      {(i.status === 'frozen' || i.status === 'expired') && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => unfreeze.mutate(i.id)} title="Unfreeze" aria-label="Unfreeze instance"><Sun className="w-4 h-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => extend.mutate({ id: i.id, days: 7 })} title="Extend +7d" aria-label="Extend by 7 days">+7</Button>
                      {canDestroy && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => confirmDestroy(i.id)} title="Destroy" aria-label="Destroy instance"><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <div className="admin-empty"><Server /><p>No trial instances yet</p></div>
        )}
        {(freeze.isPending || unfreeze.isPending || backup.isPending || destroy.isPending) && <Loader2 className="animate-spin m-4" />}
      </div>

      <InstanceDetail
        instance={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onFreeze={(id) => freeze.mutate(id)}
        onUnfreeze={(id) => unfreeze.mutate(id)}
        onExtend={(id) => extend.mutate({ id, days: 7 })}
        onBackup={requestBackup}
        onRestore={restoreLatest}
        onDestroy={confirmDestroy}
        onCreds={showCreds}
        onInstaller={downloadInstaller}
        busy={freeze.isPending || unfreeze.isPending || backup.isPending || destroy.isPending}
      />

      <ConfirmDialog
        open={!!destroyTarget}
        onOpenChange={(open) => !open && setDestroyTarget(null)}
        title="Destroy trial instance"
        destructive
        typedConfirmWord="DESTROY"
        confirmLabel={destroyHard ? 'Destroy (hard)' : 'Destroy (soft)'}
        busy={destroy.isPending}
        onConfirm={runDestroy}
        description={
          <span className="space-y-2 block">
            <span className="block">
              The agent takes a mandatory pre-destroy backup first. This cannot be undone.
            </span>
            <label className="flex items-center gap-2 text-xs font-medium text-destructive">
              <input
                type="checkbox"
                checked={destroyHard}
                onChange={(e) => setDestroyHard(e.target.checked)}
                className="rounded border-border"
              />
              Hard destroy (wipe data & volumes, not just freeze)
            </label>
          </span>
        }
      />
    </div>
  );
};

function Metric({
  label, value, hint, warn,
}: { label: string; value: string | number; hint?: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${warn ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'}`}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export default AdminTrialInstancesPage;
