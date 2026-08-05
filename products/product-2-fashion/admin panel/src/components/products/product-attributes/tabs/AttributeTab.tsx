// src/components/products/product-attributes/tabs/AttributeTab.tsx
"use client";

import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, GripVertical, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Pagination } from "@/components/ui";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";

import type { AttributeRow, Option, VariantRow } from "../types";
import { safeNumber } from "../types";

import {
  createAttribute,
  deleteAttribute,
  getAttribute,
  getAttributes,
  updateAttribute,
  type Attribute,
} from "@/api/attributes.api";

import {
  createVariant,
  deleteVariant,
  getVariant,
  reorderVariants,
  updateVariant
} from "@/api/variants.api";

const STATUS_OPTIONS: Option[] = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function parseApiError(err: any, fallback: string) {
  return err?.response?.data?.error ?? err?.response?.data?.message ?? fallback;
}

function normalizeAttribute(a: Attribute): AttributeRow {
  const variantsRaw = Array.isArray(a.variants) ? a.variants : [];
  const variants: VariantRow[] = variantsRaw
    .filter((v: any) => v && typeof v === "object" && (typeof v.id === "number" || typeof v.id === "string"))
    .map((v: any) => ({
      id: typeof v.id === "string" ? parseInt(v.id, 10) : v.id,
      attribute_id: typeof v.attribute_id === "string" ? parseInt(v.attribute_id, 10) : (v.attribute_id ?? a.id),
      name: v.name ?? "",
      name_bd: v.name_bd ?? null,
      serial: v.serial ?? 1,
      status: v.status === 1 || v.status === "1" || v.status === true || Boolean(v.status),
      created_at: v.created_at,
      updated_at: v.updated_at,
    }));

  return {
    id: a.id,
    name: a.name,
    name_bd: a.name_bd ?? null,
    priority: a.priority ?? 1,
    status: Boolean(a.status),
    created_at: a.created_at,
    updated_at: a.updated_at,
    variants,
  };
}

