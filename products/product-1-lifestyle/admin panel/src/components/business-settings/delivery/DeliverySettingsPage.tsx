// src/components/delivery-settings/DeliverySettingsPage.tsx
"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { Pagination } from "@/components/ui";

import AddCourierModal from "./AddCourierModal";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

import {
  deleteDeliveryCharge,
  getDeliveryCharges,
  updateDeliveryCharge,
} from "@/api/delivery-charges.api";
import { deliveryTypeLabel } from "./types";

function formatHeaderTime(d: Date): string {
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${month} ${day}, ${year} at ${time}`;
}

export default function DeliverySettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [search, setSearch] = useState("");

  // API pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  // modal (create/edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string | null>(
    null
  );

  const listQuery = useQuery({
    queryKey: ["deliveryCharges", { limit: pageSize, offset }],
    queryFn: () => getDeliveryCharges({ limit: pageSize, offset }),
    retry: 1,
  });

  const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((c) => {
      const title = String(c.title ?? "").toLowerCase();
      const type = String(c.type ?? "").toLowerCase();

      return (
        title.includes(q) ||
        type.includes(q) ||
        String(c.customer_charge ?? "").includes(q) ||
        String(c.our_charge ?? "").includes(q)
      );
    });
  }, [rows, search]);

  const invalidate = () =>
    qc
      .invalidateQueries({ queryKey: ["deliveryCharges"] })
      .catch(() => undefined);

  const toggleMutation = useMutation({
    mutationFn: (payload: { id: number; status: boolean }) =>
      updateDeliveryCharge(payload.id, { status: payload.status }),
    onSuccess: () => {
      toast.success(t("businessSettings.delivery.areaUpdated"));
      invalidate();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update status";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDeliveryCharge(id),
    onSuccess: () => {
      toast.success(t("businessSettings.delivery.areaDeleted"));
      setDeleteOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetTitle(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to delete";
      toast.error(msg);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const totalItems = listQuery.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button startIcon={<Plus size={16} />} onClick={openCreate}>
          {t("businessSettings.delivery.addNew")}
        </Button>

        <div className="relative w-full md:max-w-sm">
          <Input
            startIcon={<Search size={16} className="text-gray-400" />}
            className="pl-9"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(String(e.target.value))}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {listQuery.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[220px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))
          : filtered.map((card) => {
            const imgUrl = card.img_path ? toPublicUrl(card.img_path) : null;

            return (
              <div
                key={card.id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt={card.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Logo
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                          {card.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {deliveryTypeLabel(card.type)}
                        </p>
                      </div>
                    </div>

                    <Switch
                      key={`st-${card.id}-${card.status}`}
                      label=""
                      defaultChecked={card.status}
                      onChange={(checked) =>
                        toggleMutation.mutate({
                          id: card.id,
                          status: checked,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    />
                  </div>

                  <p className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
                    {card.customer_charge}{" "}
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      BDT
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("businessSettings.delivery.ourCost")}:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {card.our_charge} BDT
                    </span>
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {t("common.create")} : {new Date(card.created_at).toLocaleString()}
                    </p>
                    <p>
                      {t("common.update")} : {new Date(card.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                  {/* ✅ View Settings => Edit (open modal) */}
                  <button
                    type="button"
                    className={cn(
                      "text-sm font-semibold text-brand-500 hover:text-brand-600"
                    )}
                    onClick={() => openEdit(card.id)}
                  >
                    {t("businessSettings.payment.viewSettings")}
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900 dark:text-error-300 dark:hover:bg-error-500/10"
                    onClick={() => {
                      setDeleteTargetId(card.id);
                      setDeleteTargetTitle(card.title);
                      setDeleteOpen(true);
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

        {!listQuery.isLoading && filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {t("businessSettings.delivery.noAreas")}
          </div>
        ) : null}
      </div>

      {/* Pagination (API) */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Pagination
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {/* ✅ One modal for both create/edit */}
      <AddCourierModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        editId={editingId ?? undefined}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSaved={() => {
          invalidate();
          setRefreshedAt(new Date());
          setModalOpen(false);
          setEditingId(null);
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title={t("businessSettings.delivery.deleteTitle")}
        message={
          deleteTargetTitle
            ? t("businessSettings.delivery.confirmDeleteNamed", { name: deleteTargetTitle })
            : t("businessSettings.delivery.confirmDeleteGeneric")
        }
        confirmText={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        cancelText={t("common.cancel")}
        tone="danger"
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteOpen(false);
          setDeleteTargetId(null);
          setDeleteTargetTitle(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          deleteMutation.mutate(deleteTargetId);
        }}
      />
    </div>
  );
}
