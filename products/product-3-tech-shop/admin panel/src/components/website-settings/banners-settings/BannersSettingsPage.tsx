"use client";

import React, { useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Select from "@/components/form/Select";
import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";

import {
  deleteBanner,
  getBanners,
  updateBanner,
  type BannerApi,
  type GetBannersParams,
} from "@/api/banners.api";

import { toPublicUrl } from "@/utils/toPublicUrl";
import BannerModal from "./BannerModal";
import type { BannerRow } from "./types";
import {
  mapFeaturedFilterToApi,
  mapStatusFilterToApi,
  TYPES,
  ZONES,
} from "./banner.constants";

function getApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return "Something went wrong!";
}

function compactParams(input: GetBannersParams) {
  const out: Record<string, any> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as GetBannersParams;
}

function mapApiToRow(b: BannerApi): BannerRow {
  return {
    id: b.id,
    title: b.title,
    zone: b.zone,
    type: b.type,

    // ✅ new
    path: b.path ?? null,

    imgPath: b.img_path ? toPublicUrl(b.img_path) : null,

    status: Boolean(b.status),
    featured: Boolean(b.featured),

    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label={t("banners.confirm.closeOverlay")}
      />
      <div className="relative w-[92vw] max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? t("banners.confirm.deleting") : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BannersSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // ✅ initial filters empty => initial call becomes GET /api/v1/banners (NO QUERY)
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [featuredFilter, setFeaturedFilter] = useState<string>("");

  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [offset, setOffset] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"" | "asc" | "desc">("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<BannerRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryParams: GetBannersParams = useMemo(() => {
    const params: GetBannersParams = {
      search: search.trim() ? search.trim() : undefined,
      zone: zone || undefined,
      type: type || undefined,

      status: mapStatusFilterToApi(statusFilter),
      featured: mapFeaturedFilterToApi(featuredFilter),

      limit,
      offset,
      sort_by: sortBy || undefined,
      sort_order: sortOrder || undefined,
    };

    return compactParams(params);
  }, [search, zone, type, statusFilter, featuredFilter, limit, offset, sortBy, sortOrder]);

  const bannersQuery = useQuery({
    queryKey: ["banners", queryParams],
    queryFn: () => getBanners(queryParams),
    staleTime: 20_000,
    retry: 1,
  });

  const rows = useMemo(() => {
    const list = bannersQuery.data?.banners ?? [];
    return list.map(mapApiToRow);
  }, [bannersQuery.data]);

  const total = bannersQuery.data?.total ?? 0;
  const serverLimit = bannersQuery.data?.limit;
  const serverOffset = bannersQuery.data?.offset;

  const effectiveLimit = limit ?? serverLimit ?? 20;
  const effectiveOffset = offset ?? serverOffset ?? 0;

  const pageLabel = useMemo(() => {
    const from = total === 0 ? 0 : effectiveOffset + 1;
    const to = Math.min(effectiveOffset + effectiveLimit, total);
    return t("banners.filters.pageLabel", { from, to, total });
  }, [effectiveOffset, effectiveLimit, t, total]);

  const currentPage = Math.floor(effectiveOffset / Math.max(1, effectiveLimit)) + 1;

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: BannerRow) => {
    setModalMode("edit");
    setEditing(row);
    setModalOpen(true);
  };

  const requestDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("banners.toast.deleted"));
        qc.invalidateQueries({ queryKey: ["banners"] });
        setDeleteOpen(false);
        setDeleteId(null);
        return;
      }
      toast.error(res?.message || res?.error || t("banners.toast.deleteFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  // inline toggles still update only changed field
  const updateInlineMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: any }) => updateBanner(id, patch),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        qc.invalidateQueries({ queryKey: ["banners"] });
        toast.success(t("banners.toast.updated"));
        return;
      }
      toast.error(res?.message || res?.error || t("banners.toast.updateFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const toggleFeatured = (id: number, checked: boolean) => {
    updateInlineMut.mutate({ id, patch: { featured: Boolean(checked) } });
  };

  const toggleStatus = (id: number, checked: boolean) => {
    updateInlineMut.mutate({ id, patch: { status: Boolean(checked) } });
  };

  const zoneLabelKey: Record<string, string> = {
    "Home Top": "homeTop",
    "Home Middle": "homeMiddle",
    "Home Bottom": "homeBottom",
    "Category Page": "categoryPage",
    "Product Page": "productPage",
    Campaign: "campaign",
  };

  const typeLabelKey: Record<string, string> = {
    Default: "default",
  };

  const zoneOptions = useMemo(
    () => [
      { value: "", label: t("banners.filters.allZones") },
      ...ZONES.map((z) => ({
        value: z,
        label: t(`banners.zones.${zoneLabelKey[z] ?? "default"}`, { defaultValue: z }),
      })),
    ],
    [t]
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("banners.filters.allTypes") },
      ...TYPES.map((tValue) => ({
        value: tValue,
        label: t(`banners.types.${typeLabelKey[tValue] ?? "default"}`, { defaultValue: tValue }),
      })),
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("banners.filters.statusAll") },
      { value: "active", label: t("banners.filters.statusActive") },
      { value: "inactive", label: t("banners.filters.statusInactive") },
    ],
    [t]
  );

  const featuredOptions = useMemo(
    () => [
      { value: "", label: t("banners.filters.featuredAll") },
      { value: "featured", label: t("banners.filters.featured") },
      { value: "not_featured", label: t("banners.filters.notFeatured") },
    ],
    [t]
  );

  const tableHeaders = useMemo(
    () => [
      t("banners.table.sl"),
      t("banners.table.title"),
      t("banners.table.zone"),
      t("banners.table.type"),
      t("banners.table.path"),
      t("banners.table.featured"),
      t("banners.table.status"),
      t("banners.table.action"),
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("banners.title")}
        </h1>
      </div>

      {/* Actions + Filters */}
      <div className="rounded-[6px] border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Button onClick={openCreate} startIcon={<Plus size={16} />}>
              {t("banners.actions.addNew")}
            </Button>

            <div className="w-full lg:max-w-sm">
              <Input
                startIcon={<Search size={16} className="text-gray-400" />}
                className="pl-9"
                placeholder={t("banners.actions.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                  if (!limit) setLimit(20);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              options={zoneOptions}
              placeholder={t("banners.filters.zonePlaceholder")}
              defaultValue={zone}
              onChange={(v) => {
                setZone(String(v));
                setOffset(0);
                if (!limit) setLimit(20);
              }}
            />

            <Select
              options={typeOptions}
              placeholder={t("banners.filters.typePlaceholder")}
              defaultValue={type}
              onChange={(v) => {
                setType(String(v));
                setOffset(0);
                if (!limit) setLimit(20);
              }}
            />

            <Select
              options={statusOptions}
              placeholder={t("banners.filters.statusPlaceholder")}
              defaultValue={statusFilter}
              onChange={(v) => {
                setStatusFilter(String(v));
                setOffset(0);
                if (!limit) setLimit(20);
              }}
            />

            <Select
              options={featuredOptions}
              placeholder={t("banners.filters.featuredPlaceholder")}
              defaultValue={featuredFilter}
              onChange={(v) => {
                setFeaturedFilter(String(v));
                setOffset(0);
                if (!limit) setLimit(20);
              }}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-[6px] border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                options={[
                  { value: "", label: t("banners.filters.serverDefaultLimit") },
                  { value: "10", label: t("banners.filters.limit", { count: 10 }) },
                  { value: "20", label: t("banners.filters.limit", { count: 20 }) },
                  { value: "50", label: t("banners.filters.limit", { count: 50 }) },
                ]}
                placeholder={t("banners.filters.limitPlaceholder")}
                defaultValue={limit ? String(limit) : ""}
                onChange={(v) => {
                  const val = String(v);
                  setLimit(val ? Number(val) : undefined);
                  setOffset(val ? 0 : undefined);
                }}
              />

              <Select
                options={[
                  { value: "", label: t("banners.filters.sortDefault") },
                  { value: "created_at", label: t("banners.filters.sortCreatedAt") },
                  { value: "updated_at", label: t("banners.filters.sortUpdatedAt") },
                  { value: "title", label: t("banners.filters.sortTitle") },
                ]}
                placeholder={t("banners.filters.sortPlaceholder")}
                defaultValue={sortBy}
                onChange={(v) => {
                  setSortBy(String(v));
                  setOffset(0);
                  if (!limit) setLimit(20);
                }}
              />

              <Select
                options={[
                  { value: "", label: t("banners.filters.orderDefault") },
                  { value: "desc", label: t("banners.filters.orderDesc") },
                  { value: "asc", label: t("banners.filters.orderAsc") },
                ]}
                placeholder={t("banners.filters.orderPlaceholder")}
                defaultValue={sortOrder}
                onChange={(v) => {
                  setSortOrder(String(v) as any);
                  setOffset(0);
                  if (!limit) setLimit(20);
                }}
              />

              <span className="text-xs text-gray-500 dark:text-gray-400">{pageLabel}</span>
            </div>

            <Button
              variant="outline"
              startIcon={<Download size={16} />}
              onClick={() => toast(t("banners.toast.exportNote"))}
            >
              {t("banners.actions.export")}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("banners.table.listTitle")}
            </h3>
            <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {total}
            </span>
          </div>

          {bannersQuery.isFetching ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("banners.table.refreshing")}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                {tableHeaders.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-left text-xs font-semibold text-brand-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {bannersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4" colSpan={8}>
                      <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                    </td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(effectiveOffset ?? 0) + idx + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                          {row.imgPath ? (
                            <img
                              src={row.imgPath}
                              alt="banner"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              {t("banners.table.noImage")}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">#{row.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.zone}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.type}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.path ? (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                          {row.path}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{t("banners.table.null")}</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <Switch
                        key={`feat-${row.id}-${row.featured}`}
                        label=""
                        defaultChecked={row.featured}
                        onChange={(checked) => toggleFeatured(row.id, checked)}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <Switch
                        key={`status-${row.id}-${row.status}`}
                        label=""
                        defaultChecked={row.status}
                        onChange={(checked) => toggleStatus(row.id, checked)}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                            "border-gray-200 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50",
                            "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                          )}
                          onClick={() => openEdit(row)}
                          aria-label={t("banners.actions.edit")}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                            "border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50",
                            "dark:border-error-900/40 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10"
                          )}
                          onClick={() => requestDelete(row.id)}
                          aria-label={t("banners.actions.delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t("banners.table.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={total}
          page={currentPage}
          pageSize={effectiveLimit}
          onPageChange={(next) => {
            setLimit((p) => p ?? effectiveLimit);
            setOffset(Math.max(0, (next - 1) * effectiveLimit));
          }}
          onPageSizeChange={(next) => {
            setLimit(next);
            setOffset(0);
          }}
          className="shadow-none"
        />
      </div>

      <BannerModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t("banners.confirm.title")}
        description={t("banners.confirm.description")}
        confirmText={t("banners.confirm.confirmText")}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
