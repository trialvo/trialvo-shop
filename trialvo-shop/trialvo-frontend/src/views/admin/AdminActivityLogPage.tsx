"use client";

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueryError } from '@/components/admin/QueryError';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireOpsAdmin } from '@/hooks/admin/useRequireOpsAdmin';
import { useAdminStaff } from '@/hooks/admin/useAdminStaff';
import {
  useAdminActivityActions,
  useAdminActivityLogs,
  useAdminActivityResources,
} from '@/hooks/admin/useAdminActivity';
import type { ActivityActor, ActivityLogItem } from '@/lib/adminActivityApi';

const inputClass =
  'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25';

const ALL = 'all';

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Login',
  'auth.login_failed': 'Login failed',
  'auth.profile_update': 'Profile update',
  'auth.password_change': 'Password change',
  'staff.create': 'Staff create',
  'staff.update': 'Staff update',
  'staff.deactivate': 'Staff deactivate',
  'staff.reset_password': 'Staff reset password',
  'notify.global_update': 'Notify global',
  'notify.admin_update': 'Notify admin',
  'settings.smtp_update': 'SMTP update',
  'settings.sms_update': 'SMS update',
  'settings.sms_test': 'SMS test',
  'settings.trial_update': 'Trial settings',
  'settings.pay_update': 'Pay settings',
  'trial.request_approve': 'Approve request',
  'trial.request_reject': 'Reject request',
  'trial.request_fulfill': 'Fulfill request',
  'trial.instance_freeze': 'Freeze instance',
  'trial.instance_unfreeze': 'Unfreeze instance',
  'trial.instance_extend': 'Extend instance',
  'trial.instance_destroy': 'Destroy instance',
  'trial.instance_mark_live': 'Mark live',
  'trial.installer_issue': 'Issue installer',
  'product.create': 'Product create',
  'product.update': 'Product update',
  'product.delete': 'Product delete',
  'product.bulk': 'Product bulk',
  'order.status_update': 'Order status',
  'message.delete': 'Message delete',
  'category.create': 'Category create',
  'category.update': 'Category update',
  'category.delete': 'Category delete',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function actionBadgeClass(action: string): string {
  if (action.includes('failed') || action.includes('reject') || action.includes('destroy') || action.includes('delete') || action.includes('deactivate')) {
    return 'admin-badge admin-badge-cancelled';
  }
  if (action.includes('create') || action.includes('approve') || action.includes('fulfill') || action.includes('login')) {
    return 'admin-badge admin-badge-completed';
  }
  return 'admin-badge admin-badge-confirmed';
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function actorLabel(actor: { full_name?: string | null; email?: string | null; id?: string | null }): string {
  const name = actor.full_name?.trim();
  const email = actor.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || actor.id || 'Unknown';
}

const emptyDraft = {
  admin_id: ALL,
  action: ALL,
  resource: ALL,
  date_from: '',
  date_to: '',
  search: '',
};

const AdminActivityLogPage: React.FC = () => {
  const { allowed, isLoading: gateLoading } = useRequireOpsAdmin();
  const { adminProfile } = useAuth();
  const isSuper = adminProfile?.role === 'super_admin';

  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filters = useMemo(() => ({
    admin_id: applied.admin_id === ALL ? undefined : applied.admin_id,
    action: applied.action === ALL ? undefined : applied.action,
    resource: applied.resource === ALL ? undefined : applied.resource,
    date_from: applied.date_from || undefined,
    date_to: applied.date_to || undefined,
    search: applied.search.trim() || undefined,
    page,
    limit: 50,
  }), [applied, page]);

  const { data, isLoading, isError, error, refetch } = useAdminActivityLogs(filters);
  const { data: actions } = useAdminActivityActions();
  const { data: resources } = useAdminActivityResources();
  const staffQuery = useAdminStaff({ enabled: isSuper });

  const actors: ActivityActor[] = useMemo(() => {
    const fromLogs = data?.actors || [];
    if (!isSuper || !staffQuery.data) return fromLogs;
    const seen = new Set(fromLogs.map((a) => a.id));
    const extra = staffQuery.data
      .filter((s) => !seen.has(s.id))
      .map((s) => ({
        id: s.id,
        email: s.email,
        full_name: s.full_name,
        role: s.role,
      }));
    return [...fromLogs, ...extra];
  }, [data?.actors, isSuper, staffQuery.data]);

  if (gateLoading || !allowed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = data?.total || 0;
  const limit = data?.limit || 50;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = data?.items || [];

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...draft });
  };

  const resetFilters = () => {
    setDraft(emptyDraft);
    setApplied(emptyDraft);
    setPage(1);
    setExpanded(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="admin-page-header">
        <h1>Activity Log</h1>
        <p>Control-plane mutations by staff — logins, settings, trials, catalog</p>
      </div>

      <div className="admin-card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Admin</Label>
            <Select
              value={draft.admin_id}
              onValueChange={(value) => setDraft((d) => ({ ...d, admin_id: value }))}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="All admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All admins</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actorLabel(actor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Action</Label>
            <Select
              value={draft.action}
              onValueChange={(value) => setDraft((d) => ({ ...d, action: value }))}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All actions</SelectItem>
                {(actions || []).map((key) => (
                  <SelectItem key={key} value={key}>
                    {actionLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Resource</Label>
            <Select
              value={draft.resource}
              onValueChange={(value) => setDraft((d) => ({ ...d, resource: value }))}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All resources</SelectItem>
                {(resources || []).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date from</Label>
            <Input
              type="date"
              className={inputClass}
              value={draft.date_from}
              onChange={(e) => setDraft((d) => ({ ...d, date_from: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date to</Label>
            <Input
              type="date"
              className={inputClass}
              value={draft.date_to}
              onChange={(e) => setDraft((d) => ({ ...d, date_to: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className={`${inputClass} pl-9`}
                placeholder="Summary, email, or action"
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters();
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={applyFilters}
            className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm"
          >
            Apply
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={resetFilters}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="admin-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-5">
            <QueryError error={error} onRetry={() => refetch()} what="activity logs" />
          </div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No activity matches these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="admin-table-header">
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Summary</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((row: ActivityLogItem) => {
                  const open = expanded === row.id;
                  const hasMeta = row.meta && Object.keys(row.meta).length > 0;
                  return (
                    <React.Fragment key={row.id}>
                      <tr className="admin-table-row">
                        <td className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatTime(row.created_at)}
                        </td>
                        <td>
                          {row.admin_id ? (
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {row.admin_name || 'Deleted admin'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {row.admin_email || row.admin_id}
                                {row.admin_role ? ` · ${row.admin_role.replace('_', ' ')}` : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">System / unknown</span>
                          )}
                        </td>
                        <td>
                          <Badge className={actionBadgeClass(row.action)}>
                            {actionLabel(row.action)}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {row.resource || '—'}
                          {row.resource_id ? (
                            <span className="block text-[11px] font-mono truncate max-w-[140px]">
                              {row.resource_id}
                            </span>
                          ) : null}
                        </td>
                        <td className="text-sm text-foreground max-w-[280px]">
                          {row.summary || '—'}
                        </td>
                        <td>
                          {hasMeta && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpanded(open ? null : row.id)}
                              aria-label={open ? 'Hide details' : 'Show details'}
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </td>
                      </tr>
                      {open && hasMeta && (
                        <tr className="bg-muted/40">
                          <td colSpan={6} className="px-4 py-3">
                            <pre className="text-[11px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(row.meta, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {total} event{total === 1 ? '' : 's'} · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLogPage;