function exportCsv(rows: AttributeRow[]) {
  const headers = ["id", "name", "priority", "status", "variants_count"];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        JSON.stringify(r.name),
        r.priority,
        r.status,
        r.variants?.length ?? 0,
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attributes_${new Date().toISOString().slice(0, 10)}.csv`;
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

/* ─────────────────────────────────────────────────────────────
   DRAGGABLE VARIANT LIST
   Uses native HTML5 drag-and-drop; no external DnD library.
───────────────────────────────────────────────────────────── */

interface DraggableVariantsProps {
  attributeId: number;
  variants: VariantRow[];
  onReordered: (newVariants: VariantRow[]) => void;
  onEdit: (id: number) => void;
  onDelete: (v: VariantRow) => void;
  isDeleting: boolean;
}

function DraggableVariants({
  attributeId,
  variants,
  onReordered,
  onEdit,
  onDelete,
  isDeleting,
}: DraggableVariantsProps) {
  const [localVariants, setLocalVariants] = useState<VariantRow[]>(variants);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const pendingRef = useRef<VariantRow[] | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when server data changes (but not while dragging)
  useEffect(() => {
    if (draggingId === null) {
      setLocalVariants(variants);
    }
  }, [variants, draggingId]);

  const scheduleSave = useCallback(
    (ordered: VariantRow[]) => {
      pendingRef.current = ordered;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const toSave = pendingRef.current;
        if (!toSave) return;
        setIsSaving(true);
        try {
          await reorderVariants(attributeId, {
            order: toSave.map((v, i) => ({ id: v.id, serial: i + 1 })),
          });
          onReordered(toSave.map((v, i) => ({ ...v, serial: i + 1 })));
        } catch (e: any) {
          toast.error(parseApiError(e, "Failed to save order."));
        } finally {
          setIsSaving(false);
          pendingRef.current = null;
        }
      }, 600);
    },
    [attributeId, onReordered],
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    setDraggingId(localVariants[index].id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDraggingId(null);
      setOverIndex(null);
      dragIndexRef.current = null;
      return;
    }

    const updated = [...localVariants];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setLocalVariants(updated);
    setDraggingId(null);
    setOverIndex(null);
    dragIndexRef.current = null;
    scheduleSave(updated);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverIndex(null);
    dragIndexRef.current = null;
  };

  if (localVariants.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/30">
        <Layers size={14} className="text-gray-400 dark:text-gray-500" />
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          No variants yet — add one below
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Saving indicator */}
      {isSaving && (
        <div className="absolute -top-1 right-0 flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-700/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
          Saving order…
        </div>
      )}

      {/* Drag hint */}
      <p className="mb-1.5 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
        <GripVertical size={11} className="opacity-60" />
        Drag to reorder
      </p>

      <div
        className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        style={{ minWidth: 280 }}
      >
        {localVariants.map((v, index) => {
          const isDragging = draggingId === v.id;
          const isDropTarget = overIndex === index && draggingId !== null && draggingId !== v.id;

          return (
            <div
              key={v.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative flex flex-col rounded-lg border p-2 transition-all duration-150 select-none",
                "cursor-grab active:cursor-grabbing",
                isDragging
                  ? "scale-95 opacity-40 ring-2 ring-brand-400 ring-offset-1 dark:ring-brand-500"
                  : "hover:shadow-md hover:-translate-y-px",
                isDropTarget
                  ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10"
                  : v.status
                    ? "border-gray-200 bg-gradient-to-br from-white to-gray-50/60 dark:border-gray-700 dark:from-gray-800/90 dark:to-gray-800/40"
                    : "border-gray-200/50 bg-gray-50/40 opacity-65 dark:border-gray-800/50 dark:bg-gray-900/30",
              )}
            >
              {/* Drag handle + status dot + name */}
              <div className="flex items-center gap-1.5">
                <GripVertical
                  size={12}
                  className="shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-gray-400"
                />
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    v.status ? "bg-success-500" : "bg-gray-400 dark:bg-gray-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                    {v.name}
                  </span>
                  {v.name_bd && (
                    <span className="block truncate text-[10px] text-brand-500 dark:text-brand-400">
                      {v.name_bd}
                    </span>
                  )}
                </div>
              </div>

              {/* Serial badge */}
              <div className="mt-1.5">
                <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ring-1 bg-gray-100 text-gray-500 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700/40">
                  #{index + 1}
                </span>
              </div>

              {/* Hover actions */}
              <div className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1 py-0.5 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-gray-600 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(v.id); }}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                  title="Edit"
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(v); }}
                  disabled={isDeleting}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:text-error-600 dark:hover:text-error-400"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ATTRIBUTE MODAL
───────────────────────────────────────────────────────────── */

type AttributeModalMode = "create" | "edit";

type AttributeModalState = {
  open: boolean;
  mode: AttributeModalMode;
  id?: number;
  hydrated: boolean;
  name: string;
  name_bd: string;
  status: boolean;
  // only for create: comma separated variants
  variantsCsv: string;
};

function AttributeModal({
  state,
  setState,
  onSubmit,
  submitting,
  loadingSingle,
}: {
  state: AttributeModalState;
  setState: React.Dispatch<React.SetStateAction<AttributeModalState>>;
  onSubmit: () => void;
  submitting: boolean;
  loadingSingle: boolean;
}) {
  const { t } = useTranslation();
  if (!state.open) return null;

  const isCreate = state.mode === "create";
  const variantChips = state.variantsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-900">

        {/* Header */}
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
                  {isCreate ? t("products.attributes.createAttribute") : t("products.attributes.updateAttribute")}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.attributes.attributeDesc")}
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

        {/* Body */}
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

              {/* Section 1: Basic Info */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">1</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Basic Information
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.attributes.attributeName")}
                      <span className="text-error-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Weight, Size, Material"
                      value={state.name}
                      onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Choose a clear, descriptive name for this attribute
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      বাংলা নাম <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span>
                    </label>
                    <Input
                      placeholder="যেমন: বিভাগ, আকার, মাল"
                      value={state.name_bd}
                      onChange={(e) => setState((p) => ({ ...p, name_bd: e.target.value }))}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      গ্রাহকদের জন্য বাংলা নাম
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Status */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">2</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Visibility
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-800/40">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.status")}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {state.status ? "This attribute is visible to customers" : "This attribute is hidden from the storefront"}
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
                      key={`attr-modal-st-${state.status}`}
                      label=""
                      defaultChecked={state.status}
                      onChange={(checked) => setState((p) => ({ ...p, status: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Variants (only on create) */}
              {isCreate && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">3</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Quick Add Variants
                    </span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-px text-[9px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Optional
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("products.attributes.variantsOptional")}
                      </label>
                      <Input
                        placeholder="S, M, L, XL, XXL"
                        value={state.variantsCsv}
                        onChange={(e) => setState((p) => ({ ...p, variantsCsv: e.target.value }))}
                      />
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {t("products.attributes.variantsAutoCreate")}
                      </p>
                    </div>

                    {variantChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {variantChips.map((chip, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
                          >
                            {chip}
                          </span>
                        ))}
                        <span className="self-center text-[10px] text-gray-400">
                          {variantChips.length} variant{variantChips.length !== 1 ? "s" : ""} will be created
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {isCreate ? "Fill in the details to create a new attribute" : `Editing attribute #${state.id ?? ""}`}
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
              disabled={submitting || !state.name.trim()}
              startIcon={isCreate ? <Plus size={16} /> : <Pencil size={16} />}
            >
              {submitting ? t("common.saving") : isCreate ? t("products.attributes.createAttribute") : t("common.update")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VARIANT MODAL (edit)
───────────────────────────────────────────────────────────── */

type VariantModalState = {
  open: boolean;
  id?: number;
  hydrated: boolean;
  attribute_id: number;
  name: string;
  name_bd: string;
  status: boolean;
};

function VariantModal({
  state,
  setState,
  attributeOptions,
  onSubmit,
  submitting,
  loadingSingle,
}: {
  state: VariantModalState;
  setState: React.Dispatch<React.SetStateAction<VariantModalState>>;
  attributeOptions: Option[];
  onSubmit: () => void;
  submitting: boolean;
  loadingSingle: boolean;
}) {
  const { t } = useTranslation();
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-900">

        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-brand-50 via-white to-brand-50/40 px-6 py-5 dark:border-gray-800 dark:from-brand-900/20 dark:via-gray-900 dark:to-brand-900/10">
          <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand-100/40 dark:bg-brand-500/5" />
          <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-brand-100/30 dark:bg-brand-500/5" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25">
                <Pencil size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("products.attributes.updateVariant")}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.attributes.variantDesc")}
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

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loadingSingle ? (
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

              {/* Section 1: Attribute Assignment */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">1</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Attribute Assignment
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("products.attributes.attribute")}
                  </label>
                  <Select
                    key={`var-modal-attr-${state.hydrated}-${state.attribute_id}`}
                    options={attributeOptions}
                    placeholder="Select attribute"
                    defaultValue={String(state.attribute_id)}
                    onChange={(v) =>
                      setState((p) => ({
                        ...p,
                        attribute_id: safeNumber(String(v), p.attribute_id),
                      }))
                    }
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Choose which attribute this variant belongs to
                  </p>
                </div>
              </div>

              {/* Section 2: Variant Details */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">2</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Variant Details
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.attributes.variantName")}
                      <span className="text-error-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. XL, Extra Large"
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
                      placeholder="যেমন: এক্স্ট্রা লার্জ"
                      value={state.name_bd}
                      onChange={(e) => setState((p) => ({ ...p, name_bd: e.target.value }))}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      গ্রাহকদের জন্য বাংলা নাম
                    </p>
                  </div>
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
                      {state.status ? "This variant is available for selection" : "This variant is hidden from the storefront"}
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
                      key={`var-st-${state.status}`}
                      label=""
                      defaultChecked={state.status}
                      onChange={(checked) => setState((p) => ({ ...p, status: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Editing variant #{state.id ?? ""}
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
              disabled={submitting || !state.name.trim()}
              startIcon={<Pencil size={16} />}
            >
              {submitting ? t("common.saving") : t("common.update")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN TAB
───────────────────────────────────────────────────────────── */

export default function AttributeTab({ tabsHeader }: { tabsHeader?: React.ReactNode }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // inline variant draft per attribute
  const [variantDraftByAttrId, setVariantDraftByAttrId] = useState<Record<number, string>>({});

  // Local variant overrides (to reflect optimistic reorder without full refetch)
  const [variantOverrideByAttrId, setVariantOverrideByAttrId] = useState<Record<number, VariantRow[]>>({});

  const params = useMemo(() => {
    return {
      limit,
      name: search.trim() ? search.trim() : undefined,
      status: status === "all" ? undefined : status === "true",
      offset: page > 1 ? (page - 1) * limit : undefined,
    };
  }, [limit, search, status, page]);

  const queryKey = useMemo(() => ["attributes", params] as const, [params]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => getAttributes(params),
    staleTime: 15_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const rows: AttributeRow[] = useMemo(
    () => (data?.data ?? []).map(normalizeAttribute),
    [data?.data],
  );

  // Clear local overrides when query data changes (e.g. after adding/deleting variants)
  useEffect(() => {
    setVariantOverrideByAttrId({});
  }, [data]);

  const total = data?.total ?? 0;

  const attributeOptions: Option[] = useMemo(
    () => rows.map((r) => ({ value: String(r.id), label: r.name })),
    [rows],
  );

  /* ---- Modals state ---- */

  const [attrModal, setAttrModal] = useState<AttributeModalState>({
    open: false,
    mode: "create",
    hydrated: true,
    name: "",
    name_bd: "",
    status: true,
    variantsCsv: "",
  });

  const [variantModal, setVariantModal] = useState<VariantModalState>({
    open: false,
    hydrated: true,
    attribute_id: 0,
    name: "",
    name_bd: "",
    status: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "attribute" | "variant";
    id: number | null;
    name: string;
  }>({ open: false, type: "attribute", id: null, name: "" });

  /* ---- Single loads for modals ---- */

  const { data: singleAttr, isLoading: singleAttrLoading } = useQuery({
    queryKey: ["attribute", attrModal.id],
    queryFn: () => getAttribute(attrModal.id as number),
    enabled: attrModal.open && attrModal.mode === "edit" && Boolean(attrModal.id),
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (!attrModal.open || attrModal.mode !== "edit") return;
    if (!singleAttr) return;

    setAttrModal((p) => {
      if (p.hydrated && p.id === singleAttr.id) return p;
      return {
        ...p,
        id: singleAttr.id,
        name: singleAttr.name ?? "",
        name_bd: singleAttr.name_bd ?? "",
        status: Boolean(singleAttr.status),
        hydrated: true,
      };
    });
  }, [attrModal.open, attrModal.mode, singleAttr]);

  const { data: singleVar, isLoading: singleVarLoading } = useQuery({
    queryKey: ["variant", variantModal.id],
    queryFn: () => getVariant(variantModal.id as number),
    enabled: variantModal.open && Boolean(variantModal.id),
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (!variantModal.open) return;
    if (!singleVar) return;

    setVariantModal((p) => {
      if (p.hydrated && p.id === singleVar.id) return p;
      return {
        ...p,
        id: singleVar.id,
        attribute_id: singleVar.attribute_id,
        name: singleVar.name ?? "",
        name_bd: singleVar.name_bd ?? "",
        status: Boolean(singleVar.status),
        hydrated: true,
      };
    });
  }, [variantModal.open, singleVar]);

  /* ---- Mutations ---- */

  const createAttrMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: async (created) => {
      const values = attrModal.variantsCsv
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      if (values.length) {
        for (const val of values) {
          try {
            await createVariant({
              attribute_id: created.id,
              name: val,
              status: true,
              serial: 1,
            });
          } catch (e: any) {
            toast.error(parseApiError(e, `Failed to create variant "${val}"`));
          }
        }
      }

      toast.success(t("products.attributes.attributeCreated"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
      setAttrModal({
        open: false,
        mode: "create",
        hydrated: true,
        name: "",
        name_bd: "",
        status: true,
        variantsCsv: "",
      });
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedCreate")));
    },
  });

  const updateAttrMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateAttribute>[1] }) =>
      updateAttribute(id, payload),
    onSuccess: () => {
      toast.success(t("products.attributes.attributeUpdated"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
      qc.invalidateQueries({ queryKey: ["attribute"] });
      setAttrModal((p) => ({ ...p, open: false }));
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedUpdate")));
    },
  });

  const deleteAttrMutation = useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      toast.success(t("products.attributes.attributeDeleted"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedDelete")));
    },
  });

  const createVarMutation = useMutation({
    mutationFn: createVariant,
    onSuccess: () => {
      toast.success(t("products.attributes.variantCreated"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
      qc.invalidateQueries({ queryKey: ["attribute"] });
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedCreateVariant")));
    },
  });

  const updateVarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateVariant>[1] }) =>
      updateVariant(id, payload),
    onSuccess: () => {
      toast.success(t("products.attributes.variantUpdated"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
      qc.invalidateQueries({ queryKey: ["attribute"] });
      qc.invalidateQueries({ queryKey: ["variant"] });
      setVariantModal((p) => ({ ...p, open: false }));
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedUpdateVariant")));
    },
  });

  const deleteVarMutation = useMutation({
    mutationFn: deleteVariant,
    onSuccess: () => {
      toast.success(t("products.attributes.variantDeleted"));
      qc.invalidateQueries({ queryKey: ["attributes"] });
      qc.invalidateQueries({ queryKey: ["attribute"] });
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, t("products.attributes.failedDeleteVariant")));
    },
  });

  /* ---- Actions ---- */

  const openCreateAttribute = () => {
    setAttrModal({
      open: true,
      mode: "create",
      hydrated: true,
      name: "",
      name_bd: "",
      status: true,
      variantsCsv: "",
    });
  };

  const openEditAttribute = (id: number) => {
    setAttrModal({
      open: true,
      mode: "edit",
      id,
      hydrated: false,
      name: "",
      name_bd: "",
      status: true,
      variantsCsv: "",
    });
  };

  const submitAttrModal = () => {
    const trimmed = attrModal.name.trim();
    if (!trimmed) return;

    if (attrModal.mode === "create") {
      createAttrMutation.mutate({
        name: trimmed,
        name_bd: attrModal.name_bd.trim() || undefined,
        status: attrModal.status,
        priority: 1,
      });
      return;
    }

    if (!attrModal.id) return;
    updateAttrMutation.mutate({
      id: attrModal.id,
      payload: {
        name: trimmed,
        name_bd: attrModal.name_bd.trim() || undefined,
        status: attrModal.status,
      },
    });
  };

  const submitVariantModal = () => {
    const trimmed = variantModal.name.trim();
    if (!trimmed || !variantModal.id) return;

    updateVarMutation.mutate({
      id: variantModal.id,
      payload: {
        attribute_id: variantModal.attribute_id,
        name: trimmed,
        name_bd: variantModal.name_bd.trim() || undefined,
        status: variantModal.status,
      },
    });
  };

  const addVariantInline = (attributeId: number, currentCount: number) => {
    const v = (variantDraftByAttrId[attributeId] ?? "").trim();
    if (!v) return;

    createVarMutation.mutate({
      attribute_id: attributeId,
      name: v,
      status: true,
      serial: currentCount + 1, // append at end
    });

    setVariantDraftByAttrId((p) => ({ ...p, [attributeId]: "" }));
  };

  const toggleAttributeStatus = (row: AttributeRow, checked: boolean) => {
    updateAttrMutation.mutate({
      id: row.id,
      payload: { status: checked, name: row.name, priority: row.priority },
    });
  };

  const openEditVariant = (variantId: number) => {
    setVariantModal({
      open: true,
      id: variantId,
      hydrated: false,
      attribute_id: 0,
      name: "",
      name_bd: "",
      status: true,
    });
  };

  const handleDeleteVariant = (v: VariantRow) => {
    setDeleteConfirm({ open: true, type: "variant", id: v.id, name: v.name });
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
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">{tabsHeader}</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="outline" startIcon={<Download size={16} />} onClick={onExport}>
                {t("common.export")} CSV
              </Button>
              <Button startIcon={<Plus size={16} />} onClick={openCreateAttribute}>
                {t("products.attributes.createAttribute")}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters — removed priority filter */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("common.search")}
            </p>
            <div className="relative">
              <Input
                startIcon={<Search size={16} className="text-gray-400" />}
                className="pl-9"
                placeholder="Search attribute name"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("common.status")}
            </p>
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch("");
                setStatus("all");
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
            Total:{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {total}
            </span>
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
              <table className="min-w-[1050px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                    {["SL", "Id", "Attribute", "Variants (drag to reorder)", "Status", "Action"].map(
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
                  {rows.map((row, idx) => {
                    const effectiveVariants = variantOverrideByAttrId[row.id] ?? row.variants ?? [];

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 dark:border-gray-800 align-top"
                      >
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {(page - 1) * limit + (idx + 1)}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {row.id}
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {row.name}
                            </p>
                            {row.name_bd && (
                              <p className="text-xs text-brand-500 dark:text-brand-400">{row.name_bd}</p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {effectiveVariants.length} {t("products.attributes.variants")}
                            </p>
                          </div>
                        </td>

                        {/* Variants with DnD */}
                        <td className="px-4 py-4">
                          <div className="space-y-3">
                            <DraggableVariants
                              attributeId={row.id}
                              variants={effectiveVariants}
                              onReordered={(updated) =>
                                setVariantOverrideByAttrId((p) => ({ ...p, [row.id]: updated }))
                              }
                              onEdit={openEditVariant}
                              onDelete={handleDeleteVariant}
                              isDeleting={deleteVarMutation.isPending}
                            />

                            {/* Add Variant Input */}
                            <div className="flex items-center gap-2">
                              <div style={{ width: 200 }}>
                                <Input
                                  placeholder="Add variant (e.g. XL)"
                                  value={variantDraftByAttrId[row.id] ?? ""}
                                  onChange={(e) =>
                                    setVariantDraftByAttrId((p) => ({
                                      ...p,
                                      [row.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") addVariantInline(row.id, effectiveVariants.length);
                                  }}
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addVariantInline(row.id, effectiveVariants.length)}
                                ariaLabel="Add variant"
                                disabled={createVarMutation.isPending}
                                startIcon={<Plus size={14} />}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <Switch
                            key={`attr-st-${row.id}-${row.status}`}
                            label=""
                            defaultChecked={row.status}
                            onChange={(checked) => toggleAttributeStatus(row, checked)}
                          />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditAttribute(row.id)}
                              ariaLabel="Edit attribute"
                              startIcon={<Pencil size={16} />}
                            />

                            <Button
                              variant="danger"
                              size="icon"
                              onClick={() => setDeleteConfirm({ open: true, type: "attribute", id: row.id, name: row.name })}
                              ariaLabel="Delete attribute"
                              disabled={deleteAttrMutation.isPending}
                              startIcon={<Trash2 size={16} />}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {t("products.attributes.noAttributes")}
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

      {/* Attribute Modal */}
      <AttributeModal
        state={attrModal}
        setState={setAttrModal}
        onSubmit={submitAttrModal}
        submitting={createAttrMutation.isPending || updateAttrMutation.isPending}
        loadingSingle={singleAttrLoading}
      />

      {/* Variant Modal */}
      <VariantModal
        state={variantModal}
        setState={setVariantModal}
        attributeOptions={attributeOptions}
        onSubmit={submitVariantModal}
        submitting={updateVarMutation.isPending}
        loadingSingle={singleVarLoading}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => {
          if (deleteAttrMutation.isPending || deleteVarMutation.isPending) return;
          setDeleteConfirm((p) => ({ ...p, open: false }));
        }}
        onConfirm={() => {
          if (!deleteConfirm.id) return;
          if (deleteConfirm.type === "attribute") deleteAttrMutation.mutate(deleteConfirm.id);
          else deleteVarMutation.mutate(deleteConfirm.id);
          setDeleteConfirm((p) => ({ ...p, open: false }));
        }}
        loading={deleteAttrMutation.isPending || deleteVarMutation.isPending}
        title={deleteConfirm.type === "attribute" ? "Delete Attribute?" : "Delete Variant?"}
        subtitle="This action is permanent and cannot be undone."
        message={
          deleteConfirm.name ? (
            <span>
              <span className="font-normal text-gray-500 dark:text-gray-400">
                {deleteConfirm.type === "attribute" ? "Attribute" : "Variant"}&nbsp;·&nbsp;
              </span>
              <span className="font-semibold">{deleteConfirm.name}</span>
            </span>
          ) : undefined
        }
        consequenceLines={
          deleteConfirm.type === "attribute"
            ? [
              "This attribute and all its variants will be removed",
              "Products using this attribute may be affected",
              "This action cannot be recovered or reversed",
            ]
            : [
              "This variant will be permanently deleted",
              "Product listings using this variant may be affected",
              "This action cannot be recovered or reversed",
            ]
        }
        confirmLabel={deleteConfirm.type === "attribute" ? "Delete Attribute" : "Delete Variant"}
      />
    </div>
  );
}
