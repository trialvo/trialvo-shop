// src/components/support/SupportAssignTab.tsx — V2-039
// Reusable "Assign / Reassign" tab for Report and Contact Message distribution.
// Upgraded: Entity ID text field → searchable item picker showing open items.

import { useState, useMemo } from "react";
import { ClipboardList, ChevronRight, UserCheck, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type AssignableAdmin = {
  id: number;
  admin_name: string;
  role_name: string;
  active_count: number; // active_report_count | active_message_count
};

/** Minimal shape of a selectable item (report or contact message). */
export type AssignableItem = {
  id: number;
  /** Display label: reporter name / sender name, or fallback to email/phone */
  label: string;
  /** Secondary info shown in the picker (subject or message snippet) */
  subject: string;
  /** Optional: current assigned admin name */
  assigned_to?: string | null;
};

export type SupportAssignmentLog = {
  id: number;
  entity_id: number;
  action_type: "auto_assign" | "manual" | "redistribute" | "unassign";
  from_admin_name: string | null;
  to_admin_name:   string | null;
  changed_by_name: string | null;
  created_at: string;
};

type Props = {
  domain: "reports" | "contact";
  isSuperAdmin: boolean;
  currentAdminId: number;
  admins: AssignableAdmin[];
  /** List of open/active items to pick from instead of typing an ID */
  items?: AssignableItem[];
  itemsLoading?: boolean;
  logs: SupportAssignmentLog[];
  logsLoading: boolean;
  isPending: boolean;
  onAssign: (entityId: number, adminId: number) => Promise<void>;
};

const ACTION_LABELS: Record<SupportAssignmentLog["action_type"], string> = {
  auto_assign:  "Auto Assigned",
  manual:       "Manually Assigned",
  redistribute: "Redistributed",
  unassign:     "Unassigned",
};

const ACTION_COLORS: Record<SupportAssignmentLog["action_type"], string> = {
  auto_assign:  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  manual:       "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  redistribute: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  unassign:     "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

export default function SupportAssignTab({
  domain, isSuperAdmin, currentAdminId,
  admins, items, itemsLoading, logs, logsLoading, isPending, onAssign,
}: Props) {
  const entityLabel = domain === "reports" ? "Report" : "Message";

  // Item picker state
  const [search, setSearch]           = useState("");
  const [selectedItem, setSelectedItem] = useState<AssignableItem | null>(null);
  const [targetAdmin, setTargetAdmin]  = useState<number | null>(null);
  const [showPicker, setShowPicker]    = useState(false);

  // ADMIN can only assign to ORDER_MANAGER (not SUPER_ADMIN)
  const eligibleForAssign = isSuperAdmin
    ? admins
    : admins.filter(a => a.role_name !== "SUPER_ADMIN");

  const filteredItems = useMemo(() => {
    if (!items?.length) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items.filter(
      i =>
        i.label.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        String(i.id).includes(q)
    ).slice(0, 50);
  }, [items, search]);

  const handleAssign = async () => {
    if (!selectedItem || !targetAdmin) return;
    await onAssign(selectedItem.id, targetAdmin);
    setSelectedItem(null);
    setTargetAdmin(null);
    setSearch("");
    setShowPicker(false);
  };

  // Fallback: if no items list provided, fall back to raw ID input
  const useItemPicker = Array.isArray(items);

  return (
    <div className="space-y-6">
      {/* ── Manual Assignment Form ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manual Assignment</h3>
            <p className="text-xs text-gray-500">
              {isSuperAdmin
                ? `Assign or reassign a ${entityLabel.toLowerCase()} to any admin`
                : `Reassign a ${entityLabel.toLowerCase()} that is currently assigned to you`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* ── Entity Picker ─────────────────────────────────────── */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {entityLabel}
            </label>

            {useItemPicker ? (
              <div className="relative">
                {/* Selected item display or search trigger */}
                {selectedItem ? (
                  <div className="flex h-10 items-center gap-2 rounded-xl border border-brand-400 bg-brand-50 pl-3 pr-2 dark:border-brand-500/50 dark:bg-brand-500/10">
                    <span className="flex-1 truncate text-sm font-medium text-brand-700 dark:text-brand-300">
                      #{selectedItem.id} — {selectedItem.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedItem(null); setSearch(""); }}
                      className="shrink-0 rounded-full p-0.5 text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-500/20"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPicker(v => !v)}
                    className="flex h-10 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:border-brand-400 transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    <Search size={14} className="shrink-0 text-gray-400" />
                    <span className="flex-1 text-left">
                      {itemsLoading ? "Loading…" : `Search ${entityLabel.toLowerCase()}s…`}
                    </span>
                  </button>
                )}

                {/* Dropdown picker */}
                {showPicker && !selectedItem && (
                  <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {/* Search input */}
                    <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder={`Search by name, subject, or #ID…`}
                          className="h-8 w-full rounded-lg bg-gray-50 pl-8 pr-3 text-xs text-gray-700 outline-none dark:bg-gray-800 dark:text-gray-200"
                        />
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto">
                      {filteredItems.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-gray-400">
                          {itemsLoading ? "Loading…" : `No open ${entityLabel.toLowerCase()}s found`}
                        </p>
                      ) : (
                        filteredItems.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setSelectedItem(item); setShowPicker(false); setSearch(""); }}
                            className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                              #{item.id}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800 dark:text-white">
                                {item.label}
                              </p>
                              <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                {item.subject}
                              </p>
                              {item.assigned_to && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                  Currently: {item.assigned_to}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Fallback: raw ID input (when items list is not provided)
              <input
                type="number"
                min={1}
                value={selectedItem?.id ?? ""}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedItem(id ? { id, label: `#${id}`, subject: "" } : null);
                }}
                placeholder={`e.g. 42`}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            )}
          </div>

          {/* Target Admin */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Assign To
            </label>
            <select
              value={targetAdmin ?? ""}
              onChange={e => setTargetAdmin(Number(e.target.value) || null)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">-- Select Admin --</option>
              {eligibleForAssign.map(a => (
                <option key={a.id} value={a.id}>
                  {a.admin_name} ({a.role_name.replace("_", " ")}) — {a.active_count} active
                  {a.id === currentAdminId ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isPending || !selectedItem || !targetAdmin}
            onClick={handleAssign}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 transition-all"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            Assign
          </button>
        </div>
      </div>

      {/* ── Assignment Logs ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
            {logs.map(log => (
              <div key={log.id} className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", ACTION_COLORS[log.action_type])}>
                  {ACTION_LABELS[log.action_type]}
                </span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {entityLabel} #{log.entity_id}
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
