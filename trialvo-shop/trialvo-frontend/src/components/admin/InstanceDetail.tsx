import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Snowflake, Sun, HardDrive, RotateCcw, Trash2, Key, Package, Loader2, Download,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { TrialInstanceRow } from '@/hooks/useTrialInstances';
import { TrialStatusBadge } from '@/components/admin/TrialStatusBadge';

interface InstanceEvent {
  id: string;
  event_type: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

interface InstanceDetailProps {
  instance: TrialInstanceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFreeze: (id: string) => void;
  onUnfreeze: (id: string) => void;
  onExtend: (id: string) => void;
  onBackup: (id: string) => void;
  onRestore: (id: string) => void;
  onExport?: (id: string) => void;
  onDestroy: (id: string) => void;
  onCreds: (id: string) => void;
  onInstaller?: (id: string) => void;
  busy?: boolean;
}

export function InstanceDetail({
  instance, open, onOpenChange,
  onFreeze, onUnfreeze, onExtend, onBackup, onRestore, onExport, onDestroy, onCreds, onInstaller,
  busy,
}: InstanceDetailProps) {
  const id = instance?.id;
  const { data: events, isLoading } = useQuery({
    queryKey: ['instanceEvents', id],
    queryFn: () => api.get<InstanceEvent[]>(`/admin/trial-instances/${id}/events`),
    enabled: open && !!id,
    refetchInterval: open ? 15_000 : false,
  });

  if (!instance) return null;

  const canDestroy = !['destroyed', 'destroying'].includes(instance.status);
  const isSharedDemo = Boolean(instance.meta?.sharedDemo);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{instance.install_id.slice(0, 16)}…</SheetTitle>
          <SheetDescription>
            {instance.product_name?.en || instance.product_slug} · {instance.trial_type === 'hosted' ? 'Option 1' : 'Option 2'}
            {isSharedDemo && (
              <> · <Badge variant="outline" className="align-middle text-[10px]">Shared demo</Badge></>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {(instance.customer_name || instance.request_email || instance.admin_email) && (
            <p className="text-sm">
              <span className="text-muted-foreground">Customer: </span>
              {instance.customer_name || '—'}
              {(instance.request_email || instance.admin_email) && (
                <span className="text-muted-foreground"> · {instance.request_email || instance.admin_email}</span>
              )}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="Status"><TrialStatusBadge status={instance.status} /></Info>
            <Info label="Agent">{isSharedDemo ? 'n/a (shared)' : (instance.agent_version || '—')}</Info>
            <Info label="Domain">{instance.domain || instance.subdomain || '—'}</Info>
            <Info label="Expires">
              {instance.expires_at ? new Date(instance.expires_at).toLocaleString() : '—'}
            </Info>
            <Info label="Heartbeat">
              {instance.last_heartbeat_at ? new Date(instance.last_heartbeat_at).toLocaleString() : 'Never'}
            </Info>
            <Info label="Created">{new Date(instance.created_at).toLocaleString()}</Info>
          </div>

          {(instance.shop_url || instance.admin_url) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {instance.shop_url && (
                <a className="underline text-primary" href={instance.shop_url} target="_blank" rel="noreferrer">Shop</a>
              )}
              {instance.admin_url && (
                <a className="underline text-primary" href={instance.admin_url} target="_blank" rel="noreferrer">Admin</a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={() => onCreds(instance.id)}><Key className="w-3.5 h-3.5 mr-1" />Creds</Button>
            {instance.trial_type === 'self_hosted' && onInstaller && (
              <Button size="sm" variant="outline" onClick={() => onInstaller(instance.id)}><Package className="w-3.5 h-3.5 mr-1" />Installer</Button>
            )}
            {!isSharedDemo && (
              <>
                <Button size="sm" variant="outline" onClick={() => onBackup(instance.id)}><HardDrive className="w-3.5 h-3.5 mr-1" />Backup</Button>
                <Button size="sm" variant="outline" onClick={() => onRestore(instance.id)}><RotateCcw className="w-3.5 h-3.5 mr-1" />Restore</Button>
                {onExport && (
                  <Button size="sm" variant="outline" onClick={() => onExport(instance.id)}><Download className="w-3.5 h-3.5 mr-1" />Export ZIP</Button>
                )}
              </>
            )}
            {instance.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => onFreeze(instance.id)}><Snowflake className="w-3.5 h-3.5 mr-1" />{isSharedDemo ? 'Revoke login' : 'Freeze'}</Button>
            )}
            {(instance.status === 'frozen' || instance.status === 'expired') && (
              <Button size="sm" variant="outline" onClick={() => onUnfreeze(instance.id)}><Sun className="w-3.5 h-3.5 mr-1" />{isSharedDemo ? 'Restore login' : 'Unfreeze'}</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onExtend(instance.id)}>+7d</Button>
            {canDestroy && (
              <Button size="sm" variant="destructive" onClick={() => onDestroy(instance.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {isSharedDemo ? 'Revoke access' : 'Destroy'}
              </Button>
            )}
            {busy && <Loader2 className="w-4 h-4 animate-spin self-center" />}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Event timeline</h3>
            {isLoading ? <Skeleton className="h-32" /> : (
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto text-xs border rounded-lg p-2">
                {(events || []).length === 0 && (
                  <li className="text-muted-foreground p-2">No events yet</li>
                )}
                {(events || []).map((ev) => (
                  <li key={ev.id} className="border-b border-border/50 last:border-0 py-2 px-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{ev.event_type}</span>
                      <time className="text-muted-foreground shrink-0">
                        {new Date(ev.created_at).toLocaleString()}
                      </time>
                    </div>
                    {ev.payload && (
                      <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(ev.payload)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate">{children}</div>
    </div>
  );
}

export default InstanceDetail;
