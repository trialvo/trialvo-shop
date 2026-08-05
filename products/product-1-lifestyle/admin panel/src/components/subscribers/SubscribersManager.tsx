import { useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  ToggleLeft,
  ToggleRight,
  ShieldBan,
  ShieldCheck,
  Loader2,
  Mail,
  User,
  RefreshCw,
} from "lucide-react";
import {
  useSubscribers,
  useToggleSubscription,
  useToggleBan,
} from "@/hooks/useSubscribers";
import type { Subscriber } from "@/api/subscribers.api";
import type { GetSubscribersParams } from "@/api/subscribers.api";

const LIMIT = 20;

type FilterType = "all" | "subscribed" | "unsubscribed" | "suspended";

const filterTabs: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Subscribed", value: "subscribed" },
  { label: "Unsubscribed", value: "unsubscribed" },
  { label: "Banned", value: "suspended" },
];

function getStatus(s: Subscriber): {
  label: string;
  color: string;
} {
  if (s.suspended_at) return { label: "Banned", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (s.status === 1) return { label: "Subscribed", color: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" };
  return { label: "Unsubscribed", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" };
}

export default function SubscribersManager() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [offset, setOffset] = useState(0);
  const [actingId, setActingId] = useState<number | null>(null);

  const params: GetSubscribersParams = {
    limit: LIMIT,
    offset,
    ...(filter !== "all" ? { type: filter as any } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, refetch } = useSubscribers(params);
  const toggleSubMutation = useToggleSubscription();
  const toggleBanMutation = useToggleBan();

  const subscribers: Subscriber[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setOffset(0);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setOffset(0);
    setSearch("");
    setSearchInput("");
  };

  const handleToggleSub = async (s: Subscriber) => {
    if (s.suspended_at) {
      toast.error("Unban this subscriber before toggling subscription.");
      return;
    }
    setActingId(s.id);
    try {
      const res = await toggleSubMutation.mutateAsync({ id: s.id });
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed.");
    } finally {
      setActingId(null);
    }
  };

  const handleToggleBan = async (s: Subscriber) => {
    const isBanned = !!s.suspended_at;
    setActingId(s.id);
    try {
      const res = await toggleBanMutation.mutateAsync({
        id: s.id,
        effect_linked_account: false,
      });
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscribers
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} total • manage newsletter subscriptions
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email or name…"
              className="h-9 pl-9 pr-4 w-64 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-brand-500 text-sm text-white font-medium hover:bg-brand-600 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setOffset(0); }}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────── */}
      <div className="flex gap-1 px-6 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === tab.value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-6 py-3 text-left font-medium">Subscriber</th>
              <th className="px-4 py-3 text-left font-medium">Linked User</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Subscribed At</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-brand-500" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <p className="text-red-500 mb-3">Failed to load subscribers.</p>
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 text-sm text-brand-500 hover:underline"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  No subscribers found.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => {
                const status = getStatus(s);
                const isBusy = actingId === s.id;
                const isBanned = !!s.suspended_at;

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Email */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          <Mail size={14} />
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {s.email}
                        </span>
                      </div>
                    </td>

                    {/* Linked User */}
                    <td className="px-4 py-3">
                      {s.first_name || s.last_name ? (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <User size={13} />
                          <span>
                            {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Guest</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Subscribed At */}
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {s.subscribed_at
                        ? new Date(s.subscribed_at).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Toggle Sub */}
                        <button
                          onClick={() => handleToggleSub(s)}
                          disabled={isBusy || isBanned}
                          title={
                            isBanned
                              ? "Unban before toggling"
                              : s.status === 1
                              ? "Unsubscribe"
                              : "Resubscribe"
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 transition-colors"
                        >
                          {isBusy ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : s.status === 1 ? (
                            <ToggleRight size={14} className="text-success-500" />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                        </button>

                        {/* Toggle Ban */}
                        <button
                          onClick={() => handleToggleBan(s)}
                          disabled={isBusy}
                          title={isBanned ? "Unban subscriber" : "Ban subscriber"}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            isBanned
                              ? "border-success-200 bg-success-50 text-success-600 hover:bg-success-100 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400"
                              : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isBanned ? (
                            <ShieldCheck size={13} />
                          ) : (
                            <ShieldBan size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 text-sm">
          <span className="text-gray-500">
            Page {currentPage} of {totalPages} &nbsp;·&nbsp; {total} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
