import type { UserAuditLogParams } from "@/api/audit.api";
import PageMeta from "@/components/common/PageMeta";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SectionCard from "@/components/ui/layout/SectionCard";
import { useUserActionKeys, useUserAuditLogs } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Hash,
  Info,
  Lock,
  Search,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

function initials(first: string | null | undefined, last: string | null | undefined): string {
  const f = first?.trim()?.[0] ?? "";
  const l = last?.trim()?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function humanize(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return "";
}

function ValuesDiff({
  old_values,
  new_values,
}: {
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!old_values && !new_values) return <span className="text-gray-400 text-xs italic">No changes</span>;

  const allKeys = Array.from(
    new Set([...Object.keys(old_values ?? {}), ...Object.keys(new_values ?? {})])
  );

  const isSnapshot = !old_values && !!new_values;
  const changeCount = allKeys.length;

  const summaryLabel = isSnapshot
    ? `${changeCount} detail${changeCount !== 1 ? "s" : ""}`
    : `${changeCount} field${changeCount !== 1 ? "s" : ""} updated`;

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200",
          expanded
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
        )}
      >
        {expanded ? <EyeOff size={12} /> : <Eye size={12} />}
        {expanded ? "Hide details" : summaryLabel}
        <ChevronDown
          size={11}
          className={cn("transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {isSnapshot ? "Recorded Values" : "Changed Fields"}
            </p>
            {allKeys.map((k) => {
              const oldVal = old_values?.[k];
              const newVal = new_values?.[k];
              const hasOld = oldVal !== undefined;
              const hasNew = newVal !== undefined;

              return (
                <div key={k} className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-gray-600 dark:text-gray-300 min-w-[80px] shrink-0">{humanize(k)}</span>
                  {hasOld && (
                    <>
                      <span className="rounded-md bg-error-50 px-1.5 py-0.5 text-[11px] text-error-600 dark:bg-error-500/10 dark:text-error-300 line-through">
                        {String(oldVal)}
                      </span>
                      {hasNew && <ArrowRight size={10} className="text-gray-400" />}
                    </>
                  )}
                  {hasNew && (
                    <span className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      hasOld
                        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
                    )}>
                      {String(newVal)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const TABLE_HEADERS = [
  { key: "idx", label: "", icon: Hash, width: "w-[52px]" },
  { key: "user", label: "User", icon: Users, width: "min-w-[180px]" },
  { key: "action", label: "Action", icon: Zap, width: "min-w-[140px]" },
  { key: "ip", label: "IP Address", icon: Globe, width: "min-w-[120px]" },
  { key: "changes", label: "Changes", icon: Info, width: "max-w-xs" },
  { key: "time", label: "Date & Time", icon: Clock, width: "min-w-[140px]" },
] as const;

export default function UserAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: actionKeys = [] } = useUserActionKeys();

  const actionOptions = useMemo(
    () => [
      { value: "", label: "All Actions" },
      ...actionKeys.map((k) => ({ value: k.action_key, label: k.display_name })),
    ],
    [actionKeys],
  );

  const params: UserAuditLogParams = useMemo(
    () => ({
      search: search || undefined,
      action: action || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      limit,
      page,
    }),
    [search, action, dateFrom, dateTo, page]
  );

  const { data, isLoading, isError, error } = useUserAuditLogs(params);
  const is403 = isError && (error as any)?.response?.status === 403;
  const logs = data?.data ?? [];
  const hasMore = data?.has_more ?? false;
  const count = data?.count ?? 0;

  return (
    <>
      <PageMeta title="User Audit Logs" description="Track all user actions in the system" />

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Audit Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full activity trail of user actions including profile changes, orders, and more.{" "}
              {count > 0 && (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {count.toLocaleString()} record{count !== 1 ? "s" : ""} found.
                </span>
              )}
            </p>
          </div>
        </div>

        <SectionCard
          title="Activity Log"
          description="Filter and browse user actions"
          icon={<Users className="h-5 w-5" />}
          noPadding
        >
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <Input
                  startIcon={<Search size={15} className="text-gray-400" />}
                  placeholder="Search by user name or email..."
                  value={search}
                  onChange={(e) => { setSearch(String(e.target.value)); setPage(1); }}
                />
              </div>

              <div className="md:col-span-3">
                <Select
                  options={actionOptions}
                  value={action}
                  onChange={(v) => { setAction(v); setPage(1); }}
                  placeholder="All Actions"
                />
              </div>

              <div className="md:col-span-2">
                <DatePicker
                  placeholder="From date"
                  value={dateFrom}
                  onChange={(v) => { setDateFrom(v); setPage(1); }}
                  max={dateTo || undefined}
                  showToday={false}
                  showClear
                />
              </div>

              <div className="md:col-span-2">
                <DatePicker
                  placeholder="To date"
                  value={dateTo}
                  onChange={(v) => { setDateTo(v); setPage(1); }}
                  min={dateFrom || undefined}
                  showToday
                  showClear
                />
              </div>

              <div className="md:col-span-1 flex items-center">
                {(search || action || dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setAction(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                      "border-gray-200 bg-white text-gray-500 transition-colors",
                      "hover:bg-gray-50 hover:text-gray-700",
                      "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                    )}
                    title="Clear all filters"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/40">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h.key}
                      className={cn("px-5 py-3 text-left", h.width)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <h.icon size={13} className="text-brand-500/70" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {h.label}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
                        <span className="text-sm text-gray-400">Loading user audit logs…</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                        {is403 ? (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                              <Lock size={22} className="text-amber-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Access Restricted</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              You don't have permission to view user audit logs.
                              Please contact a Super Admin if you need access.
                            </p>
                          </>
                        ) : (
                          <>
                            <Shield size={24} className="text-error-400" />
                            <p className="text-sm text-error-500">Something went wrong while loading user audit logs.</p>
                            <p className="text-xs text-gray-400">Please try refreshing the page.</p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={24} className="text-gray-300 dark:text-gray-600" />
                        <span className="text-sm text-gray-400">No user audit logs found.</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((log, idx) => {
                  const fullName = [log.first_name, log.last_name].filter(Boolean).join(" ");
                  const relTime = formatRelativeTime(log.created_at);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50/60 dark:border-gray-800/50 dark:hover:bg-gray-800/20 align-top"
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {log.user_img_path ? (
                              <img
                                src={toPublicUrl(log.user_img_path)}
                                alt={fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials(log.first_name, log.last_name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {fullName || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {log.user_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                          {log.action_display_name ?? humanize(log.action)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.ip_address ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <Globe size={11} className="text-gray-400" />
                            {log.ip_address}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unknown</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <ValuesDiff old_values={log.old_values} new_values={log.new_values} />
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(log.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            {relTime && (
                              <span className="ml-1.5 text-brand-500/70">{relTime}</span>
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-700 dark:text-gray-300">{page}</span> — {logs.length} entr{logs.length !== 1 ? "ies" : "y"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  "border-gray-200 text-gray-600 hover:bg-gray-50",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  "border-gray-200 text-gray-600 hover:bg-gray-50",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
