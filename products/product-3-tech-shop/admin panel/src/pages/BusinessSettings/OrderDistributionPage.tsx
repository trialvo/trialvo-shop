import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Settings,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  Circle,
  ChevronRight,
  Shuffle,
  UserCheck,
  Loader2,
  Info,
  ShieldCheck,
  ListOrdered,
  Search,
  X,
  Package,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { useAuth } from "@/context/AuthProvider";
import {
  useDistributionSettings,
  useUpdateDistributionSettings,
  useEligibleAdmins,
  useUpsertAgentByAdminId,
  useRemoveAgent,
  useEditAgent,
  useRedistributeUnassigned,
} from "@/hooks/useOrderDistribution";
import { useAssignOrder, useAssignmentLogs, useAssignableOrders } from "@/hooks/useOrderAssignment";
import type { EligibleAdmin } from "@/api/order-distribution.api";
import { toPublicUrl } from "@/config/env";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

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
      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", colour)}>
      {role.replace("_", " ")}
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

// ─── Tab types ───────────────────────────────────────────────────────────────

type Tab = "pool" | "assign";

// ─── Pool & Settings Tab ─────────────────────────────────────────────────────

function PoolSettingsTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data: settingsRes, isLoading: settingsLoading } = useDistributionSettings();
  const { data: adminsRes, isLoading: adminsLoading } = useEligibleAdmins();
  const updateSettings = useUpdateDistributionSettings();
  const upsertAgent = useUpsertAgentByAdminId();
  const removeAgent = useRemoveAgent();
  const editAgent = useEditAgent();
  const redistribute = useRedistributeUnassigned();

  const settings = settingsRes?.data;
  const admins = adminsRes?.data ?? [];

  // Local edits for pool settings per admin
  const [editingPoolId, setEditingPoolId] = useState<number | null>(null);
  const [maxOrders, setMaxOrders] = useState<Record<number, string>>({});
  const [serialVal, setSerialVal] = useState<Record<number, string>>({});

  const handleToggleInPool = async (admin: EligibleAdmin) => {
    if (!isSuperAdmin) return;
    if (admin.pool_id) {
      // Remove from pool
      try {
        await removeAgent.mutateAsync(admin.pool_id);
        toast.success(`${admin.admin_name} removed from distribution pool`);
      } catch (e: any) {
        toast.error(e?.response?.data?.error ?? "Failed to remove from pool");
      }
    } else {
      // Add to pool
      try {
        await upsertAgent.mutateAsync({
          adminId: admin.id,
          body: { auto_assign_enabled: true, status: true },
        });
        toast.success(`${admin.admin_name} added to distribution pool`);
      } catch (e: any) {
        toast.error(e?.response?.data?.error ?? "Failed to add to pool");
      }
    }
  };

  const handleToggleAutoAssign = async (admin: EligibleAdmin) => {
    if (!admin.pool_id) return;
    try {
      await editAgent.mutateAsync({
        id: admin.pool_id,
        body: { auto_assign_enabled: !admin.pool_auto_assign },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to update");
    }
  };

  const handleSavePoolSettings = async (admin: EligibleAdmin) => {
    if (!admin.pool_id) return;
    const max = maxOrders[admin.id];
    const ser = serialVal[admin.id];
    try {
      await editAgent.mutateAsync({
        id: admin.pool_id,
        body: {
          ...(max !== undefined ? { max_active_orders: max ? Number(max) : null } : {}),
          ...(ser !== undefined ? { serial: Number(ser) || 1 } : {}),
        },
      });
      setEditingPoolId(null);
      toast.success("Pool settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to save settings");
    }
  };

  const handleRedistribute = async () => {
    try {
      const res = await redistribute.mutateAsync();
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Redistribute failed");
    }
  };

  const handleSettingsToggle = (
    key: "auto_assign_enabled" | "assign_on_order_create" | "include_admin_role" | "include_order_manager_role",
    value: boolean
  ) => {
    updateSettings.mutate(
      { [key]: value },
      {
        onSuccess: () => toast.success("Settings updated"),
        onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed"),
      }
    );
  };

  if (settingsLoading || adminsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
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
                Configure how orders are automatically distributed
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "auto_assign_enabled", label: "Auto-Assign Enabled", desc: "Automatically assign new orders to pool agents" },
                { key: "assign_on_order_create", label: "Assign On Order Create", desc: "Trigger auto-assign immediately when a new order is placed" },
                { key: "include_admin_role", label: "Include Admin Role", desc: "Allow admins (not just order managers) to be in the pool" },
                { key: "include_order_manager_role", label: "Include Order Managers", desc: "Allow Order Manager role accounts to be in the pool" },
              ] as const
            ).map(({ key, label, desc }) => {
              const val = settings?.[key] as boolean | undefined;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={updateSettings.isPending}
                  onClick={() => handleSettingsToggle(key, !val)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    val
                      ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                  )}
                >
                  {val ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-gray-400" />
                  )}
                  <div>
                    <p className={cn("text-sm font-semibold", val ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-200")}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Redistribute Button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={redistribute.isPending}
              onClick={handleRedistribute}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 transition-all"
            >
              {redistribute.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Shuffle size={15} />
              )}
              Redistribute Unassigned Orders
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info size={12} /> Bulk assigns all unassigned active orders using current pool
            </span>
          </div>
        </div>
      )}

      {/* ── Admin Pool Table ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Admin Pool
              </h3>
              <p className="text-xs text-gray-500">
                {admins.filter((a) => a.pool_id).length} of {admins.length} admins in pool
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
          {admins.map((admin) => {
            const inPool = !!admin.pool_id;
            const isEditing = editingPoolId === admin.id;

            return (
              <div
                key={admin.id}
                className={cn(
                  "flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:gap-4",
                  inPool
                    ? "bg-green-50/40 dark:bg-green-500/5"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                )}
              >
                {/* Avatar + Name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {admin.profile_img_path ? (
                      <img
                        src={toPublicUrl(admin.profile_img_path ?? undefined) ?? undefined}
                        alt={admin.admin_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            imageFallbackSvgDataUri(admin.admin_name);
                        }}
                      />
                    ) : (
                      initials(admin.admin_name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {admin.admin_name}
                      </p>
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

                {/* Load Pills */}
                <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                  <LoadPill
                    count={admin.active_order_count}
                    label="active"
                    colour="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                  />
                  <LoadPill
                    count={admin.today_assigned_count}
                    label="assigned today"
                    colour="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  />
                  <LoadPill
                    count={admin.today_completed_count}
                    label="shipped today"
                    colour="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                  />
                  <LoadPill
                    count={admin.total_assigned_count}
                    label="total"
                    colour="bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                  />
                </div>

                {/* Pool controls (only SUPER_ADMIN) */}
                {isSuperAdmin && (
                  <div className="flex shrink-0 items-center gap-2">
                    {inPool && !isEditing && (
                      <>
                        {/* Auto-assign toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleAutoAssign(admin)}
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

                        {/* Edit settings */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPoolId(admin.id);
                            setMaxOrders((p) => ({
                              ...p,
                              [admin.id]: String(admin.max_active_orders ?? ""),
                            }));
                            setSerialVal((p) => ({
                              ...p,
                              [admin.id]: String(admin.serial ?? 1),
                            }));
                          }}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <ListOrdered size={11} />
                          Configure
                        </button>
                      </>
                    )}

                    {inPool && isEditing && (
                      <div className="flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/20 dark:bg-brand-500/5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                          Configure Pool Settings
                        </p>
                        <div className="flex items-end gap-3">
                          {/* Priority / Serial */}
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              Priority (tie-breaker)
                              <span
                                title="When two admins have equal load, the one with the lower priority number gets the next order. Set 1 for highest priority."
                                className="cursor-help text-gray-400"
                              >
                                ⓘ
                              </span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="e.g. 1"
                              value={serialVal[admin.id] ?? ""}
                              onChange={(e) =>
                                setSerialVal((p) => ({ ...p, [admin.id]: e.target.value }))
                              }
                              title="Priority (Serial): Lower number = higher tie-break priority. Only matters when two admins have equal active orders."
                              className="h-8 w-20 rounded-lg border border-gray-200 bg-white px-2 text-[12px] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          {/* Max active orders */}
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              Max active orders
                              <span
                                title="Hard cap on how many unfinished orders this admin can hold at once. Leave blank for unlimited. Admin is skipped in auto-assign once this limit is reached."
                                className="cursor-help text-gray-400"
                              >
                                ⓘ
                              </span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder="Unlimited"
                              value={maxOrders[admin.id] ?? ""}
                              onChange={(e) =>
                                setMaxOrders((p) => ({ ...p, [admin.id]: e.target.value }))
                              }
                              title="Max Active Orders: Admin is skipped in assignment once this many active (non-terminal) orders are assigned. Leave blank for no limit."
                              className="h-8 w-24 rounded-lg border border-gray-200 bg-white px-2 text-[12px] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 pb-0.5">
                            <button
                              type="button"
                              onClick={() => handleSavePoolSettings(admin)}
                              className="rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-600"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPoolId(null)}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* In/Out pool toggle */}
                    <button
                      type="button"
                      disabled={upsertAgent.isPending || removeAgent.isPending}
                      onClick={() => handleToggleInPool(admin)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-60",
                        inPool
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-500/10 dark:text-red-400"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800/40 dark:bg-green-500/10 dark:text-green-400"
                      )}
                    >
                      {inPool ? "Remove" : "Add to Pool"}
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

