import React from 'react';
import {
  Clock, CheckCircle2, XCircle, Snowflake, Loader2, Trash2, AlertTriangle, Ban, Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  icon: React.ReactNode;
  /** Optional extra classes for statuses the badge variants don't cover well. */
  className?: string;
}

const ICON = 'w-3.5 h-3.5';

// Covers both trial_requests and trial_instances statuses so every table/badge
// in the admin surfaces status with an icon + text (never colour alone — a11y).
const STATUS_MAP: Record<string, StatusMeta> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className={ICON} /> },
  approved: { label: 'Approved', variant: 'default', icon: <CheckCircle2 className={ICON} /> },
  // Option 2: approved, waiting for customer to install agent & register
  provisioning: {
    label: 'Awaiting install',
    variant: 'outline',
    icon: <Package className={ICON} />,
    className: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10',
  },
  active: { label: 'Active', variant: 'default', icon: <CheckCircle2 className={ICON} /> },
  frozen: {
    label: 'Frozen',
    variant: 'outline',
    icon: <Snowflake className={ICON} />,
    className: 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10',
  },
  expired: {
    label: 'Expired',
    variant: 'outline',
    icon: <AlertTriangle className={ICON} />,
    className: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  rejected: { label: 'Rejected', variant: 'destructive', icon: <XCircle className={ICON} /> },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: <Ban className={ICON} /> },
  destroying: {
    label: 'Destroying',
    variant: 'outline',
    icon: <Loader2 className={`${ICON} animate-spin`} />,
    className: 'border-destructive/30 text-destructive bg-destructive/10',
  },
  destroyed: { label: 'Destroyed', variant: 'destructive', icon: <Trash2 className={ICON} /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <AlertTriangle className={ICON} /> },
};

/**
 * Consistent status pill for trial requests and instances.
 * Always renders an icon alongside the label for accessibility.
 */
export function TrialStatusBadge({ status, className }: { status: string; className?: string }) {
  const key = String(status || '').toLowerCase();
  const meta: StatusMeta = STATUS_MAP[key] || {
    label: status || 'Unknown',
    variant: 'outline',
    icon: <Clock className={ICON} />,
  };

  return (
    <Badge
      variant={meta.variant}
      className={`inline-flex items-center gap-1 capitalize ${meta.className || ''} ${className || ''}`.trim()}
    >
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

export default TrialStatusBadge;
