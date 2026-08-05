"use client";

import React, { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Film,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";

import {
  deleteBannerVideo,
  getBannerVideos,
  type BannerVideoApi,
  type BannerVideosListParams,
} from "@/api/banner-videos.api";

import { toPublicUrl } from "@/utils/toPublicUrl";
import BannerVideoModal from "./BannerVideoModal";
import type { BannerVideoRow } from "./types";
import ConfirmDeleteModal from "@/components/ui/modal/ConfirmDeleteModal";

function getApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return "Something went wrong!";
}

function mapApiToRow(v: BannerVideoApi): BannerVideoRow {
  return {
    id: v.id,
    productId: v.product_id ?? null,
    productName: v.product_name ?? null,
    label: v.label ?? null,
    videoUrl: v.video_url,
    path: v.path ?? null,
    thumb: v.thumb ?? null,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  };
}

function shortText(value: string, max = 40) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function safeCopy(text: string, t: (key: string, options?: any) => string) {
  try {
    void navigator.clipboard.writeText(text);
    toast.success(t("bannerVideos.toast.copied"));
  } catch {
    toast.error(t("bannerVideos.toast.copyFailed"));
  }
}

export default function BannerVideoSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [limit, setLimit] = useState<number | undefined>(20);
  const [offset, setOffset] = useState<number | undefined>(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<BannerVideoRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryParams: BannerVideosListParams = useMemo(
    () => ({
      limit,
      offset,
    }),
    [limit, offset]
  );

  const videosQuery = useQuery({
    queryKey: ["banner-videos", queryParams],
    queryFn: () => getBannerVideos(queryParams),
    staleTime: 20_000,
    retry: 1,
  });

  const rows = useMemo(() => {
    const list = videosQuery.data?.data ?? [];
    return list.map(mapApiToRow);
  }, [videosQuery.data]);

  const total = videosQuery.data?.meta?.total ?? rows.length;
  const serverLimit = videosQuery.data?.meta?.limit;
  const serverOffset = videosQuery.data?.meta?.offset;

  const effectiveLimit = limit ?? serverLimit ?? 20;
  const effectiveOffset = offset ?? serverOffset ?? 0;

  const currentPage = Math.floor(effectiveOffset / Math.max(1, effectiveLimit)) + 1;

  const pageLabel = useMemo(() => {
    const from = total === 0 ? 0 : effectiveOffset + 1;
    const to = Math.min(effectiveOffset + effectiveLimit, total);
    return t("bannerVideos.pageLabel", { from, to, total });
  }, [effectiveOffset, effectiveLimit, t, total]);

  const linkedCount = rows.filter((r) => r.productId).length;
  const unlinkedCount = rows.length - linkedCount;

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: BannerVideoRow) => {
    setModalMode("edit");
    setEditing(row);
    setModalOpen(true);
  };

  const requestDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBannerVideo(id),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("bannerVideos.toast.deleted"));
        qc.invalidateQueries({ queryKey: ["banner-videos"] });
        setDeleteOpen(false);
        setDeleteId(null);
        return;
      }
      toast.error(res?.message || res?.error || t("bannerVideos.toast.deleteFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("bannerVideos.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("bannerVideos.subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            startIcon={<RefreshCw size={16} />}
            onClick={() => qc.invalidateQueries({ queryKey: ["banner-videos"] })}
          >
            {t("bannerVideos.actions.refresh")}
          </Button>
          <Button startIcon={<Plus size={16} />} onClick={openCreate}>
            {t("bannerVideos.actions.add")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.total")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {total}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.totalHint")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.linked")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {linkedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.onThisPage")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.standalone")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {unlinkedCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.onThisPage")}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("bannerVideos.stats.pageSize")}
          </p>
          <div className="mt-2">
            <Select
              options={[
                { value: "10", label: t("bannerVideos.stats.limit", { count: 10 }) },
                { value: "20", label: t("bannerVideos.stats.limit", { count: 20 }) },
                { value: "50", label: t("bannerVideos.stats.limit", { count: 50 }) },
              ]}
              placeholder={t("bannerVideos.stats.limitPlaceholder")}
              defaultValue={String(effectiveLimit)}
              onChange={(v) => {
                const next = Number(v);
                setLimit(next);
                setOffset(0);
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{pageLabel}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("bannerVideos.table.title")}
            </h3>
            <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {total}
            </span>
          </div>
          {videosQuery.isFetching ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("bannerVideos.table.refreshing")}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                {[
                  t("bannerVideos.table.sl"),
                  t("bannerVideos.table.preview"),
                  t("bannerVideos.table.label"),
                  t("bannerVideos.table.product"),
                  t("bannerVideos.table.path"),
                  t("bannerVideos.table.videoUrl"),
                  t("bannerVideos.table.updated"),
                  t("bannerVideos.table.action"),
                ].map((h) => (
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
              {videosQuery.isLoading ? (
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
                      <div className="h-12 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                        {row.thumb ? (
                          <img
                            src={toPublicUrl(row.thumb)}
                            alt={t("bannerVideos.table.thumbAlt")}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Film size={18} />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {row.label || t("bannerVideos.table.untitled")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#{row.id}</p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.productId ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {row.productName || t("bannerVideos.table.linkedProduct")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("bannerVideos.table.productId", { id: row.productId })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {t("bannerVideos.table.standalone")}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {row.path ? (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                          {row.path}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {t("bannerVideos.table.null")}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[240px] truncate text-xs text-gray-600 dark:text-gray-300">
                          {shortText(row.videoUrl, 38)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => safeCopy(row.videoUrl, t)}
                          ariaLabel={t("bannerVideos.actions.copy")}
                          startIcon={<Copy size={14} />}
                        />
                        <a
                          href={row.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-md border",
                            "border-gray-200 bg-white text-gray-600 shadow-theme-xs hover:bg-gray-50",
                            "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                          )}
                          aria-label={t("bannerVideos.actions.open")}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(row)}
                          ariaLabel={t("bannerVideos.actions.edit")}
                          startIcon={<Pencil size={16} />}
                        />

                        <Button
                          variant="danger"
                          size="icon"
                          onClick={() => requestDelete(row.id)}
                          ariaLabel={t("bannerVideos.actions.delete")}
                          startIcon={<Trash2 size={16} />}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t("bannerVideos.table.empty")}
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
          className="shadow-none"
        />
      </div>

      <BannerVideoModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        title={t("bannerVideos.confirm.title")}
        description={t("bannerVideos.confirm.description")}
        confirmText={t("bannerVideos.confirm.confirmText")}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
