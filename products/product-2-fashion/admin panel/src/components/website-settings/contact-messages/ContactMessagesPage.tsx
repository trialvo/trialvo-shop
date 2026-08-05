// src/components/website-settings/contact-messages/ContactMessagesPage.tsx — V2-037
// Inbox tab + Distribution Pool tab for Contact Messages.

"use client";

import React, { useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive, Inbox, Mail, MessageSquare, MessageSquareText,
  RefreshCw, Search, Shuffle, SlidersHorizontal, Users, UserCheck,
  Reply, ReplyAll,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";

import ContactMessagesList from "./ContactMessagesList";
import ContactMessageDetailsPanel from "./ContactMessageDetailsPanel";
import ReplyModal, { type ReplyType } from "./ReplyModal";
import type { ContactMessageFilters, ContactMessagePageState, ContactTabKey } from "./types";
import type { ContactMessage } from "@/api/contact-messages.api";
import {
  useContactMessage,
  useContactMessageCounts,
  useContactMessages,
  useDeleteContactMessage,
  useReplyContactMessage,
  useToggleContactMessageStatus,
} from "./useContactMessages";
import SupportDistributionPoolTab from "@/components/support/SupportDistributionPoolTab";
import SupportAssignTab from "@/components/support/SupportAssignTab";
import {
  useContactDistributionSettings,
  useContactEligibleAdmins,
  useUpdateContactDistributionSettings,
  useUpsertContactAgent,
  useRemoveContactAgent,
  useRedistributeContactMessages,
  // V2-038
  useContactAssignmentLogs,
  useManualAssignContactMessage,
} from "@/hooks/useContactDistribution";

// ─── Stat Tab Config ─────────────────────────────────────────────────────── //

type StatTabDef = { key: ContactTabKey; label: string; countKey: string; color: string; activeClass: string; icon: React.ReactNode };

const STAT_TABS: StatTabDef[] = [
  {
    key: "all",                 label: "Total",               countKey: "total",                color: "text-gray-600 dark:text-gray-400",
    activeClass: "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800",
    icon: <MessageSquare size={13} />,
  },
  {
    key: "unread",              label: "Unread",              countKey: "unread",               color: "text-sky-600 dark:text-sky-400",
    activeClass: "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
    icon: <Mail size={13} />,
  },
  {
    key: "unreplied",          label: "Unreplied",            countKey: "unreplied",            color: "text-amber-600 dark:text-amber-400",
    activeClass: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    icon: <MessageSquare size={13} />,
  },
  {
    key: "read_but_not_replied", label: "Read · Unreplied", countKey: "read_but_not_replied",  color: "text-orange-600 dark:text-orange-400",
    activeClass: "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10",
    icon: <MessageSquare size={13} />,
  },
  {
    key: "archived",           label: "Archived",             countKey: "archived",             color: "text-gray-500 dark:text-gray-500",
    activeClass: "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700",
    icon: <Archive size={13} />,
  },
];

// Map stat tab to api filters
function tabToFilters(tab: ContactTabKey): Partial<ContactMessageFilters> {
  if (tab === "unread")             return { status: "active", is_read: "false" };
  if (tab === "unreplied")          return { status: "active", is_replied: "false" };
  if (tab === "read_but_not_replied") return { status: "active", is_read: "true", is_replied: "false" };
  if (tab === "archived")           return { status: "archived" };
  return { status: "active" };
}

// ── Defaults ─────────────────────────────────────────────────────────────── //

const DEFAULT_FILTERS: ContactMessageFilters = {
  tab: "all", status: "active", is_read: "all", is_replied: "all", search: "", subject: "", assigned_to_me: false,
};
const DEFAULT_STATE: ContactMessagePageState = { page: 1, pageSize: 20, selectedId: null };

// ── Debounce hook ─────────────────────────────────────────────────────────── //
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ── Reply filter options ──────────────────────────────────────────────────── //
type ReplyFilterValue = "all" | "replied" | "unreplied";
const REPLY_FILTERS: { value: ReplyFilterValue; label: string; icon: React.ReactNode; color: string; activeClass: string }[] = [
  { value: "all",       label: "All",       icon: <ReplyAll size={13} />, color: "text-gray-600 dark:text-gray-400",  activeClass: "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800" },
  { value: "replied",   label: "Replied",   icon: <Reply size={13} />,    color: "text-green-600 dark:text-green-400", activeClass: "border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10" },
  { value: "unreplied", label: "Unreplied", icon: <MessageSquare size={13} />, color: "text-amber-600 dark:text-amber-400", activeClass: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10" },
];

type PageTab = "inbox" | "pool" | "assign";

// ─── Main Component ───────────────────────────────────────────────────────── //

export default function ContactMessagesPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isSuperAdmin   = hasRole("SUPER_ADMIN");
  const isAdmin        = hasRole("ADMIN");
  const isOrderManager = hasRole("ORDER_MANAGER");
  const canManagePool  = isSuperAdmin || isAdmin; // Pool tab only
  const canAssign      = isSuperAdmin || isAdmin || isOrderManager; // Assign tab

  const [pageTab, setPageTab]   = React.useState<PageTab>("inbox");
  const [filters, setFilters]   = React.useState<ContactMessageFilters>(DEFAULT_FILTERS);
  const [state, setState]       = React.useState<ContactMessagePageState>(DEFAULT_STATE);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const [replyFilter, setReplyFilter] = React.useState<ReplyFilterValue>("all");

  // Debounce search to avoid firing API on every keystroke
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // Sync debounced search into filters
  React.useEffect(() => {
    setFilters(f => f.search === debouncedSearch ? f : { ...f, search: debouncedSearch });
    setState(s => s.page === 1 ? s : { ...s, page: 1 });
  }, [debouncedSearch]);

  // ── Deep-link: auto-select contact message from ?messageId=X ────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkMsgId = searchParams.get("messageId") ? Number(searchParams.get("messageId")) : null;
  const deepLinkConsumedRef = useRef(false);

  const offset = (state.page - 1) * state.pageSize;

  // ── Queries ─────────────────────────────────────────────────────────────
  const countsQ = useContactMessageCounts();
  const counts  = countsQ.data?.data;

  const listQ = useContactMessages(
    {
      status: filters.status, offset, limit: state.pageSize,
      subject: filters.subject, search: filters.search,
      is_read: filters.is_read, is_replied: filters.is_replied,
      assigned_to_me: filters.assigned_to_me || undefined,
    },
    { enabled: true }
  );
  const rows  = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;

  React.useEffect(() => {
    if (state.selectedId) {
      if (!rows.some(r => r.id === state.selectedId)) {
        setState(s => ({ ...s, selectedId: rows.length > 0 ? rows[0].id : null }));
      }
    } else if (!state.selectedId && rows.length > 0) {
      setState(s => ({ ...s, selectedId: rows[0].id }));
    }
  }, [rows, state.selectedId]);

  // Auto-select deep-link message when rows arrive
  React.useEffect(() => {
    if (!deepLinkMsgId || deepLinkConsumedRef.current || rows.length === 0) return;
    deepLinkConsumedRef.current = true;
    setState(s => ({ ...s, selectedId: deepLinkMsgId }));
    setSearchParams((prev) => { prev.delete("messageId"); return prev; }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkMsgId, rows]);

  const singleQ  = useContactMessage(state.selectedId, { enabled: !!state.selectedId });
  const selected = singleQ.data?.data ?? null;

  const toggleStatus = useToggleContactMessageStatus();
  const deleteMsg    = useDeleteContactMessage();
  const replyMsg     = useReplyContactMessage();
  const [replyOpen, setReplyOpen] = React.useState(false);

  const applyTab = (tab: ContactTabKey) => {
    const tf = tabToFilters(tab);
    setFilters(f => ({ ...f, tab, ...tf }));
    setSearchInput("");
    setReplyFilter("all");
    setState(s => ({ ...s, page: 1 }));
  };

  const applyReplyFilter = (val: ReplyFilterValue) => {
    setReplyFilter(val);
    setFilters(f => ({
      ...f,
      tab: "all",
      is_replied: val === "all" ? "all" : val === "replied" ? "true" : "false",
    }));
    setState(s => ({ ...s, page: 1 }));
  };

  const toggleAssignedToMe = () => {
    setFilters(f => ({ ...f, assigned_to_me: !f.assigned_to_me }));
    setState(s => ({ ...s, page: 1 }));
  };

  const isRefetching = listQ.isFetching && !listQ.isLoading;

  // ── Distribution pool ────────────────────────────────────────────────────
  const settingsQ   = useContactDistributionSettings();
  const eligibleQ   = useContactEligibleAdmins();
  const updSettings = useUpdateContactDistributionSettings();
  const upsert      = useUpsertContactAgent();
  const remove      = useRemoveContactAgent();
  const redist      = useRedistributeContactMessages();

  const distSettings   = settingsQ.data?.data;
  const eligibleAdmins = eligibleQ.data?.data ?? [];

  return (
    <div className="w-full px-4 py-6 md:px-8">
      {/* ── Page Header ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("contactMessages.title", "Contact Messages")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage and respond to customer inquiries
            </p>
          </div>
        </div>

        {/* Page-level tabs — Pool & Assign hidden from non-admins */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
          {([
            { id: "inbox"  as const, label: "Inbox",             icon: <Inbox size={14} />,   restriction: "none"   },
            { id: "pool"   as const, label: "Distribution Pool", icon: <Users size={14} />,   restriction: "pool"   },
            { id: "assign" as const, label: "Assign",            icon: <Shuffle size={14} />, restriction: "assign" },
          ] as const).filter(t => {
            if (t.restriction === "none")   return true;
            if (t.restriction === "pool")   return canManagePool;
            if (t.restriction === "assign") return canAssign;
            return false;
          }).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPageTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                pageTab === t.id
                  ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────── INBOX TAB ─────────────────────── */}
      {pageTab === "inbox" && (
        <>
          {/* ── Stat Pills Row ── */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {STAT_TABS.map(tab => {
                const count = counts ? (counts as Record<string, number>)[tab.countKey] ?? 0 : 0;
                const active = filters.tab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => applyTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                      tab.color,
                      active
                        ? tab.activeClass + " border"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60 hover:border-gray-300"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      active ? "bg-white/60 dark:bg-black/20" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filters + Search + Refresh */}
            <div className="flex items-center gap-2">
              {/* Assigned to me toggle */}
              {(isAdmin || isOrderManager) && (
                <button
                  type="button"
                  onClick={toggleAssignedToMe}
                  className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                    filters.assigned_to_me
                      ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 hover:border-gray-300")}
                >
                  <UserCheck size={13} />
                  <span className="hidden sm:inline">Assigned to me</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSearch(v => !v)}
                className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  showSearch
                    ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800")}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
                type="button"
                onClick={() => { countsQ.refetch(); listQ.refetch(); }}
                disabled={isRefetching}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-60"
              >
                <RefreshCw size={13} className={isRefetching ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{isRefetching ? "…" : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Expandable filters: search + reply status */}
          {showSearch && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, phone, subject…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              {/* Reply status pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1">Reply:</span>
                {REPLY_FILTERS.map(rf => {
                  const active = replyFilter === rf.value;
                  return (
                    <button
                      key={rf.value}
                      type="button"
                      onClick={() => applyReplyFilter(rf.value)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all",
                        rf.color,
                        active
                          ? rf.activeClass + " border"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60 hover:border-gray-300"
                      )}
                    >
                      {rf.icon}
                      <span>{rf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Split Pane */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left: inbox list */}
            <div className="flex flex-col lg:col-span-5">
              <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
                  <Inbox size={16} className="text-brand-500" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t("contactMessages.inbox", "Inbox")}
                  </p>
                  <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {total}
                  </span>
                </div>
                <div className="min-h-[320px] flex-1 overflow-y-auto">
                  {listQ.isLoading ? (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02] space-y-2">
                          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ContactMessagesList
                      rows={rows}
                      selectedId={state.selectedId}
                      onSelect={id => setState(s => ({ ...s, selectedId: id }))}
                    />
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Pagination
                  totalItems={total}
                  page={state.page}
                  pageSize={state.pageSize}
                  onPageChange={p => setState(s => ({ ...s, page: p }))}
                  onPageSizeChange={n => setState(s => ({ ...s, page: 1, pageSize: n }))}
                />
              </div>
            </div>

            {/* Right: detail */}
            <div className="lg:col-span-7">
              <div className="min-h-[520px] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {selected ? (
                  <ContactMessageDetailsPanel
                    data={selected}
                    onReply={() => setReplyOpen(true)}
                    onToggleArchive={() => toggleStatus.mutate(selected.id)}
                    onDelete={() => {
                      deleteMsg.mutate(selected.id, {
                        onSuccess: () => setState(s => ({ ...s, selectedId: null })),
                      });
                    }}
                    isDeleting={deleteMsg.isPending}
                    isToggling={toggleStatus.isPending}
                  />
                ) : (
                  <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-3 px-5 py-10">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                      <Inbox className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </span>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {rows.length
                        ? t("contactMessages.selectMessage", "Select a message to view details")
                        : t("contactMessages.noMessages", "No messages found")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ReplyModal
            open={replyOpen}
            onClose={() => setReplyOpen(false)}
            toLabel={selected ? (selected.email || selected.phone || t("contactMessages.guest", "Guest")) : undefined}
            isSubmitting={replyMsg.isPending}
            onSubmit={({ replyText, type }: { replyText: string; type: ReplyType }) => {
              if (!selected) return;
              replyMsg.mutate(
                { message_id: selected.id, reply_text: replyText, type },
                { onSuccess: () => setReplyOpen(false) }
              );
            }}
          />
        </>
      )}

      {pageTab === "pool" && canManagePool && (
        <SupportDistributionPoolTab
          domain="contact"
          isSuperAdmin={isSuperAdmin}
          settings={distSettings ? {
            auto_assign_enabled: distSettings.auto_assign_enabled,
            assign_on_create: distSettings.assign_on_message_create,
            include_admin_role: distSettings.include_admin_role,
            include_order_manager_role: distSettings.include_order_manager_role,
          } : null}
          settingsLoading={settingsQ.isLoading}
          admins={eligibleAdmins}
          adminsLoading={eligibleQ.isLoading}
          settingsPending={updSettings.isPending}
          redistributePending={redist.isPending}
          onToggleSetting={(key, val) => {
            const keyMap: Record<string, string> = {
              auto_assign_enabled: "auto_assign_enabled",
              assign_on_create: "assign_on_message_create",
              include_admin_role: "include_admin_role",
              include_order_manager_role: "include_order_manager_role",
            };
            updSettings.mutate(
              { [keyMap[key]]: val } as Parameters<typeof updSettings.mutate>[0],
              { onSuccess: () => toast.success("Setting updated"), onError: () => toast.error("Failed") }
            );
          }}
          onAddToPool={async admin => {
            await upsert.mutateAsync({ adminId: admin.id, body: { auto_assign_enabled: true, status: true } });
            toast.success(`${admin.admin_name} added to contact pool`);
          }}
          onRemoveFromPool={async admin => {
            await remove.mutateAsync(admin.id);
            toast.success(`${admin.admin_name} removed from contact pool`);
          }}
          onToggleAutoAssign={async admin => {
            await upsert.mutateAsync({ adminId: admin.id, body: { auto_assign_enabled: !admin.pool_auto_assign } });
          }}
          onSaveConfig={async (admin, maxVal, serialVal) => {
            await upsert.mutateAsync({
              adminId: admin.id,
              body: {
                ...(maxVal !== "" ? { max_active_messages: maxVal ? Number(maxVal) : null } : {}),
                ...(serialVal !== "" ? { serial: Number(serialVal) || 1 } : {}),
              },
            });
            toast.success("Pool settings saved");
          }}
          onRedistribute={async () => {
            const res = await redist.mutateAsync();
            toast.success(res.message);
          }}
        />
      )}

      {/* ────────── ASSIGN TAB ─────────── */}
      {pageTab === "assign" && canAssign && (
        <AssignContactTab isSuperAdmin={isSuperAdmin} rows={rows} rowsLoading={listQ.isLoading} />
      )}
    </div>
  );
}

// ─── Assign Tab (Contact Messages) — V2-039 ──────────────────────────────── //

function AssignContactTab({ isSuperAdmin, rows, rowsLoading }: {
  isSuperAdmin: boolean;
  rows: ContactMessage[];
  rowsLoading: boolean;
}) {
  const { admin } = useAuth();
  const eligibleQ = useContactEligibleAdmins();
  const assignMut = useManualAssignContactMessage();
  const { data: logsRes, isLoading: logsLoading } = useContactAssignmentLogs({ limit: 20 });

  const admins = (eligibleQ.data?.data ?? []).map(a => ({
    id: a.id,
    admin_name: a.admin_name,
    role_name:  a.role_name,
    active_count: a.active_message_count ?? 0,
  }));

  // Convert active rows to AssignableItem[] for the searchable picker
  // status: 1 = active, 0 = archived
  const items = rows
    .filter(r => r.status !== 0)
    .map(r => ({
      id: r.id,
      label: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email || r.phone || "Anonymous",
      subject: r.subject ?? "",
      assigned_to: null as string | null,
    }));

  const logs = (logsRes?.data ?? []).map(l => ({
    id: l.id,
    entity_id: l.message_id,
    action_type: l.action_type,
    from_admin_name: l.from_admin_name,
    to_admin_name:   l.to_admin_name,
    changed_by_name: l.changed_by_name,
    created_at: l.created_at,
  }));

  const handleAssign = async (messageId: number, adminId: number) => {
    try {
      const res = await assignMut.mutateAsync({ message_id: messageId, admin_id: adminId });
      toast.success(res.message);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Assignment failed");
    }
  };

  return (
    <SupportAssignTab
      domain="contact"
      isSuperAdmin={isSuperAdmin}
      currentAdminId={admin?.id ?? 0}
      admins={admins}
      items={items}
      itemsLoading={rowsLoading}
      logs={logs}
      logsLoading={logsLoading}
      isPending={assignMut.isPending}
      onAssign={handleAssign}
    />
  );
}

