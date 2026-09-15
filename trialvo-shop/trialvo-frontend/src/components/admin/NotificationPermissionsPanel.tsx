"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Loader2, Mail, Save, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { QueryError } from '@/components/admin/QueryError';
import {
  useNotificationPermissions,
  useSaveAdminPermissions,
  useSaveGlobalPermissions,
} from '@/hooks/admin/useNotificationPermissions';
import {
  NOTIFY_EVENT_LABELS,
  NOTIFY_EVENTS,
  cloneMatrix,
  emptyMatrix,
  roleLabel,
  type AdminWithPermissions,
  type NotifyChannel,
  type NotifyEvent,
  type PermissionMatrix,
} from '@/lib/adminStaffApi';

type AdminRow = AdminWithPermissions & { dirty: boolean };

function roleBadgeClass(role: string): string {
  if (role === 'super_admin') return 'admin-badge admin-badge-active';
  if (role === 'admin') return 'admin-badge admin-badge-confirmed';
  return 'admin-badge admin-badge-pending';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

const NotificationPermissionsPanel: React.FC = () => {
  const { toast } = useToast();
  const { adminProfile } = useAuth();
  const { data, isLoading, isError, error, refetch } = useNotificationPermissions();
  const saveGlobal = useSaveGlobalPermissions();
  const saveAdmin = useSaveAdminPermissions();

  const [globalDraft, setGlobalDraft] = useState<PermissionMatrix>(emptyMatrix());
  const [globalDirty, setGlobalDirty] = useState(false);
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const activeAdmins = data.admins.filter((admin) => admin.is_active !== false);
    if (!globalDirty) setGlobalDraft(cloneMatrix(data.global));
    setRows((prev) => {
      if (prev.length === 0) {
        return activeAdmins.map((admin) => ({
          ...admin,
          permissions: cloneMatrix(admin.permissions),
          dirty: false,
        }));
      }
      // Keep unsaved row edits when the query refetches after another save.
      return activeAdmins.map((admin) => {
        const existing = prev.find((row) => row.id === admin.id);
        if (existing?.dirty) return existing;
        return {
          ...admin,
          permissions: cloneMatrix(admin.permissions),
          dirty: false,
        };
      });
    });
  }, [data, globalDirty]);

  const toggleGlobal = (event: NotifyEvent, channel: NotifyChannel) => {
    setGlobalDraft((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
    setGlobalDirty(true);
  };

  const handleSaveGlobal = async () => {
    try {
      await saveGlobal.mutateAsync(globalDraft);
      setGlobalDirty(false);
      toast({ title: 'Global channel settings saved' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save global settings';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const toggleAdmin = (adminId: string, event: NotifyEvent, channel: NotifyChannel) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== adminId) return row;
        // Other super-admins can only edit their own notification matrix.
        if (row.role === 'super_admin' && row.id !== adminProfile?.id) return row;
        const permissions = cloneMatrix(row.permissions);
        permissions[event] = { ...permissions[event], [channel]: !permissions[event][channel] };
        return { ...row, permissions, dirty: true };
      }),
    );
  };

  const handleSaveRow = async (row: AdminRow) => {
    if (row.role === 'super_admin' && row.id !== adminProfile?.id) return;
    setSavingId(row.id);
    try {
      await saveAdmin.mutateAsync({ adminId: row.id, permissions: row.permissions });
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, dirty: false } : item)),
      );
      toast({ title: `Permissions saved for ${row.full_name}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save permissions';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <QueryError error={error} onRetry={() => refetch()} what="notification permissions" />;
  }

  const savedGlobal = data.global;

  return (
    <div className="space-y-5">
      <div className="admin-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 border-b border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Global Channel Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Master on/off for each event. Per-admin toggles only send when the matching
                global channel is active.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveGlobal}
            disabled={!globalDirty || saveGlobal.isPending}
            className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm"
          >
            {saveGlobal.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Save global
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="admin-table-header">
                <th>Event</th>
                <th className="text-center">Email</th>
                <th className="text-center">SMS</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFY_EVENTS.map((event) => (
                <tr key={event} className="admin-table-row">
                  <td className="text-sm font-medium text-foreground">
                    {NOTIFY_EVENT_LABELS[event]}
                  </td>
                  {(['email', 'sms'] as const).map((channel) => (
                    <td key={channel} className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={globalDraft[event][channel]}
                          onCheckedChange={() => toggleGlobal(event, channel)}
                          aria-label={`${NOTIFY_EVENT_LABELS[event]} ${channel}`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Global Channel Status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Saved system flags. Unsaved draft changes above are not reflected here yet.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="admin-table-header">
                <th>Channel</th>
                {NOTIFY_EVENTS.map((event) => (
                  <th key={event} className="text-center">
                    {NOTIFY_EVENT_LABELS[event]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['email', 'sms'] as const).map((channel) => (
                <tr key={channel} className="admin-table-row">
                  <td>
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      {channel === 'email' ? (
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {channel === 'email' ? 'Email' : 'SMS'}
                    </span>
                  </td>
                  {NOTIFY_EVENTS.map((event) => {
                    const on = savedGlobal[event][channel];
                    return (
                      <td key={event} className="text-center">
                        <span
                          className={`admin-badge ${on ? 'admin-badge-active' : 'admin-badge-inactive'}`}
                        >
                          {on ? 'Active' : 'Off'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Admin Notification Permissions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per-admin Email and SMS for each event. Save each row after you change it.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No admin accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="w-56">Admin</th>
                  {NOTIFY_EVENTS.map((event, i) => (
                    <th
                      key={event}
                      colSpan={2}
                      className={`text-center ${i > 0 ? 'border-l border-border/60' : ''}`}
                    >
                      {NOTIFY_EVENT_LABELS[event]}
                    </th>
                  ))}
                  <th className="w-20 text-center">Save</th>
                </tr>
                <tr className="admin-table-header">
                  <th />
                  {NOTIFY_EVENTS.flatMap((event, i) =>
                    (['Email', 'SMS'] as const).map((label, j) => (
                      <th
                        key={`${event}-${label}`}
                        className={`text-center normal-case tracking-normal ${
                          j === 0 && i > 0 ? 'border-l border-border/60' : ''
                        }`}
                      >
                        {label}
                      </th>
                    )),
                  )}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const locked = row.role === 'super_admin' && row.id !== adminProfile?.id;
                  return (
                    <tr key={row.id} className="admin-table-row">
                      <td>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                            {initials(row.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {row.full_name}
                            </p>
                            {locked && (
                              <p className="text-[10px] text-muted-foreground">Self only</p>
                            )}
                            <p className="truncate text-[11px] text-muted-foreground">{row.email}</p>
                            <Badge variant="outline" className={`mt-1 ${roleBadgeClass(row.role)}`}>
                              {roleLabel(row.role)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      {NOTIFY_EVENTS.flatMap((event, i) =>
                        (['email', 'sms'] as const).map((channel, j) => {
                          const on = row.permissions[event][channel];
                          const globallyOff = !savedGlobal[event][channel];
                          return (
                            <td
                              key={`${row.id}-${event}-${channel}`}
                              className={`text-center ${j === 0 && i > 0 ? 'border-l border-border/40' : ''}`}
                            >
                              <div className="flex justify-center">
                                <Switch
                                  checked={on}
                                  disabled={locked}
                                  onCheckedChange={() => toggleAdmin(row.id, event, channel)}
                                  aria-label={`${row.full_name} ${NOTIFY_EVENT_LABELS[event]} ${channel}`}
                                  title={
                                    locked
                                      ? 'Self only'
                                      : globallyOff
                                        ? 'This channel is globally off — the toggle is stored but will not send'
                                        : undefined
                                  }
                                  className={globallyOff || locked ? 'opacity-60' : undefined}
                                />
                              </div>
                            </td>
                          );
                        }),
                      )}
                      <td className="text-center">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleSaveRow(row)}
                          disabled={locked || !row.dirty || savingId === row.id}
                          title={locked ? 'Self only' : row.dirty ? 'Save changes' : 'No changes'}
                          className={`h-8 w-8 ${
                            row.dirty && !locked
                              ? 'border-primary/30 text-primary hover:bg-primary/5'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {savingId === row.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPermissionsPanel;
