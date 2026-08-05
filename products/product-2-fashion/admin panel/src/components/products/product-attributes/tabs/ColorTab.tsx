// src/components/products/product-attributes/tabs/ColorTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

import { Pagination } from "@/components/ui";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { cn } from "@/lib/utils";

import type { ColorRow, Option, PriorityValue } from "../types";
import { safeNumber } from "../types";
import {
  createColor,
  deleteColor,
  getColor,
  getColors,
  updateColor,
  type Color,
} from "@/api/colors.api";

const STATUS_OPTIONS: Option[] = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const PRIORITY_OPTIONS: Option[] = [
  { value: "all", label: "All Priority" },
  { value: "1", label: "Low" },
  { value: "2", label: "Normal" },
  { value: "3", label: "Medium" },
  { value: "4", label: "High" },
];

function getApiErrorFromResponse(res: any) {
  if (typeof res?.error === "string" && res.error.trim()) return res.error.trim();
  if (typeof res?.message === "string" && res.message.trim()) return res.message.trim();
  if (Number.isFinite(Number(res?.flag)) && Number(res.flag) >= 400) return "Something went wrong";
  return null;
}

function priorityLabel(p: number): string {
  if (p === 1) return "Low";
  if (p === 2) return "Normal";
  if (p === 3) return "Medium";
  if (p === 4) return "High";
  return String(p);
}

function priorityColorClass(p: number): string {
  if (p === 1) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  if (p === 2) return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
  if (p === 3) return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
  if (p === 4) return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  return "bg-gray-100 text-gray-600";
}

function isHexColor(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v.trim());
}

