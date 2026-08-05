"use client";

import React from "react";
import { RefreshCcw } from "lucide-react";
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import type { GuestOrder, GuestOrderStatus, SortBy } from "./types";

import GuestOrdersHeader from "./GuestOrdersHeader";
import GuestOrdersToolbar from "./GuestOrdersToolbar";
import GuestOrdersTable from "./GuestOrdersTable";
import { Pagination } from "@/components/ui";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

import {
  deleteGuestOrder,
  getGuestOrders,
  guestOrdersKeys,
  type GuestOrdersListParams,
  type GuestOrderListItem,
} from "@/api/guest-orders.api";

const statusTabs: Array<{ label: string; value: "all" | GuestOrderStatus }> = [
  { label: "Total", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Complete", value: "complete" },
  { label: "Cancelled", value: "cancelled" },
];

const sortOptions: Array<{ label: string; value: SortBy }> = [
  { label: "by: Date", value: "date_desc" },
  { label: "by: Date (Oldest)", value: "date_asc" },
];

function refreshedLabel(d: Date) {
  const month = d.toLocaleString(undefined, { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${month} ${day}, ${year} at ${time}`;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const formatAmount = (n: number) => {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 BDT";
  return `${v.toLocaleString("en-US")} BDT`;
};

const toRow = (o: GuestOrderListItem): GuestOrder => {
  const name = o.name?.trim() || "Guest";
  const location = [o.city, o.full_address].filter(Boolean).join(", ") || "-";
  return {
    id: o.id,
    orderId: o.order_id,
    customerName: name,
    email: o.email || "-",
    phone: o.phone || "-",
    createdAt: new Date(o.created_at),
    timeLabel: formatTime(o.created_at),
    cartTotal: formatAmount(o.grand_total),
    status: o.status,
    locationLabel: location,
    paymentStatus: o.payment_status,
    paymentType: o.payment_type,
    isDeleted: Boolean(o.deleted_at),
  };
};

const GuestOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"all" | GuestOrderStatus>("all");
  const [sortBy, setSortBy] = React.useState<SortBy>("date_desc");
  const [search, setSearch] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [refreshedAt, setRefreshedAt] = React.useState<Date>(new Date());
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const onClear = () => {
    setActiveTab("all");
    setSortBy("date_desc");
    setSearch("");
    setPage(1);
  };

  const baseParams = React.useMemo<GuestOrdersListParams | undefined>(() => {
    const sortOrder: GuestOrdersListParams["sort_order"] =
      sortBy === "date_asc" ? "asc" : "desc";
    const trimmed = search.trim();
    const hasBase = Boolean(trimmed) || sortBy !== "date_desc";

    if (!hasBase) return undefined;

    return {
      search: trimmed ? trimmed : undefined,
      sort_order: sortOrder,
    };
  }, [search, sortBy]);

  const listParams = React.useMemo<GuestOrdersListParams | undefined>(() => {
    if (!baseParams && page === 1 && activeTab === "all") return undefined;

    return {
      ...(baseParams ?? {}),
      status: activeTab === "all" ? undefined : activeTab,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
  }, [baseParams, activeTab, page, pageSize]);

  const queryParams: GuestOrdersListParams = listParams ?? {};

  const listQuery = useQuery({
    queryKey: guestOrdersKeys.list(queryParams),
    queryFn: () => getGuestOrders(queryParams),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const allCountQuery = useQuery({
    queryKey: guestOrdersKeys.list({ ...(baseParams ?? {}), limit: 1, offset: 0 }),
    queryFn: () => getGuestOrders({ ...(baseParams ?? {}), limit: 1, offset: 0 }),
    retry: 1,
    staleTime: 30_000,
  });

  const countsQueries = useQueries({
    queries: (["pending", "complete", "cancelled"] as GuestOrderStatus[]).map((s) => ({
      queryKey: guestOrdersKeys.list({ ...(baseParams ?? {}), status: s, limit: 1, offset: 0 }),
      queryFn: () => getGuestOrders({ ...(baseParams ?? {}), status: s, limit: 1, offset: 0 }),
      retry: 1,
      staleTime: 30_000,
    })),
  });

  const counts = React.useMemo(() => {
    const pending = countsQueries[0]?.data?.total ?? 0;
    const complete = countsQueries[1]?.data?.total ?? 0;
    const cancelled = countsQueries[2]?.data?.total ?? 0;
    const all = allCountQuery.data?.total ?? pending + complete + cancelled;
    return { all, pending, complete, cancelled };
  }, [countsQueries, allCountQuery.data?.total]);

  const rows = React.useMemo(() => {
    const list = listQuery.data?.guest_orders ?? [];
    return list.map(toRow);
  }, [listQuery.data]);

  const deleteOrderLabel = React.useMemo((): React.ReactNode => {
    if (!deleteTarget) return undefined;
    const row = rows.find((r) => String(r.id) === deleteTarget);
    if (!row) return undefined;
    return (
      <span className="flex flex-col gap-0.5">
        <span>
          <span className="font-normal text-gray-500 dark:text-gray-400">Order placed by&nbsp;·&nbsp;</span>
          <span className="font-semibold">{row.customerName}</span>
        </span>
        {row.orderId != null && (
          <span>
            <span className="font-normal text-gray-500 dark:text-gray-400">Order ID&nbsp;·&nbsp;</span>
            <span className="font-semibold">#{row.orderId}</span>
          </span>
        )}
      </span>
    );
  }, [deleteTarget, rows]);

  const totalItems = listQuery.data?.total ?? 0;

  const tabBadges: Record<"all" | GuestOrderStatus, number> = {
    all: counts.all,
    pending: counts.pending,
    complete: counts.complete,
    cancelled: counts.cancelled,
  };

  const refreshedAtText = React.useMemo(() => refreshedLabel(refreshedAt), [refreshedAt]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGuestOrder(id),
    onSuccess: () => {
      toast.success(t("guestOrders.guestOrderDeleted"));
      qc.invalidateQueries({ queryKey: guestOrdersKeys.all }).catch(() => undefined);
    },
    onError: (err: any) => {
      const msg = err?.message ?? t("guestOrders.failedDeleteGuest");
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-4">
      {/* Title + Tabs + Refresh */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <GuestOrdersHeader
          title={t("guestOrders.title")}
          tabs={statusTabs}
          activeTab={activeTab}
          onTabChange={(v) => {
            setActiveTab(v);
            setPage(1);
          }}
          badgeCounts={tabBadges}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="hidden sm:inline">{t("guestOrders.dataRefreshed")}</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              onClick={() => {
                qc.invalidateQueries({ queryKey: guestOrdersKeys.all }).catch(() => undefined);
                setRefreshedAt(new Date());
              }}
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-white">
            {refreshedAtText}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <GuestOrdersToolbar
          sortOptions={sortOptions}
          sortBy={sortBy}
          onSortChange={(v) => {
            setSortBy(v);
            setPage(1);
          }}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={onClear}
        />
      </div>

      {/* Table */}
      <GuestOrdersTable
        orders={rows}
        onDelete={(id) => setDeleteTarget(id)}
        deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
        }}
        loading={deleteMutation.isPending}
        title={t("guestOrders.deleteConfirmTitle", "Delete Guest Order?")}
        subtitle={t("guestOrders.deleteConfirmDesc", "This action cannot be undone. The guest order will be permanently removed.")}
        message={deleteOrderLabel}
        consequenceLines={[
          t("guestOrders.deleteEffect1", "The order record will be permanently deleted"),
          t("guestOrders.deleteEffect2", "Customer & payment info linked to this order will be lost"),
          t("guestOrders.deleteEffect3", "This cannot be recovered or reversed"),
        ]}
        confirmLabel={t("guestOrders.deleteConfirmBtn", "Yes, Delete")}
        cancelLabel={t("guestOrders.deleteCancel", "Cancel")}
      />

      <Pagination
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        className="shadow-none"
      />
    </div>
  );
};

export default GuestOrdersPage;
export { GuestOrdersPage };
