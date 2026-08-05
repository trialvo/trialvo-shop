"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, PriorityBadge, FeaturedBadge } from "@/components/ui/badge/Badges";
import ImageThumb from "@/components/ui/images/ImageThumb";
import ActionMenu from "@/components/ui/dropdown/ActionMenu";
import { SkeletonRows } from "@/components/ui/feedback/Skeleton";
import SectionCard from "@/components/ui/layout/SectionCard";
import type { CategoryEntity, MainCategory, SubCategory, ChildCategory } from "./types";
import { useTranslation } from "react-i18next";

type Props = {
  tab: CategoryEntity;
  rows: (MainCategory | SubCategory | ChildCategory)[];
  loading: boolean;
  isRefreshing: boolean;
  onEdit: (entity: CategoryEntity, id: number) => void;
  onDelete: (entity: CategoryEntity, id: number) => void;
};

/* ─── component-specific helpers (NOT duplicated elsewhere) ─── */

function StockBadge({ stock }: { stock?: number }) {
  if (stock == null) return <span className="text-xs text-gray-400">—</span>;
  const s = Number(stock);
  const cls =
    s > 50
      ? "text-green-700 dark:text-green-400"
      : s > 0
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", cls)}>
      <Package size={11} />
      {s.toLocaleString()}
    </span>
  );
}

