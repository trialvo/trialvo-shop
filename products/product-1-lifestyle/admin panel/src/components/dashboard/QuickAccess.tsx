import * as React from "react";
import { Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import QuickAccessCard from "./QuickAccessCard";
import QuickAccessManageModal from "./QuickAccessManageModal";

import {
  getQuickAccessList,
  quickAccessKeys,
  updateQuickAccess,
  type ApiQuickAccessItem,
  type QuickAccessListParams,
  type UpdateQuickAccessPayload,
} from "@/api/quick-access.api";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";
import { useTranslation } from "react-i18next";

const MAX_PIN = 6;

function sortQuickAccess(items: ApiQuickAccessItem[]) {
  return [...items].sort((a, b) => {
    const ao = a.sort_order ?? 9999;
    const bo = b.sort_order ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

function mergeUpdatePayload(
  item: ApiQuickAccessItem,
  patch: UpdateQuickAccessPayload
): UpdateQuickAccessPayload {
  // Backend says "nothing required", but we send safe merged data (prevents accidental null/undefined issues)
  return {
    title: patch.title ?? item.title,
    is_pinned: patch.is_pinned ?? item.is_pinned,
    sort_order: patch.sort_order ?? item.sort_order ?? null,
    img_path: patch.img_path ?? item.img_path ?? null,
    path: patch.path ?? item.path ?? null,
  };
}

const QuickAccess: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);

  const pinnedParams: QuickAccessListParams = React.useMemo(
    () => ({ is_pinned: true }),
    []
  );

  // Dashboard list (only pinned)
  const pinnedQuery = useQuery({
    queryKey: quickAccessKeys.list(pinnedParams),
    queryFn: async () => (await getQuickAccessList(pinnedParams)).quick_access,
  });

  // Full list for Manage modal (only fetch when open)
  const allQuery = useQuery({
    queryKey: quickAccessKeys.list({}),
    queryFn: async () => (await getQuickAccessList({})).quick_access,
    enabled: open,
  });

  const pinnedItems = React.useMemo(() => {
    const list = sortQuickAccess(pinnedQuery.data ?? []).filter(
      (i) => i.is_pinned
    );
    return list.slice(0, MAX_PIN);
  }, [pinnedQuery.data]);

  const allItems = React.useMemo(
    () => sortQuickAccess(allQuery.data ?? []),
    [allQuery.data]
  );

  const pinnedCount = React.useMemo(() => {
    if (allItems.length) return allItems.filter((i) => i.is_pinned).length;
    return pinnedItems.length;
  }, [allItems, pinnedItems.length]);

  const mutation = useMutation({
    mutationFn: async (vars: {
      id: number;
      payload: UpdateQuickAccessPayload;
    }) => {
      setUpdatingId(vars.id);
      return updateQuickAccess(vars.id, vars.payload);
    },
    onMutate: ({ id, payload }) => {
      const prevPinned = qc.getQueryData<ApiQuickAccessItem[]>(
        quickAccessKeys.list(pinnedParams)
      );
      const prevAll = qc.getQueryData<ApiQuickAccessItem[]>(
        quickAccessKeys.list({})
      );

      const applyUpdate = (items: ApiQuickAccessItem[] | undefined) => {
        if (!items) return items;
        return items.map((it) => {
          if (it.id !== id) return it;
          return {
            ...it,
            title: payload.title ?? it.title,
            is_pinned: payload.is_pinned ?? it.is_pinned,
            sort_order: payload.sort_order ?? it.sort_order,
            img_path: payload.img_path ?? it.img_path,
            path: payload.path ?? it.path,
          };
        });
      };

      qc.setQueryData(
        quickAccessKeys.list(pinnedParams),
        applyUpdate(prevPinned)
      );
      qc.setQueryData(quickAccessKeys.list({}), applyUpdate(prevAll));

      return { prevPinned, prevAll };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevPinned)
        qc.setQueryData(quickAccessKeys.list(pinnedParams), ctx.prevPinned);
      if (ctx?.prevAll) qc.setQueryData(quickAccessKeys.list({}), ctx.prevAll);
      toast.error(t("dashboard.quickAccess.updateFailed"));
    },
    onSuccess: (res) => {
      toast.success(res.message || t("dashboard.quickAccess.updated"));
    },
    onSettled: async () => {
      setUpdatingId(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: quickAccessKeys.list(pinnedParams) }),
        qc.invalidateQueries({ queryKey: quickAccessKeys.list({}) }),
      ]);
    },
  });

  const handleTogglePin = (item: ApiQuickAccessItem) => {
    const nextPinned = !item.is_pinned;

    if (nextPinned && pinnedCount >= MAX_PIN) {
      toast.error(t("dashboard.quickAccess.maxPinned", { count: MAX_PIN }));
      return;
    }

    const payload = mergeUpdatePayload(item, { is_pinned: nextPinned });
    mutation.mutate({ id: item.id, payload });
  };

  const handleUpdateItem = (
    item: ApiQuickAccessItem,
    patch: UpdateQuickAccessPayload
  ) => {
    const payload = mergeUpdatePayload(item, patch);
    mutation.mutate({ id: item.id, payload });
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("dashboard.quickAccess.title")}
        </h2>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "rounded-lg p-2 text-gray-700 transition hover:bg-gray-100",
            "dark:text-gray-200 dark:hover:bg-white/[0.06]"
          )}
          aria-label={t("dashboard.quickAccess.manageAria")}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Cards (mobile: 3 columns => 3 + 3 in two rows) */}
      {pinnedQuery.isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: MAX_PIN }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "min-h-[92px] rounded-xl border bg-white p-3 shadow-theme-xs",
                "animate-pulse dark:border-gray-800 dark:bg-gray-900"
              )}
            />
          ))}
        </div>
      ) : pinnedQuery.isError ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {t("dashboard.quickAccess.loadFailed")}
        </div>
      ) : pinnedItems.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {t("dashboard.quickAccess.emptyPinned")}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {pinnedItems.map((item) => (
            <QuickAccessCard
              key={item.id}
              id={item.id}
              title={item.title}
              imgUrl={item.img_path ? toPublicUrl(item.img_path) : undefined}
              path={item.path}
            />
          ))}
        </div>
      )}

      {/* Manage Modal */}
      <QuickAccessManageModal
        open={open}
        onClose={() => setOpen(false)}
        items={allItems}
        onTogglePin={handleTogglePin}
        onUpdateItem={handleUpdateItem}
        updatingId={updatingId}
      />
    </section>
  );
};

export default QuickAccess;
