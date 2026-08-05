import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button/Button";
import { getAdminUsers, type AdminUserEntity } from "@/api/admin-users.api";

type Props = {
  value: number | null;
  onChange: (user: AdminUserEntity | null) => void;
  disabled?: boolean;
  className?: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function userLabel(u: AdminUserEntity) {
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  const phone = u.phones?.[0]?.phone_number ?? "";
  if (name && phone) return `${name} • ${phone}`;
  if (name) return name;
  if (phone) return phone;
  return u.email;
}

export default function CustomerSearchDropdown({
  value,
  onChange,
  disabled = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const debouncedQ = useDebouncedValue(q.trim(), 350);

  const query = useInfiniteQuery({
    queryKey: ["adminUsersForSale", debouncedQ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getAdminUsers({
        limit: 20,
        offset: pageParam,
        search: debouncedQ ? debouncedQ : undefined,
      }),
    getNextPageParam: (last) => {
      const nextOffset = last.meta.offset + last.meta.limit;
      return nextOffset < last.meta.total ? nextOffset : undefined;
    },
    enabled: open, // load only when dropdown opens
  });

  const users = React.useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.flatMap((p) => p.users);
  }, [query.data]);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return users.find((u) => u.id === value) ?? null;
  }, [users, value]);

  // Close on outside click
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 transition",
          "focus:border-brand-500 focus:outline-none",
          "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        <span className={cn("min-w-0 truncate", !selected && "text-gray-400")}>
          {selected ? userLabel(selected) : t("sales.selectCustomerDropdown")}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-950">
          {/* search input */}
          <div className="border-b border-gray-200 p-3 dark:border-gray-800">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
              <Search size={16} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("sales.searchByNameEmailPhoneShort")}
                className="w-full bg-transparent text-sm text-gray-700 outline-none dark:text-gray-200"
              />
            </div>
          </div>

          {/* list */}
          <div className="max-h-72 overflow-auto custom-scrollbar p-2">
            {query.isLoading ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{t("sales.loading")}</div>
            ) : users.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {t("sales.noCustomersFoundShort")}
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((u) => {
                  const active = u.id === value;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onChange(u);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        active
                          ? "bg-gray-100 text-gray-900 dark:bg-white/[0.06] dark:text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-medium">{userLabel(u)}</span>
                        <span className="shrink-0 text-xs text-gray-400">#{u.id}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {u.email}
                      </div>
                    </button>
                  );
                })}

                {query.hasNextPage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    isLoading={query.isFetchingNextPage}
                    loadingText={t("sales.loading")}
                  >
                    {t("sales.loadMore")}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
