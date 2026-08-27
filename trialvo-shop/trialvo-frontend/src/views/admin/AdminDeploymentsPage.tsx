"use client";

import React, { useMemo, useState } from "react";
import {
  Snowflake,
  Sun,
  Trash2,
  Key,
  Loader2,
  HardDrive,
  RotateCcw,
  AlertTriangle,
  Package,
  Download,
  MonitorSmartphone,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  useAdminTrialInstances,
  useDeploymentAnalytics,
  useTrialInstanceMutations,
  type TrialInstanceRow,
} from "@/hooks/useTrialInstances";
import { api } from "@/lib/api";
import { InstanceDetail } from "@/components/admin/InstanceDetail";
import { TrialStatusBadge } from "@/components/admin/TrialStatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QueryError } from "@/components/admin/QueryError";
import { CredentialsDialog, type InstanceCredentials } from "@/components/admin/CredentialsDialog";
import { Input } from "@/components/ui/input";

type KindFilter = "all" | "paid" | "unlicensed" | "conflict" | "stale";

const AdminDeploymentsPage: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminTrialInstances(undefined, "deployments");
  const { data: analytics, isLoading: analyticsLoading } = useDeploymentAnalytics();
  const { freeze, unfreeze, extend, destroy, credentials, backup, listBackups, restore, transferDomain, convertToPaid, reissuePack } =
    useTrialInstanceMutations();

  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [selected, setSelected] = useState<TrialInstanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [destroyTarget, setDestroyTarget] = useState<string | null>(null);
  const [destroyHard, setDestroyHard] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [credsOpen, setCredsOpen] = useState(false);
  const [credsLoading, setCredsLoading] = useState(false);
  const [credsData, setCredsData] = useState<InstanceCredentials | null>(null);
  const [credsInstance, setCredsInstance] = useState<TrialInstanceRow | null>(null);
  const [transferTarget, setTransferTarget] = useState<TrialInstanceRow | null>(null);
  const [transferDomainValue, setTransferDomainValue] = useState("");
  const [convertTarget, setConvertTarget] = useState<TrialInstanceRow | null>(null);
  const [entitlementIdValue, setEntitlementIdValue] = useState("");

  const filtered = useMemo(() => {
    const rows = data || [];
    const now = Date.now();
    return rows.filter((i) => {
      const conflict = Boolean(i.meta?.domain_conflict || i.meta?.alert === "domain_conflict");
      const stale =
        i.last_heartbeat_at &&
        now - new Date(i.last_heartbeat_at).getTime() > 15 * 60 * 1000 &&
        !["destroyed", "destroying"].includes(i.status);
      if (kindFilter === "paid") return i.instance_kind === "paid";
      if (kindFilter === "unlicensed") return i.instance_kind === "unlicensed";
      if (kindFilter === "conflict") return conflict;
      if (kindFilter === "stale") return Boolean(stale);
      return true;
    });
  }, [data, kindFilter]);

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
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCredsLoading(false);
    }
  };

  const requestBackup = async (id: string) => {
    try {
      const res = await backup.mutateAsync(id);
      toast({ title: "Backup queued", description: `Command ${res.commandId?.slice(0, 8)}…` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const restoreLatest = async (id: string) => {
    setRestoreTarget(id);
  };

  const runRestore = async () => {
    if (!restoreTarget) return;
    try {
      const rows = await listBackups.mutateAsync(restoreTarget);
      const latest = rows.find((b) => b.status === "completed") || rows[0];
      if (!latest) {
        toast({ title: "No backups", description: "Queue a backup first", variant: "destructive" });
        setRestoreTarget(null);
        return;
      }
      await restore.mutateAsync({ id: restoreTarget, backupId: latest.id });
      toast({ title: "Restore queued", description: `Using backup ${latest.id.slice(0, 8)}…` });
      setRestoreTarget(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const runConvert = async () => {
    if (!convertTarget || !entitlementIdValue.trim()) return;
    try {
      await convertToPaid.mutateAsync({
        id: convertTarget.id,
        entitlementId: entitlementIdValue.trim(),
      });
      toast({ title: "Converted to paid", description: convertTarget.domain || convertTarget.install_id });
      setConvertTarget(null);
      setEntitlementIdValue("");
    } catch (e: any) {
      toast({ title: "Convert failed", description: e.message, variant: "destructive" });
    }
  };

  const exportLatestMigration = async (id: string) => {
    try {
      const { filename, size } = await api.downloadBlob(
        `/admin/trial-instances/${id}/export-backup`,
        "deployment-migration.zip",
      );
      toast({
        title: "Migration pack downloaded",
        description: `${filename} (${Math.round(size / 1024)} KB)`,
      });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  const downloadPack = async (id: string, format: "docker" | "cpanel") => {
    try {
      const { filename } = await api.downloadBlob(
        `/admin/trial-instances/${id}/pack?format=${format}`,
        `pack-${format}.zip`,
      );
      toast({ title: "Pack downloaded", description: filename });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    }
  };

  const runTransfer = async () => {
    if (!transferTarget || !transferDomainValue.trim()) return;
    try {
      await transferDomain.mutateAsync({
        id: transferTarget.id,
        domain: transferDomainValue.trim(),
      });
      toast({ title: "Domain transferred", description: transferDomainValue.trim() });
      setTransferTarget(null);
      setTransferDomainValue("");
    } catch (e: any) {
      toast({ title: "Transfer failed", description: e.message, variant: "destructive" });
    }
  };

  const confirmDestroy = (id: string) => {
    setDestroyHard(false);
    setDestroyTarget(id);
  };

  const runDestroy = async () => {
    if (!destroyTarget) return;
    const mode = destroyHard ? "hard" : "soft";
    try {
      await destroy.mutateAsync({ id: destroyTarget, mode });
      toast({
        title: "Destroy started",
        description: mode === "hard" ? "Hard destroy queued." : "Soft destroy queued.",
      });
      setDestroyTarget(null);
      setDrawerOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const cards = [
    { label: "Paid active", value: analytics?.paidActive, tone: "text-emerald-400" },
    { label: "Paid frozen", value: analytics?.paidFrozen, tone: "text-sky-300" },
    { label: "Unlicensed", value: analytics?.unlicensed, tone: "text-amber-300" },
    { label: "Domain conflicts", value: analytics?.domainConflicts, tone: "text-rose-300" },
    { label: "Stale heartbeat", value: analytics?.staleHeartbeat, tone: "text-orange-300" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deployments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paid and unlicensed installs only — trial control stays under Trial Instances.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</div>
            <div className={`text-2xl font-semibold mt-1 ${c.tone}`}>
              {analyticsLoading ? <Skeleton className="h-7 w-10" /> : (c.value ?? 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["paid", "Paid"],
            ["unlicensed", "Unlicensed"],
            ["conflict", "Conflicts"],
            ["stale", "Stale"],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={kindFilter === k ? "default" : "outline"}
            onClick={() => setKindFilter(k)}
          >
            {label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isError && <QueryError error={error as Error} onRetry={() => refetch()} />}

      <div className="rounded-xl border border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <MonitorSmartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No deployment instances yet</p>
            <p className="text-xs mt-2 max-w-md mx-auto">
              Paid and unlicensed seats appear here when agents phone home. Copies with the
              license agent removed cannot be detected or controlled remotely.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Kind</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Heartbeat</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const conflict = Boolean(i.meta?.domain_conflict || i.meta?.alert === "domain_conflict");
                  const canDestroy = !["destroyed", "destroying"].includes(i.status);
                  return (
                    <tr
                      key={i.id}
                      className="border-t border-border/40 hover:bg-muted/20 cursor-pointer"
                      onClick={() => {
                        setSelected(i);
                        setDrawerOpen(true);
                      }}
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {i.customer_name || i.entitlement_email || i.admin_email || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {i.install_id?.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={i.instance_kind === "unlicensed" ? "destructive" : "secondary"}>
                          {i.instance_kind || "paid"}
                        </Badge>
                        {conflict && (
                          <Badge variant="outline" className="ml-1 text-rose-300 border-rose-400/40">
                            conflict
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs">{i.domain || "—"}</td>
                      <td className="p-3">
                        <TrialStatusBadge status={i.status} />
                      </td>
                      <td className="p-3 text-xs">
                        {i.last_heartbeat_at ? new Date(i.last_heartbeat_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => showCreds(i.id)} title="Credentials">
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => downloadPack(i.id, "docker")}
                          title="Download Docker pack"
                        >
                          <Package className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => downloadPack(i.id, "cpanel")}
                          title="Download cPanel pack"
                        >
                          <MonitorSmartphone className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => requestBackup(i.id)} title="Backup">
                          <HardDrive className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => restoreLatest(i.id)} title="Restore">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportLatestMigration(i.id)} title="Export ZIP">
                          <Download className="w-4 h-4" />
                        </Button>
                        {i.status === "active" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => freeze.mutate(i.id)} title="Freeze">
                            <Snowflake className="w-4 h-4" />
                          </Button>
                        )}
                        {(i.status === "frozen" || i.status === "expired") && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => unfreeze.mutate(i.id)} title="Unfreeze">
                            <Sun className="w-4 h-4" />
                          </Button>
                        )}
                        {i.instance_kind === "unlicensed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Convert to paid"
                            onClick={() => {
                              setConvertTarget(i);
                              setEntitlementIdValue("");
                            }}
                          >
                            <Key className="w-4 h-4 text-amber-500" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Reissue customer pack link"
                          onClick={() =>
                            reissuePack.mutate(i.id, {
                              onSuccess: (r) =>
                                toast({
                                  title: "Pack link reissued",
                                  description: r.emailed
                                    ? "Emailed to customer"
                                    : r.dockerUrl?.slice(0, 48) + "…",
                                }),
                              onError: (e: Error) =>
                                toast({ title: "Reissue failed", description: e.message, variant: "destructive" }),
                            })
                          }
                        >
                          <RefreshCw className="w-4 h-4 opacity-70" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Transfer domain"
                          onClick={() => {
                            setTransferTarget(i);
                            setTransferDomainValue(i.domain || "");
                          }}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() =>
                            extend.mutate(
                              { id: i.id, days: 7 },
                              {
                                onSuccess: () => toast({ title: "Extended +7 days" }),
                                onError: (e: Error) =>
                                  toast({ title: "Extend failed", description: e.message, variant: "destructive" }),
                              },
                            )
                          }
                        >
                          +7d
                        </Button>
                        {canDestroy && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => confirmDestroy(i.id)}
                            title="Destroy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {conflict && (
                          <span title="Domain conflict">
                            <AlertTriangle className="inline w-4 h-4 text-rose-400" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(freeze.isPending || unfreeze.isPending || backup.isPending || destroy.isPending) && (
          <Loader2 className="animate-spin m-4" />
        )}
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
        onExport={exportLatestMigration}
        onDestroy={confirmDestroy}
        onCreds={showCreds}
        busy={freeze.isPending || unfreeze.isPending || backup.isPending || destroy.isPending}
      />

      <CredentialsDialog
        open={credsOpen}
        onOpenChange={setCredsOpen}
        loading={credsLoading}
        credentials={credsData}
        customerLabel={credsInstance?.domain || credsInstance?.install_id}
      />

      <ConfirmDialog
        open={!!destroyTarget}
        onOpenChange={(open) => !open && setDestroyTarget(null)}
        title="Destroy deployment"
        destructive
        typedConfirmWord="DESTROY"
        confirmLabel={destroyHard ? "Destroy (hard)" : "Destroy (soft)"}
        busy={destroy.isPending}
        onConfirm={runDestroy}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Soft lock keeps data; hard wipe is stronger. A pre-destroy backup is taken first.
          Type DESTROY to confirm.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={destroyHard} onChange={(e) => setDestroyHard(e.target.checked)} />
          Hard destroy
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restore latest backup"
        confirmLabel="Restore"
        busy={restore.isPending || listBackups.isPending}
        onConfirm={runRestore}
      >
        <p className="text-sm text-muted-foreground">
          Queues a restore of the latest completed backup for this deployment. The running stack
          may briefly lock while the agent applies it.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!convertTarget}
        onOpenChange={(open) => !open && setConvertTarget(null)}
        title="Convert unlicensed → paid"
        confirmLabel="Convert"
        busy={convertToPaid.isPending}
        onConfirm={runConvert}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Bind this unlicensed install to an existing entitlement ID (from a paid order).
        </p>
        <Input
          value={entitlementIdValue}
          onChange={(e) => setEntitlementIdValue(e.target.value)}
          placeholder="entitlement UUID"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={!!transferTarget}
        onOpenChange={(open) => !open && setTransferTarget(null)}
        title="Transfer licensed domain"
        confirmLabel="Transfer"
        busy={transferDomain.isPending}
        onConfirm={runTransfer}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Moves the paid seat to a new domain and clears conflict freeze.
        </p>
        <Input
          value={transferDomainValue}
          onChange={(e) => setTransferDomainValue(e.target.value)}
          placeholder="new.example.com"
        />
      </ConfirmDialog>
    </div>
  );
};

export default AdminDeploymentsPage;