// ─── Order status badge helper ────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new:              "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  approved:         "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  processing:       "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  packaging:        "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  on_hold:          "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  shipped:          "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  out_for_delivery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  delivered:        "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  returned:         "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  cancelled:        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  trash:            "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Assign Orders Tab ───────────────────────────────────────────────────────

function AssignOrdersTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { admin } = useAuth();
  const { data: adminsRes } = useEligibleAdmins();
  const { data: ordersRes, isLoading: ordersLoading } = useAssignableOrders();
  const assignOrderMut = useAssignOrder();
  const { data: logsRes, isLoading: logsLoading } = useAssignmentLogs({ limit: 20 });

  // ── Picker state ─────────────────────────────────────────────────────────
  type PickedOrder = { id: number; label: string; status: string; assigned_to: string | null };
  const [selectedOrder, setSelectedOrder] = useState<PickedOrder | null>(null);
  const [targetAdminId, setTargetAdminId]  = useState<number | null>(null);
  const [search, setSearch]               = useState("");
  const [showPicker, setShowPicker]       = useState(false);

  const eligibleForAssign = (adminsRes?.data ?? []).filter((a) => {
    if (!isSuperAdmin) return a.role_name === "ORDER_MANAGER";
    return true;
  });

  // Build the list of selectable orders from the API response
  const allOrders: PickedOrder[] = useMemo(() => {
    const rows = ordersRes?.data ?? [];
    return rows.map((o) => ({
      id:          o.id,
      label:       o.customer_name || o.customer_phone || `Order #${o.id}`,
      status:      o.order_status,
      assigned_to: o.assigned_admin_name ?? null,
    }));
  }, [ordersRes]);

  // Filter by local search query
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOrders.slice(0, 60);
    return allOrders
      .filter(
        (o) =>
          String(o.id).includes(q) ||
          o.label.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [allOrders, search]);

  const logs = logsRes?.data ?? [];

  const handleAssign = async () => {
    if (!selectedOrder || !targetAdminId) {
      toast.error("Please select an order and an admin");
      return;
    }
    try {
      const res = await assignOrderMut.mutateAsync({
        order_id: selectedOrder.id,
        admin_id: targetAdminId,
      });
      toast.success(res.message);
      setSelectedOrder(null);
      setTargetAdminId(null);
      setSearch("");
      setShowPicker(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Assignment failed");
    }
  };

  const ACTION_LABELS: Record<string, string> = {
    auto_assign:  "Auto Assigned",
    manual:       "Manually Assigned",
    redistribute: "Redistributed",
    unassign:     "Unassigned",
  };
  const ACTION_COLORS: Record<string, string> = {
    auto_assign:  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    manual:       "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
    redistribute: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    unassign:     "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* ── Manual Assignment Form ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Manual Assignment
            </h3>
            <p className="text-xs text-gray-500">
              {isSuperAdmin
                ? "Assign or reassign any order to a specific admin"
                : "Reassign an order that is currently assigned to you"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* ── Order Picker ─────────────────────────────────────────── */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Order
            </label>

            <div className="relative">
              {/* Selected order chip */}
              {selectedOrder ? (
                <div className="flex h-10 items-center gap-2 rounded-xl border border-brand-400 bg-brand-50 pl-3 pr-2 dark:border-brand-500/50 dark:bg-brand-500/10">
                  <Package size={13} className="shrink-0 text-brand-500" />
                  <span className="flex-1 truncate text-sm font-medium text-brand-700 dark:text-brand-300">
                    #{selectedOrder.id} — {selectedOrder.label}
                  </span>
                  <StatusBadge status={selectedOrder.status} />
                  <button
                    type="button"
                    onClick={() => { setSelectedOrder(null); setSearch(""); }}
                    className="shrink-0 rounded-full p-0.5 text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  className="flex h-10 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:border-brand-400 transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <Search size={14} className="shrink-0 text-gray-400" />
                  <span className="flex-1 text-left">
                    {ordersLoading ? "Loading orders…" : "Search orders by ID or customer name…"}
                  </span>
                </button>
              )}

              {/* Dropdown picker */}
              {showPicker && !selectedOrder && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {/* Search input */}
                  <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order #ID, customer name or status…"
                        className="h-8 w-full rounded-lg bg-gray-50 pl-8 pr-3 text-xs text-gray-700 outline-none dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  {/* Orders list */}
                  <div className="max-h-60 overflow-y-auto">
                    {ordersLoading ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Loading orders…
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">
                        No orders found
                      </p>
                    ) : (
                      filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPicker(false);
                            setSearch("");
                          }}
                          className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="mt-0.5 flex h-5 w-14 shrink-0 items-center justify-center rounded-md bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                            #{order.id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-800 dark:text-white">
                              {order.label}
                            </p>
                            {order.assigned_to && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                Currently: {order.assigned_to}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={order.status} />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Target Admin ─────────────────────────────────────────── */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Assign To
            </label>
            <select
              value={targetAdminId ?? ""}
              onChange={(e) => setTargetAdminId(Number(e.target.value) || null)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">-- Select Admin --</option>
              {eligibleForAssign.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.admin_name} ({a.role_name.replace("_", " ")}) — {a.active_order_count} active
                  {a.id === admin?.id ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={assignOrderMut.isPending || !selectedOrder || !targetAdminId}
            onClick={handleAssign}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 transition-all"
          >
            {assignOrderMut.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ChevronRight size={15} />
            )}
            Assign
          </button>
        </div>
      </div>

      {/* ── Assignment Logs ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent Assignment Log
              </h3>
              <p className="text-xs text-gray-500">Last 20 assignment actions</p>
            </div>
          </div>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : logs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">No assignment logs yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    ACTION_COLORS[log.action_type] ?? "bg-gray-100 text-gray-500"
                  )}
                >
                  {ACTION_LABELS[log.action_type] ?? log.action_type}
                </span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  Order #{log.order_id}
                </span>
                {log.from_admin_name && (
                  <span className="text-xs text-gray-500">
                    from <strong>{log.from_admin_name}</strong>
                  </span>
                )}
                {log.to_admin_name && (
                  <span className="text-xs text-gray-500">
                    → <strong>{log.to_admin_name}</strong>
                  </span>
                )}
                {log.changed_by_name && (
                  <span className="ml-auto text-xs text-gray-400">by {log.changed_by_name}</span>
                )}
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OrderDistributionPage() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const isAdmin = hasRole("ADMIN");
  const canAccess = isSuperAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState<Tab>("pool");

  if (!canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">Access denied</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pool", label: "Pool & Settings", icon: <Users size={15} /> },
    { id: "assign", label: "Assign Orders", icon: <ClipboardList size={15} /> },
  ];

  return (
    <>
      <PageMeta
        title="Order Distribution"
        description="Manage order distribution pool and manual assignment"
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
              <RefreshCw size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Order Distribution
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage automated distribution settings and manually assign orders to admins
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "pool" && <PoolSettingsTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === "assign" && <AssignOrdersTab isSuperAdmin={isSuperAdmin} />}
      </div>
    </>
  );
}