function ExpandBtn({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:text-brand-400"
      aria-label={open ? "Collapse" : "Expand"}
    >
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

/* ──────────────────────────── name cell ──────────────────────────── */
function NameCell({ name, name_bd, sub }: { name: string; name_bd?: string | null; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="truncate font-semibold text-gray-900 dark:text-white">{name}</span>
      {name_bd && <span className="truncate text-xs text-brand-500 dark:text-brand-400">{name_bd}</span>}
      {sub && <span className="truncate text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
    </div>
  );
}

/* ──────────────────────────── table header ──────────────────────────── */
const TH = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => (
  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-500", right && "text-right")}>
    {children}
  </th>
);

/* ═══════════════════════════════════════════════════════════════════
 *  MAIN HIERARCHY
 * ═══════════════════════════════════════════════════════════════════ */
function MainHierarchy({ rows, loading, onEdit, onDelete }: Pick<Props, "rows" | "loading" | "onEdit" | "onDelete">) {
  const { t } = useTranslation();
  const mains = rows as (MainCategory & { total_stock?: number })[];
  const [openMain, setOpenMain] = useState<Record<number, boolean>>({});
  const [openSub, setOpenSub] = useState<Record<number, boolean>>({});

  const cols = 9;

  return (
    <SectionCard
      title={t("products.categories.mainHierarchy")}
      description="Expand a row to see sub-categories and child categories"
      noPadding
    >

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <TH />
              <TH>ID</TH>
              <TH>Name</TH>
              <TH>Image</TH>
              <TH>Stock</TH>
              <TH>Status</TH>
              <TH>Featured</TH>
              <TH>Priority</TH>
              <TH right>Actions</TH>
            </tr>
          </thead>

          <tbody>
            {loading && <SkeletonRows cols={cols} rows={6} />}

            {!loading && mains.length === 0 && (
              <tr>
                <td colSpan={cols} className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("products.categories.noCategories")}
                </td>
              </tr>
            )}

            {!loading &&
              mains.map((m) => {
                const subList = Array.isArray(m.sub_categories) ? m.sub_categories as (SubCategory & { total_stock?: number; child_categories?: (ChildCategory & { total_stock?: number })[] })[] : [];
                const isOpen = Boolean(openMain[m.id]);

                return (
                  <React.Fragment key={m.id}>
                    <tr className={cn("border-b border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]", isOpen && "bg-brand-50/30 dark:bg-brand-500/5")}>
                      <td className="px-4 py-3">
                        <ExpandBtn open={isOpen} onClick={() => setOpenMain((p) => ({ ...p, [m.id]: !p[m.id] }))} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">#{m.id}</td>
                      <td className="px-4 py-3">
                        <NameCell
                          name={m.name}
                          name_bd={m.name_bd}
                          sub={`${subList.length} sub-categor${subList.length === 1 ? "y" : "ies"}`}
                        />
                      </td>
                      <td className="px-4 py-3"><ImageThumb src={m.img_path} alt={m.name} /></td>
                      <td className="px-4 py-3"><StockBadge stock={m.total_stock} /></td>
                      <td className="px-4 py-3"><StatusBadge active={m.status} /></td>
                      <td className="px-4 py-3"><FeaturedBadge featured={m.featured} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={m.priority} /></td>
                      <td className="px-4 py-3">
                        <ActionMenu onEdit={() => onEdit("main", m.id)} onDelete={() => onDelete("main", m.id)} />
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td colSpan={cols} className="bg-gray-50/70 p-0 dark:bg-white/[0.02]">
                          <div className="p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("products.categories.subCategories")}
                              </span>
                              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                {subList.length}
                              </span>
                            </div>

                            {subList.length === 0 ? (
                              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                                {t("products.categories.noCategories")}
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                                <table className="w-full border-collapse text-left text-xs">
                                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                                    <tr>
                                      <TH />
                                      <TH>ID</TH>
                                      <TH>Name</TH>
                                      <TH>Image</TH>
                                      <TH>Stock</TH>
                                      <TH>Status</TH>
                                      <TH>Featured</TH>
                                      <TH>Priority</TH>
                                      <TH right>Actions</TH>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subList.map((s) => {
                                      const childList = Array.isArray(s.child_categories) ? s.child_categories : [];
                                      const subIsOpen = Boolean(openSub[s.id]);
                                      return (
                                        <React.Fragment key={s.id}>
                                          <tr className={cn("border-b border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]", subIsOpen && "bg-brand-50/20")}>
                                            <td className="px-4 py-2.5">
                                              <ExpandBtn open={subIsOpen} onClick={() => setOpenSub((p) => ({ ...p, [s.id]: !p[s.id] }))} />
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-gray-500">#{s.id}</td>
                                            <td className="px-4 py-2.5">
                                              <NameCell name={s.name} name_bd={s.name_bd} sub={`${childList.length} child`} />
                                            </td>
                                            <td className="px-4 py-2.5"><ImageThumb src={s.img_path} alt={s.name} /></td>
                                            <td className="px-4 py-2.5"><StockBadge stock={(s as any).total_stock} /></td>
                                            <td className="px-4 py-2.5"><StatusBadge active={s.status} /></td>
                                            <td className="px-4 py-2.5"><FeaturedBadge featured={s.featured} /></td>
                                            <td className="px-4 py-2.5"><PriorityBadge priority={s.priority} /></td>
                                            <td className="px-4 py-2.5">
                                              <ActionMenu onEdit={() => onEdit("sub", s.id)} onDelete={() => onDelete("sub", s.id)} />
                                            </td>
                                          </tr>

                                          {subIsOpen && childList.length > 0 && (
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                              <td colSpan={9} className="bg-gray-50/80 p-0 dark:bg-white/[0.01]">
                                                <div className="p-3">
                                                  <div className="mb-2 flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("products.categories.childCategories")}</span>
                                                    <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">{childList.length}</span>
                                                  </div>
                                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                    {childList.map((c) => {
                                                      return (
                                                        <div
                                                          key={c.id}
                                                          className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
                                                        >
                                                          <ImageThumb src={c.img_path} alt={c.name} />
                                                          <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{c.name}</p>
                                                            {c.name_bd && <p className="truncate text-[10px] text-brand-500 dark:text-brand-400">{c.name_bd}</p>}
                                                            <div className="mt-1 flex items-center gap-1">
                                                              <PriorityBadge priority={c.priority} />
                                                              {(c as any).total_stock != null && <StockBadge stock={(c as any).total_stock} />}
                                                            </div>
                                                          </div>
                                                          <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                                                            <ActionMenu onEdit={() => onEdit("child", c.id)} onDelete={() => onDelete("child", c.id)} />
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  SUB HIERARCHY
 * ═══════════════════════════════════════════════════════════════════ */
function SubHierarchy({ rows, loading, isRefreshing, onEdit, onDelete }: Pick<Props, "rows" | "loading" | "isRefreshing" | "onEdit" | "onDelete">) {
  const { t } = useTranslation();
  const subs = rows as (SubCategory & { total_stock?: number; child_categories?: (ChildCategory & { total_stock?: number })[] })[];
  const [openSub, setOpenSub] = useState<Record<number, boolean>>({});
  const cols = 9;

  return (
    <SectionCard
      title={t("products.categories.subNested")}
      description="Expand to see child categories"
      noPadding
      badge={
        isRefreshing ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            {t("products.categories.refreshing")}
          </span>
        ) : undefined
      }
    >

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <TH />
              <TH>ID</TH>
              <TH>Name</TH>
              <TH>Image</TH>
              <TH>Main</TH>
              <TH>Stock</TH>
              <TH>Status</TH>
              <TH>Featured</TH>
              <TH>Priority</TH>
              <TH right>Actions</TH>
            </tr>
          </thead>

          <tbody>
            {(loading || (isRefreshing && subs.length === 0)) && <SkeletonRows cols={cols + 1} rows={6} />}

            {!loading && subs.length === 0 && (
              <tr>
                <td colSpan={cols + 1} className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("products.categories.noCategories")}
                </td>
              </tr>
            )}

            {!loading && subs.map((s) => {
              const childList = Array.isArray(s.child_categories) ? s.child_categories : [];
              const isOpen = Boolean(openSub[s.id]);
              return (
                <React.Fragment key={s.id}>
                  <tr className={cn("border-b border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]", isOpen && "bg-brand-50/30 dark:bg-brand-500/5")}>
                    <td className="px-4 py-3">
                      <ExpandBtn open={isOpen} onClick={() => setOpenSub((p) => ({ ...p, [s.id]: !p[s.id] }))} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{s.id}</td>
                    <td className="px-4 py-3">
                      <NameCell name={s.name} name_bd={s.name_bd} sub={`${childList.length} child`} />
                    </td>
                    <td className="px-4 py-3"><ImageThumb src={s.img_path} alt={s.name} /></td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        #{s.main_category_id}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StockBadge stock={s.total_stock} /></td>
                    <td className="px-4 py-3"><StatusBadge active={s.status} /></td>
                    <td className="px-4 py-3"><FeaturedBadge featured={s.featured} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={s.priority} /></td>
                    <td className="px-4 py-3">
                      <ActionMenu onEdit={() => onEdit("sub", s.id)} onDelete={() => onDelete("sub", s.id)} />
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td colSpan={cols + 1} className="bg-gray-50/70 p-0 dark:bg-white/[0.02]">
                        <div className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("products.categories.childCategories")}</span>
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{childList.length}</span>
                          </div>
                          {childList.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                              {t("products.categories.noCategories")}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {childList.map((c) => {
                                return (
                                  <div key={c.id} className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 transition hover:border-brand-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700">
                                    <ImageThumb src={c.img_path} alt={c.name} />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{c.name}</p>
                                      {c.name_bd && <p className="truncate text-[10px] text-brand-500 dark:text-brand-400">{c.name_bd}</p>}
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <PriorityBadge priority={c.priority} />
                                        <StockBadge stock={(c as any).total_stock} />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                                      <ActionMenu onEdit={() => onEdit("child", c.id)} onDelete={() => onDelete("child", c.id)} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  CHILD FLAT TABLE
 * ═══════════════════════════════════════════════════════════════════ */
function ChildFlatTable({ rows, loading, isRefreshing, onEdit, onDelete }: Pick<Props, "rows" | "loading" | "isRefreshing" | "onEdit" | "onDelete">) {
  const { t } = useTranslation();
  const cols = 8;

  return (
    <SectionCard
      title={t("products.categories.childFlat")}
      description="Flat list of child categories with stock"
      noPadding
      badge={
        isRefreshing ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            {t("products.categories.refreshing")}
          </span>
        ) : undefined
      }
    >

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <TH>ID</TH>
              <TH>Name</TH>
              <TH>Image</TH>
              <TH>Sub</TH>
              <TH>Stock</TH>
              <TH>Status</TH>
              <TH>Featured</TH>
              <TH>Priority</TH>
              <TH right>Actions</TH>
            </tr>
          </thead>

          <tbody>
            {(loading || (isRefreshing && rows.length === 0)) && <SkeletonRows cols={cols + 1} rows={6} />}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={cols + 1} className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("products.categories.noCategories")}
                </td>
              </tr>
            )}

            {!loading && rows.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-b-0 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id}</td>
                <td className="px-4 py-3">
                  <NameCell name={r.name} name_bd={r.name_bd} />
                </td>
                <td className="px-4 py-3"><ImageThumb src={r.img_path} alt={r.name} /></td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    #{r.sub_category_id}
                  </span>
                </td>
                <td className="px-4 py-3"><StockBadge stock={r.total_stock} /></td>
                <td className="px-4 py-3"><StatusBadge active={r.status} /></td>
                <td className="px-4 py-3"><FeaturedBadge featured={r.featured} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                <td className="px-4 py-3">
                  <ActionMenu onEdit={() => onEdit("child", r.id)} onDelete={() => onDelete("child", r.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  MAIN EXPORT
 * ═══════════════════════════════════════════════════════════════════ */
export default function CategoriesTable({ tab, rows, loading, isRefreshing, onEdit, onDelete }: Props) {
  if (tab === "main") return <MainHierarchy rows={rows} loading={loading} onEdit={onEdit} onDelete={onDelete} />;
  if (tab === "sub") return <SubHierarchy rows={rows} loading={loading} isRefreshing={isRefreshing} onEdit={onEdit} onDelete={onDelete} />;
  return <ChildFlatTable rows={rows} loading={loading} isRefreshing={isRefreshing} onEdit={onEdit} onDelete={onDelete} />;
}