function toRow(c: Color): ColorRow {
  return {
    id: c.id,
    name: c.name,
    name_bd: c.name_bd ?? null,
    hex: c.hex,
    priority: (c.priority ?? 1) as PriorityValue,
    status: Boolean(c.status),
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

function exportCsv(rows: ColorRow[]) {
  const headers = ["id", "name", "hex", "priority", "status", "created_at", "updated_at"];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        JSON.stringify(r.name),
        JSON.stringify(r.hex),
        r.priority,
        r.status,
        JSON.stringify(r.created_at ?? ""),
        JSON.stringify(r.updated_at ?? ""),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `colors_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function TableSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}

type ColorModalMode = "create" | "edit";

type ColorModalState = {
  open: boolean;
  mode: ColorModalMode;
  id?: number;
  hydrated: boolean;

  name: string;
  name_bd: string;
  hex: string;
  priority: PriorityValue;
  status: boolean;
};

function ColorModal({
  state,
  setState,
  onSubmit,
  submitting,
  loadingSingle,
}: {
  state: ColorModalState;
  setState: React.Dispatch<React.SetStateAction<ColorModalState>>;
  onSubmit: () => void;
  submitting: boolean;
  loadingSingle: boolean;
}) {
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (state.open) {
      setIsMounted(true);
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setIsVisible(true))
      );
      return () => window.cancelAnimationFrame(id);
    } else {
      setIsVisible(false);
    }
  }, [state.open]);

  if (!isMounted) return null;

  const handleDialogEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!state.open) setIsMounted(false);
  };

  const isCreate = state.mode === "create";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible ? "opacity 220ms ease" : "opacity 180ms ease-out",
        }}
      />
      <div
        onTransitionEnd={handleDialogEnd}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: isVisible
            ? "opacity 260ms cubic-bezier(0.34,1.56,0.64,1), transform 320ms cubic-bezier(0.34,1.56,0.64,1)"
            : "opacity 180ms ease-out, transform 180ms ease-out",
          willChange: "opacity, transform",
        }}
        className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-900">

        {/* ── Header ─────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-brand-50 via-white to-brand-50/40 px-6 py-5 dark:border-gray-800 dark:from-brand-900/20 dark:via-gray-900 dark:to-brand-900/10">
          <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand-100/40 dark:bg-brand-500/5" />
          <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-brand-100/30 dark:bg-brand-500/5" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
                {isCreate ? <Plus size={20} /> : <Pencil size={18} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isCreate ? t("products.attributes.createColor") : t("products.attributes.updateColor")}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.attributes.colorDesc")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setState((p) => ({ ...p, open: false }))}
              className="rounded-lg border border-gray-200 bg-white/80 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────── */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {state.mode === "edit" && loadingSingle ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">

              {/* Section 1: Color Details */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">1</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Color Details
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.attributes.colorName")}
                      <span className="text-error-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Crimson Red"
                      value={state.name}
                      onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      The display name shown to customers
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      বাংলা নাম <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span>
                    </label>
                    <Input
                      placeholder="যেমন: ক্রিমসন লাল"
                      value={state.name_bd}
                      onChange={(e) => setState((p) => ({ ...p, name_bd: e.target.value }))}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      গ্রাহকদের জন্য বাংলা নাম
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.attributes.hex")}
                      <span className="text-error-500">*</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 shrink-0 rounded-lg border-2 border-gray-200 shadow-inner transition-colors dark:border-gray-700"
                        style={{ backgroundColor: isHexColor(state.hex) ? state.hex : "#000000" }}
                        aria-hidden
                      />
                      <Input
                        placeholder="#DC143C"
                        value={state.hex}
                        onChange={(e) => setState((p) => ({ ...p, hex: e.target.value }))}
                      />
                    </div>

                    {!isHexColor(state.hex) ? (
                      <p className="text-xs text-error-500">{t("products.attributes.invalidHex")}</p>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Enter a valid hex code (e.g. #DC143C)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Priority */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">2</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Priority
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("products.attributes.priority")}
                  </label>
                  <Select
                    options={PRIORITY_OPTIONS.filter((x) => x.value !== "all")}
                    placeholder="Select priority"
                    defaultValue={String(state.priority)}
                    onChange={(v) =>
                      setState((p) => ({
                        ...p,
                        priority: safeNumber(String(v), 1) as PriorityValue,
                      }))
                    }
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Higher priority colors appear first in the palette
                  </p>
                </div>
              </div>

              {/* Section 3: Visibility */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">3</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Visibility
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-800/40">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.status")}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {state.status ? "This color is available for selection" : "This color is hidden from the palette"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      state.status
                        ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                    )}>
                      {state.status ? t("common.active") : t("common.inactive")}
                    </span>
                    <Switch
                      key={`modal-color-status-${state.status}`}
                      label=""
                      defaultChecked={state.status}
                      onChange={(checked) => setState((p) => ({ ...p, status: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Live Color Preview Card */}
              {isHexColor(state.hex) && state.name.trim() ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 dark:border-gray-700/60 dark:bg-gray-800/30">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Preview
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg shadow-md ring-2 ring-white dark:ring-gray-800"
                      style={{ backgroundColor: state.hex }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{state.name}</p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{state.hex.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {isCreate ? "Fill in the details to create a new color" : `Editing color #${state.id ?? ""}`}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setState((p) => ({ ...p, open: false }))}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>

            <Button
              onClick={onSubmit}
              disabled={submitting || !state.name.trim() || !isHexColor(state.hex)}
              startIcon={isCreate ? <Plus size={16} /> : <Pencil size={16} />}
            >
              {submitting ? t("common.saving") : isCreate ? t("products.attributes.createColor") : t("products.attributes.updateColor")}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ColorTab({ tabsHeader }: { tabsHeader?: React.ReactNode }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [priority, setPriority] = useState<"all" | "1" | "2" | "3" | "4">("all");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // IMPORTANT: initial fetch should be ONLY ?limit=10 (no offset)
  const params = useMemo(() => {
    return {
      limit,
      name: search.trim() ? search.trim() : undefined,
      status: status === "all" ? undefined : status === "true",
      priority: priority === "all" ? undefined : safeNumber(priority, 1),
      offset: page > 1 ? (page - 1) * limit : undefined,
    };
  }, [limit, search, status, priority, page]);

  const queryKey = useMemo(() => ["colors", params] as const, [params]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => getColors(params),
    staleTime: 30_000,
    retry: 1,
  });

  const rows: ColorRow[] = useMemo(() => (data?.data ?? []).map(toRow), [data?.data]);
  const total = data?.total ?? 0;

  const [modal, setModal] = useState<ColorModalState>({
    open: false,
    mode: "create",
    id: undefined,
    hydrated: true,
    name: "",
    name_bd: "",
    hex: "#111827",
    priority: 2,
    status: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; row: ColorRow | null }>({
    open: false,
    row: null,
  });

  // single color load on edit modal open
  const {
    data: singleColor,
    isLoading: singleLoading,
  } = useQuery({
    queryKey: ["color", modal.id],
    queryFn: () => getColor(modal.id as number),
    enabled: modal.open && modal.mode === "edit" && Boolean(modal.id),
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (!modal.open || modal.mode !== "edit") return;
    if (!singleColor) return;

    setModal((p) => {
      if (p.hydrated && p.id === singleColor.id) return p;

      return {
        ...p,
        id: singleColor.id,
        name: singleColor.name ?? "",
        name_bd: singleColor.name_bd ?? "",
        hex: singleColor.hex ?? "#111827",
        priority: (singleColor.priority ?? 1) as PriorityValue,
        status: Boolean(singleColor.status),
        hydrated: true,
      };
    });
  }, [modal.open, modal.mode, singleColor]);

  const createMutation = useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      toast.success(t("products.attributes.colorCreated"));
      qc.invalidateQueries({ queryKey: ["colors"] });
      setModal({
        open: false,
        mode: "create",
        hydrated: true,
        name: "",
        name_bd: "",
        hex: "#111827",
        priority: 2,
        status: true,
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? t("products.attributes.failedCreateColor");
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateColor>[1] }) =>
      updateColor(id, payload),
    onSuccess: () => {
      toast.success(t("products.attributes.colorUpdated"));
      qc.invalidateQueries({ queryKey: ["colors"] });
      qc.invalidateQueries({ queryKey: ["color"] });
      setModal((p) => ({ ...p, open: false }));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? t("products.attributes.failedUpdateColor");
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteColor,
    onSuccess: (res: any) => {
      const apiError = getApiErrorFromResponse(res);
      if (apiError) {
        toast.error(apiError);
        return;
      }

      toast.success(t("products.attributes.colorDeleted"));
      qc.invalidateQueries({ queryKey: ["colors"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? t("products.attributes.failedDeleteColor");
      toast.error(msg);
    },
  });

  const openCreate = () => {
    setModal({
      open: true,
      mode: "create",
      hydrated: true,
      name: "",
      name_bd: "",
      hex: "#111827",
      priority: 2,
      status: true,
    });
  };

  const openEdit = (id: number) => {
    setModal({
      open: true,
      mode: "edit",
      id,
      hydrated: false,
      name: "",
      name_bd: "",
      hex: "#111827",
      priority: 2,
      status: true,
    });
  };

  const submitModal = () => {
    const trimmed = modal.name.trim();
    if (!trimmed || !isHexColor(modal.hex)) return;

    const payload = {
      name: trimmed,
      name_bd: modal.name_bd.trim() || undefined,
      hex: modal.hex.trim(),
      status: modal.status,
      priority: modal.priority,
    };

    if (modal.mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    if (!modal.id) return;
    updateMutation.mutate({ id: modal.id, payload });
  };

  const toggleStatus = (row: ColorRow, checked: boolean) => {
    updateMutation.mutate({
      id: row.id,
      payload: {
        name: row.name,
        hex: row.hex,
        priority: row.priority,
        status: checked,
      },
    });
  };

  const onExport = () => {
    if (!rows.length) {
      toast.error(t("products.attributes.nothingToExport"));
      return;
    }
    exportCsv(rows);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]">
        {/* Header + Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">{tabsHeader}</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="outline" startIcon={<Download size={16} />} onClick={onExport}>
                {t("common.export")} CSV
              </Button>
              <Button startIcon={<Plus size={16} />} onClick={openCreate}>
                {t("products.attributes.createColor")}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.search")}</p>
            <div className="relative">
              <Input
                startIcon={<Search size={16} className="text-gray-400" />}
                className="pl-9"
                placeholder="Search by name or hex"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.status")}</p>
            <Select
              options={STATUS_OPTIONS}
              placeholder="Status"
              defaultValue={status}
              onChange={(v) => {
                setPage(1);
                setStatus(v as any);
              }}
            />
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t("products.attributes.priority")}</p>
            <Select
              options={PRIORITY_OPTIONS}
              placeholder="Priority"
              defaultValue={priority}
              onChange={(v) => {
                setPage(1);
                setPriority(v as any);
              }}
            />
          </div>

          <div className="md:col-span-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPriority("all");
                setLimit(10);
                setPage(1);
              }}
            >
              {t("common.reset")}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Total: <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span>
          </span>
          <span className={cn("flex items-center gap-2", isFetching ? "opacity-100" : "opacity-60")}>
            <span className={cn("h-2 w-2 rounded-full", isFetching ? "bg-brand-500" : "bg-gray-400")} />
            {isFetching ? t("products.attributes.updating") : t("products.attributes.upToDate")}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                    {["SL", "Id", "Color", "HEX", "Preview", "Status", "Priority", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-4 text-left text-xs font-semibold text-brand-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {(page - 1) * limit + (idx + 1)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {row.id}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{row.name}</span>
                          {row.name_bd && (
                            <span className="text-xs font-normal text-brand-500 dark:text-brand-400">{row.name_bd}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {row.hex}
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="h-6 w-10 rounded-md border border-gray-200 dark:border-gray-800"
                          style={{ backgroundColor: row.hex }}
                          aria-hidden
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Switch
                          key={`st-${row.id}-${row.status}`}
                          label=""
                          defaultChecked={row.status}
                          onChange={(checked) => toggleStatus(row, checked)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", priorityColorClass(row.priority))}>
                          {priorityLabel(row.priority)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit(row.id)}
                            ariaLabel="Edit"
                            startIcon={<Pencil size={16} />}
                          />

                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => setDeleteConfirm({ open: true, row })}
                            ariaLabel="Delete"
                            disabled={deleteMutation.isPending}
                            startIcon={<Trash2 size={16} />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {t("products.attributes.noColors")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={total}
              page={page}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <ColorModal
        state={modal}
        setState={setModal}
        onSubmit={submitModal}
        submitting={createMutation.isPending || updateMutation.isPending}
        loadingSingle={singleLoading}
      />

      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteConfirm({ open: false, row: null });
        }}
        onConfirm={() => {
          if (deleteConfirm.row) deleteMutation.mutate(deleteConfirm.row.id);
          setDeleteConfirm({ open: false, row: null });
        }}
        loading={deleteMutation.isPending}
        title="Delete Color?"
        subtitle="This action is permanent and cannot be undone."
        message={
          deleteConfirm.row ? (
            <span>
              <span className="font-normal text-gray-500 dark:text-gray-400">Color&nbsp;·&nbsp;</span>
              <span className="font-semibold">{deleteConfirm.row.name}</span>
              {deleteConfirm.row.hex && (
                <span className="ml-2 font-mono text-xs text-gray-400">{deleteConfirm.row.hex.toUpperCase()}</span>
              )}
            </span>
          ) : undefined
        }
        consequenceLines={[
          "This color will be permanently removed",
          "Product variations using this color may be affected",
          "This action cannot be recovered or reversed",
        ]}
        confirmLabel="Delete Color"
      />
    </div>
  );
}
