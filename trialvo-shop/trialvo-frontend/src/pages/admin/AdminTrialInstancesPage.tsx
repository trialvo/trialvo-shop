import React, { useState } from 'react';
import {
  Snowflake, Sun, Trash2, Key, Loader2, Server, HardDrive, RotateCcw, AlertTriangle, Package, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CredentialsDialog, type InstanceCredentials } from '@/components/admin/CredentialsDialog';

const AdminTrialInstancesPage: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminTrialInstances(undefined, "trials");
  const { data: analytics, isLoading: analyticsLoading } = useTrialAnalytics();
  const { freeze, unfreeze, extend, destroy, credentials, backup, listBackups, restore } = useTrialInstanceMutations();
  const [selected, setSelected] = useState<TrialInstanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [destroyTarget, setDestroyTarget] = useState<string | null>(null);
  const [destroyHard, setDestroyHard] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [credsOpen, setCredsOpen] = useState(false);
  const [credsLoading, setCredsLoading] = useState(false);
  const [credsData, setCredsData] = useState<InstanceCredentials | null>(null);
  const [credsInstance, setCredsInstance] = useState<TrialInstanceRow | null>(null);

  const showCreds = async (id: string) => {
    const row = data?.find((x) => x.id === id) || (selected?.id === id ? selected : null);
    setCredsInstance(row || null);
    setCredsData(null);
    setCredsOpen(true);
    setCredsLoading(true);
    try {
      const c = await credentials.mutateAsync(id);
      setCredsData(c);
    } catch (e: any) {
      setCredsOpen(false);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCredsLoading(false);
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
    setRestoreTarget(id);
  };

  const runRestore = async () => {
    if (!restoreTarget) return;
    try {
      const rows = await listBackups.mutateAsync(restoreTarget);
      const latest = rows.find((b) => b.status === 'completed') || rows[0];
      if (!latest) {
        toast({ title: 'No backups', description: 'Queue a backup first', variant: 'destructive' });
        setRestoreTarget(null);
        return;
      }
      await restore.mutateAsync({ id: restoreTarget, backupId: latest.id });
      toast({ title: 'Restore queued', description: `Using backup ${latest.id.slice(0, 8)}…` });
      setRestoreTarget(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  /** Decrypt latest backup → ZIP (database.sql + uploads) for production migrate after purchase. */
  const exportLatestMigration = async (id: string) => {
    try {
      const { filename, size } = await api.downloadBlob(
        `/admin/trial-instances/${id}/export-backup`,
        'trial-migration.zip',
      );
      toast({
        title: 'Migration pack downloaded',
        description: `${filename} (${Math.round(size / 1024)} KB) — gunzip database.sql.gz | mysql … + copy uploads/`,
      });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
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
    const isShared = Boolean(
      (selected?.id === destroyTarget && selected?.meta?.sharedDemo)
      || data?.find((x) => x.id === destroyTarget)?.meta?.sharedDemo
    );
    try {
      await destroy.mutateAsync({ id: destroyTarget, mode });
      toast({
        title: isShared ? 'Access revoked' : 'Destroy started',
        description: isShared
          ? 'Shared demo ADMIN login deactivated. The demo stack stays online.'
          : mode === 'hard'
            ? 'Status → destroying. Teardown runs in the background.'
            : 'Status → destroying. Containers are stopping in the background.',
      });
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
        <p>Access grants &amp; stacks — shared demo revoke, Option 2 agent control</p>
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
                <th>Customer</th><th>Product</th><th>Type</th><th>Status</th><th>Agent</th><th>Expires</th><th>Heartbeat</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((i) => {
                const outdated = Boolean(i.meta?.agent_outdated);
                const canDestroy = !['destroyed', 'destroying'].includes(i.status);
                const isShared = Boolean(i.meta?.sharedDemo);
                return (
                  <tr
                    key={i.id}
                    className="admin-table-row cursor-pointer"
                    onClick={() => openDetail(i)}
                  >
                    <td>
                      <div className="text-sm font-medium">{i.customer_name || i.admin_email || '—'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {(i.request_email || i.admin_email || i.install_id).toString().slice(0, 28)}
                        {(i.request_email || i.admin_email) ? '' : '…'}
                      </div>
                    </td>
                    <td>{i.product_name?.en || i.product_slug}</td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{i.trial_type === 'hosted' ? 'Option 1' : 'Option 2'}</span>
                        {isShared && (
                          <Badge variant="outline" className="w-fit text-[10px]">Shared demo</Badge>
                        )}
                      </div>
                    </td>
                    <td><TrialStatusBadge status={i.status} /></td>
                    <td className="text-xs">
                      {isShared ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : outdated ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {i.agent_version || 'unknown'}
                        </span>
                      ) : (i.agent_version || '—')}
                    </td>
                    <td className="text-xs">{i.expires_at ? new Date(i.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="text-xs">
                      {isShared
                        ? <span className="text-muted-foreground">n/a</span>
                        : (i.last_heartbeat_at ? new Date(i.last_heartbeat_at).toLocaleString() : '—')}
                    </td>
                    <td className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => showCreds(i.id)} title="Credentials" aria-label="Show credentials"><Key className="w-4 h-4" /></Button>
                      {i.trial_type === 'self_hosted' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadInstaller(i.id)} title="Download installer" aria-label="Download installer"><Package className="w-4 h-4" /></Button>
                      )}
                      {!isShared && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => requestBackup(i.id)} title="Backup now" aria-label="Backup now" disabled={backup.isPending}><HardDrive className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => restoreLatest(i.id)} title="Restore latest" aria-label="Restore latest backup" disabled={restore.isPending || listBackups.isPending}><RotateCcw className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportLatestMigration(i.id)} title="Export for production (ZIP)" aria-label="Export migration ZIP"><Download className="w-4 h-4" /></Button>
                        </>
                      )}
                      {i.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => freeze.mutate(i.id)} title={isShared ? 'Revoke login' : 'Freeze'} aria-label="Freeze instance"><Snowflake className="w-4 h-4" /></Button>
                      )}
                      {(i.status === 'frozen' || i.status === 'expired') && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => unfreeze.mutate(i.id)} title={isShared ? 'Restore login' : 'Unfreeze'} aria-label="Unfreeze instance"><Sun className="w-4 h-4" /></Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          extend.mutate(
                            { id: i.id, days: 7 },
                            {
                              onSuccess: () => {
                                toast({
                                  title: 'Extended +7 days',
                                  description: Boolean(i.meta?.sharedDemo)
                                    ? 'Shared demo access reactivated and expiry updated.'
                                    : i.status === 'provisioning'
                                      ? 'Expiry updated in Control Plane. Agent will pick up extend after install/register.'
                                      : 'Expiry updated. Extend command queued for the agent.',
                                });
                              },
                              onError: (e: Error) => {
                                toast({ title: 'Extend failed', description: e.message, variant: 'destructive' });
                              },
                            },
                          );
                        }}
                        title="Extend +7d"
                        aria-label="Extend by 7 days"
                      >
                        +7
                      </Button>
                      {canDestroy && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => confirmDestroy(i.id)} title={isShared ? 'Revoke access' : 'Destroy'} aria-label="Destroy instance"><Trash2 className="w-4 h-4" /></Button>
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
        onExtend={(id) => {
          const row = data?.find((x) => x.id === id);
          extend.mutate(
            { id, days: 7 },
            {
              onSuccess: () => {
                toast({
                  title: 'Extended +7 days',
                  description: Boolean(row?.meta?.sharedDemo)
                    ? 'Shared demo access reactivated and expiry updated.'
                    : row?.status === 'provisioning'
                      ? 'Expiry updated. Agent applies extend after register.'
                      : 'Expiry updated. Extend command queued for the agent.',
                });
              },
              onError: (e: Error) => {
                toast({ title: 'Extend failed', description: e.message, variant: 'destructive' });
              },
            },
          );
        }}
        onBackup={requestBackup}
        onRestore={restoreLatest}
        onExport={exportLatestMigration}
        onDestroy={confirmDestroy}
        onCreds={showCreds}
        onInstaller={downloadInstaller}
        busy={freeze.isPending || unfreeze.isPending || backup.isPending || destroy.isPending}
      />

      <CredentialsDialog
        open={credsOpen}
        onOpenChange={setCredsOpen}
        loading={credsLoading}
        credentials={credsData}
        shopUrl={credsInstance?.shop_url}
        adminUrl={credsInstance?.admin_url}
        customerLabel={credsInstance?.customer_name || credsInstance?.request_email || credsInstance?.admin_email}
        sharedDemo={Boolean(credsInstance?.meta?.sharedDemo)}
      />

      <ConfirmDialog
        open={!!destroyTarget}
        onOpenChange={(open) => !open && setDestroyTarget(null)}
        title={
          Boolean(
            (selected?.id === destroyTarget && selected?.meta?.sharedDemo)
            || data?.find((x) => x.id === destroyTarget)?.meta?.sharedDemo
          )
            ? 'Revoke shared demo access'
            : 'Destroy trial instance'
        }
        destructive
        typedConfirmWord="DESTROY"
        confirmLabel={
          Boolean(
            (selected?.id === destroyTarget && selected?.meta?.sharedDemo)
            || data?.find((x) => x.id === destroyTarget)?.meta?.sharedDemo
          )
            ? 'Revoke access'
            : (destroyHard ? 'Destroy (hard)' : 'Destroy (soft)')
        }
        busy={destroy.isPending}
        onConfirm={runDestroy}
        description={
          <span className="space-y-2 block">
            {Boolean(
              (selected?.id === destroyTarget && selected?.meta?.sharedDemo)
              || data?.find((x) => x.id === destroyTarget)?.meta?.sharedDemo
            ) ? (
              <span className="block">
                Revokes this user’s admin access. Does not shut down the demo.
              </span>
            ) : (
              <>
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
              </>
            )}
          </span>
        }
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restore latest backup"
        confirmLabel="Restore"
        busy={restore.isPending || listBackups.isPending}
        onConfirm={runRestore}
        description="Queues a restore of the latest completed backup. The trial stack may briefly lock while the agent applies it."
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
