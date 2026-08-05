// src/components/support/SupportDistributionPoolTab.tsx — V2-037
// Reusable "Distribution Pool" tab — works for both Reports and Contact Messages.
// Props adapt it to either domain.

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Users, Settings, RefreshCw, CheckCircle2, Circle, Shuffle,
  ShieldCheck, ListOrdered, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/config/env";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";

// ─── Generic shape that both report + contact eligible-admin types satisfy ── //

export type PoolEligibleAdmin = {
  id: number;
  admin_name: string;
  email: string;
  profile_img_path: string | null;
  role_name: string;
  pool_id: number | null;
  serial: number | null;
  pool_auto_assign: boolean | null;
  // "max" column differs by domain — we unify as maxActive
  max_active_reports?: number | null;
  max_active_messages?: number | null;
  // active load count (domain-specific column name)
  active_report_count?: number;
  active_message_count?: number;
  // unified meaningful counts (new backend columns)
  today_assigned_count?: number;
  today_completed_count?: number;
  total_assigned_count?: number;
};

export type PoolSettingsShape = {
  auto_assign_enabled?: boolean;
  assign_on_create?: boolean;       // assign_on_report_create | assign_on_message_create
  include_admin_role?: boolean;
  include_order_manager_role?: boolean;
};

type Props = {
  domain: "reports" | "contact";
  isSuperAdmin: boolean;
  settings: PoolSettingsShape | null;
  settingsLoading: boolean;
  admins: PoolEligibleAdmin[];
  adminsLoading: boolean;
  onToggleSetting: (key: string, value: boolean) => void;
  settingsPending: boolean;
  onAddToPool: (admin: PoolEligibleAdmin) => Promise<void>;
  onRemoveFromPool: (admin: PoolEligibleAdmin) => Promise<void>;
  onToggleAutoAssign: (admin: PoolEligibleAdmin) => Promise<void>;
  onSaveConfig: (admin: PoolEligibleAdmin, maxVal: string, serialVal: string) => Promise<void>;
  onRedistribute: () => Promise<void>;
  redistributePending: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

function RoleBadge({ role }: { role: string }) {
  const colour =
    role === "ADMIN"
      ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
      : role === "ORDER_MANAGER"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
      : role === "SUPER_ADMIN"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", colour)}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

function LoadPill({ count, label, colour }: { count: number; label: string; colour: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold gap-1", colour)}>
      {count} {label}
    </span>
  );
}

export default function SupportDistributionPoolTab({
  domain,
  isSuperAdmin,
  settings,
  settingsLoading,
  admins,
  adminsLoading,
  onToggleSetting,
  settingsPending,
  onAddToPool,
  onRemoveFromPool,
  onToggleAutoAssign,
  onSaveConfig,
  onRedistribute,
  redistributePending,
}: Props) {
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [maxVal, setMaxVal]         = useState<Record<number, string>>({});
  const [serialVal, setSerialVal]   = useState<Record<number, string>>({});
  const [poolPending, setPoolPending] = useState<Record<number, boolean>>({});

  const isReport  = domain === "reports";
  const entityLabel = isReport ? "Report" : "Message";
  const completedLabel = domain === "reports" ? "resolved today" : "replied today";
  const activeLabel    = domain === "reports" ? "open"            : "unreplied";

  const settingRows = [
    {
      key:   "auto_assign_enabled",
      label: "Auto-Assign Enabled",
      desc:  `Automatically assign new ${isReport ? "reports" : "messages"} to pool agents`,
      val:   settings?.auto_assign_enabled,
    },
    {
      key:   "assign_on_create",
      label: `Assign On ${entityLabel} Create`,
      desc:  `Trigger auto-assign immediately when a new ${entityLabel.toLowerCase()} comes in`,
      val:   settings?.assign_on_create,
    },
    {
      key:   "include_admin_role",
      label: "Include Admin Role",
      desc:  "Allow Admins (not just Order Managers) to be in the pool",
      val:   settings?.include_admin_role,
    },
    {
      key:   "include_order_manager_role",
      label: "Include Order Managers",
      desc:  "Allow Order Manager role accounts to be in the pool",
      val:   settings?.include_order_manager_role,
    },
  ] as const;

  const handleTogglePool = async (admin: PoolEligibleAdmin) => {
    if (!isSuperAdmin) return;
    setPoolPending(p => ({ ...p, [admin.id]: true }));
    try {
      if (admin.pool_id) await onRemoveFromPool(admin);
      else               await onAddToPool(admin);
    } finally {
      setPoolPending(p => ({ ...p, [admin.id]: false }));
    }
  };

  const handleSave = async (admin: PoolEligibleAdmin) => {
    await onSaveConfig(admin, maxVal[admin.id] ?? "", serialVal[admin.id] ?? "");
    setEditingId(null);
  };

  if (settingsLoading || adminsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Global Settings Card ─────────────────────────────────────── */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Distribution Settings
              </h3>
              <p className="text-xs text-gray-500">
                Configure how {isReport ? "reports" : "messages"} are automatically distributed
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {settingRows.map(({ key, label, desc, val }) => (
              <button
                key={key}
                type="button"
                disabled={settingsPending}
                onClick={() => onToggleSetting(key, !val)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  val
                    ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                )}
              >
                {val
                  ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
                  : <Circle size={18} className="mt-0.5 shrink-0 text-gray-400" />
                }
                <div>
                  <p className={cn("text-sm font-semibold", val ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-200")}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Redistribute button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={redistributePending}
              onClick={onRedistribute}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 transition-all"
            >
              {redistributePending
                ? <Loader2 size={15} className="animate-spin" />
                : <Shuffle size={15} />
              }
              Redistribute Unassigned {isReport ? "Reports" : "Messages"}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info size={12} /> Bulk assigns all unassigned active {isReport ? "reports" : "messages"} using current pool
            </span>
          </div>
        </div>
      )}

      {/* ── Admin Pool Table ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Agent Pool
              </h3>
              <p className="text-xs text-gray-500">
                {admins.filter(a => a.pool_id).length} of {admins.length} admins in {isReport ? "report" : "contact"} pool
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {admins.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">
              No eligible admins found (ADMIN or ORDER_MANAGER roles)
            </p>
          )}
          {admins.map(admin => {
            const inPool    = !!admin.pool_id;
            const isEditing = editingId === admin.id;
            const activeCount  = admin.active_report_count ?? admin.active_message_count ?? 0;
            const maxCurrent   = admin.max_active_reports  ?? admin.max_active_messages  ?? null;

            return (
              <div
                key={admin.id}
                className={cn(
                  "flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:gap-4",
                  inPool ? "bg-green-50/40 dark:bg-green-500/5" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                )}
              >
                {/* Avatar + name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {admin.profile_img_path ? (
                      <img
                        src={toPublicUrl(admin.profile_img_path || undefined) ?? undefined}
                        alt={admin.admin_name}
                        className="h-full w-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = imageFallbackSvgDataUri(admin.admin_name); }}
                      />
                    ) : initials(admin.admin_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{admin.admin_name}</p>
                      <RoleBadge role={admin.role_name} />
                      {inPool && (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-500/20 dark:text-green-400">
                          <ShieldCheck size={9} /> In Pool
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">{admin.email}</p>
                  </div>
                </div>

                {/* Load pills */}
                <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                  <LoadPill count={activeCount}                          label={activeLabel}      colour="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" />
                  <LoadPill count={admin.today_assigned_count  ?? 0}    label="assigned today"   colour="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" />
                  <LoadPill count={admin.today_completed_count ?? 0}    label={completedLabel}   colour="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" />
                  <LoadPill count={admin.total_assigned_count  ?? 0}    label="total"            colour="bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400" />
                </div>

                {/* Controls (SUPER_ADMIN only) */}
                {isSuperAdmin && (
                  <div className="flex shrink-0 items-center gap-2">
                    {inPool && !isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => onToggleAutoAssign(admin)}
                          title={admin.pool_auto_assign ? "Disable auto-assign" : "Enable auto-assign"}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                            admin.pool_auto_assign
                              ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                              : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800"
                          )}
                        >
                          <Shuffle size={11} />
                          {admin.pool_auto_assign ? "Auto On" : "Auto Off"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(admin.id);
                            setMaxVal(p => ({ ...p, [admin.id]: String(maxCurrent ?? "") }));
                            setSerialVal(p => ({ ...p, [admin.id]: String(admin.serial ?? 1) }));
                          }}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <ListOrdered size={11} /> Configure
                        </button>
                      </>
                    )}

                    {inPool && isEditing && (
                      <div className="flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/20 dark:bg-brand-500/5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                          Configure Pool Settings
                        </p>
                        <div className="flex items-end gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              Priority (tie-breaker) ⓘ
                            </label>
                            <input
                              type="number" min={1} placeholder="e.g. 1"
                              value={serialVal[admin.id] ?? ""}
                              onChange={e => setSerialVal(p => ({ ...p, [admin.id]: e.target.value }))}
                              className="h-8 w-20 rounded-lg border border-gray-200 bg-white px-2 text-[12px] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              Max active ⓘ
                            </label>
                            <input
                              type="number" min={0} placeholder="Unlimited"
                              value={maxVal[admin.id] ?? ""}
                              onChange={e => setMaxVal(p => ({ ...p, [admin.id]: e.target.value }))}
                              className="h-8 w-24 rounded-lg border border-gray-200 bg-white px-2 text-[12px] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-1 pb-0.5">
                            <button
                              type="button"
                              onClick={() => handleSave(admin)}
                              className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-600"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={poolPending[admin.id]}
                      onClick={() => handleTogglePool(admin)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-60",
                        inPool
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-500/10 dark:text-red-400"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800/40 dark:bg-green-500/10 dark:text-green-400"
                      )}
                    >
                      {poolPending[admin.id]
                        ? <Loader2 size={11} className="animate-spin" />
                        : inPool ? "Remove" : "Add to Pool"
                      }
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
