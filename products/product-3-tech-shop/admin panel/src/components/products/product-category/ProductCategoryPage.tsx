"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import Button from "@/components/ui/button/Button";
import SlidingTabFilter, { type SlidingTabOption } from "@/components/ui/SlidingTabFilter";
import SectionCard from "@/components/ui/layout/SectionCard";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useTranslation } from "react-i18next";
import {
  createChildCategory,
  createMainCategory,
  createSubCategory,
  updateChildCategory,
  updateMainCategory,
  updateSubCategory,
} from "@/api/categories.api";
import { categoriesKeys } from "@/hooks/categories/categories.keys";
import {
  useChildCategories,
  useDeleteChildCategory,
  useDeleteMainCategory,
  useDeleteSubCategory,
  useMainCategories,
  useMainCategoryOptions,
  useSubCategories,
  useSubCategoryOptions,
} from "@/hooks/categories/useCategories";
import type {
  CategoryEntity,
  ChildCategoryFormValues,
  ChildListParams,
  MainListParams,
  SubCategoryFormValues,
  SubListParams,
} from "./types";
import CreateEditCategoryModal, { type EditModalState } from "./CreateEditCategoryModal";
import CategoryFiltersBar from "./CategoryFiltersBar";
import CategoriesTable from "./CategoriesTable";

const TABS: { id: CategoryEntity; labelKey: string }[] = [
  { id: "main", labelKey: "products.categories.mainCategories" },
  { id: "sub", labelKey: "products.categories.subCategories" },
  { id: "child", labelKey: "products.categories.childCategories" },
];

function getApiErrorFromResponse(res: any) {
  if (typeof res?.error === "string" && res.error.trim()) return res.error.trim();
  if (typeof res?.message === "string" && res.message.trim()) return res.message.trim();
  if (Number.isFinite(Number(res?.flag)) && Number(res.flag) >= 400)
    return "products.categories.somethingWentWrong";
  return null;
}

export default function ProductCategoryPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [tab, setTab] = useState<CategoryEntity>("main");

  // filters
  const [name, setName] = useState("");
  const [status, setStatus] = useState<boolean | "all">("all");
  const [featured, setFeatured] = useState<boolean | "all">("all");
  const [priority, setPriority] = useState<number | "all">("all");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  // parent filters for sub / child
  const [mainCategoryId, setMainCategoryId] = useState<number | "all">("all");
  const [subCategoryId, setSubCategoryId] = useState<number | "all">("all");

  const baseParams = useMemo(() => {
    const p: Record<string, any> = { limit, offset };
    if (name.trim()) p.name = name.trim();
    if (status !== "all") p.status = status;
    if (featured !== "all") p.featured = featured;
    if (priority !== "all") p.priority = priority;
    return p;
  }, [featured, limit, name, offset, priority, status]);

  const mainParams = useMemo(() => baseParams as MainListParams, [baseParams]);

  const subParams = useMemo(() => {
    const p = { ...baseParams } as SubListParams;
    if (mainCategoryId !== "all") p.main_category_id = mainCategoryId;
    return p;
  }, [baseParams, mainCategoryId]);

  const childParams = useMemo(() => {
    const p = { ...baseParams } as ChildListParams;
    if (subCategoryId !== "all") p.sub_category_id = subCategoryId;
    return p;
  }, [baseParams, subCategoryId]);

  // data
  const mainQ = useMainCategories(mainParams);
  const subQ = useSubCategories(subParams);
  const childQ = useChildCategories(childParams);

  // options for parent selects
  const mainOptionsQ = useMainCategoryOptions();
  const subOptionsQ = useSubCategoryOptions(
    tab === "child" && mainCategoryId !== "all" ? mainCategoryId : undefined,
  );

  const delMain = useDeleteMainCategory();
  const delSub = useDeleteSubCategory();
  const delChild = useDeleteChildCategory();

  const [editState, setEditState] = useState<EditModalState>({
    open: false,
    entity: "main",
    mode: "create",
    id: null,
  });

  // Confirm delete modal state
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    entity: CategoryEntity;
    id: number;
  } | null>(null);

  const currentQuery = tab === "main" ? mainQ : tab === "sub" ? subQ : childQ;
  const total = currentQuery.data?.total ?? 0;
  const isLoading = currentQuery.isLoading;
  const isRefreshing = currentQuery.isFetching && !currentQuery.isLoading;
  const rows = currentQuery.data?.data ?? [];

  const entityLabel = useMemo(() => {
    if (!deleteState) return "Category";
    if (deleteState.entity === "main") return "Main Category";
    if (deleteState.entity === "sub") return "Sub Category";
    return "Child Category";
  }, [deleteState]);

  const deleteCategoryName = useMemo(() => {
    if (!deleteState) return undefined;
    const row = (rows as any[]).find((r) => Number(r.id) === deleteState.id);
    return row?.name as string | undefined;
  }, [deleteState, rows]);

  const openCreate = () => setEditState({ open: true, entity: tab, mode: "create", id: null });
  const openEdit = (entity: CategoryEntity, id: number) =>
    setEditState({ open: true, entity, mode: "edit", id });

  const onDelete = (entity: CategoryEntity, id: number) =>
    setDeleteState({ open: true, entity, id });

  const confirmDelete = async () => {
    if (!deleteState) return;
    const { entity, id } = deleteState;
    if (entity === "main") delMain.mutate(id);
    if (entity === "sub") delSub.mutate(id);
    if (entity === "child") delChild.mutate(id);
    setDeleteState(null);
  };

  const invalidateAll = async () => {
    await qc.invalidateQueries({ queryKey: categoriesKeys.all });
  };

  const handleSubmitCreateUpdate = async (
    entity: CategoryEntity,
    mode: "create" | "edit",
    id: number | null,
    values: any,
  ) => {
    try {
      let res: any;
      if (entity === "main") {
        if (mode === "create") res = await createMainCategory(values);
        else res = await updateMainCategory(id as number, values);
      }
      if (entity === "sub") {
        const v = values as SubCategoryFormValues;
        if (mode === "create") res = await createSubCategory(v);
        else res = await updateSubCategory(id as number, v);
      }
      if (entity === "child") {
        const v = values as ChildCategoryFormValues;
        if (mode === "create") res = await createChildCategory(v);
        else res = await updateChildCategory(id as number, v);
      }

      const apiError = getApiErrorFromResponse(res);
      if (apiError) { toast.error(apiError); return; }

      toast.success(
        mode === "create"
          ? t("products.categories.categoryCreated")
          : t("products.categories.categoryUpdated"),
      );
      await invalidateAll();
      setEditState((s) => ({ ...s, open: false }));
    } catch (e: any) {
      toast.error(e?.message || t("common.error"));
      throw e;
    }
  };

  // Sliding tab options (count shown inline on active tab)
  const tabOptions: SlidingTabOption<CategoryEntity>[] = TABS.map((tb) => ({
    value: tb.id,
    label:
      tab === tb.id && total > 0
        ? `${t(tb.labelKey)} (${total})`
        : t(tb.labelKey),
  }));

  const createLabel =
    tab === "main"
      ? t("products.categories.createMain")
      : tab === "sub"
        ? t("products.categories.createSub")
        : t("products.categories.createChild");

  return (
    <div className="w-full space-y-4">
      {/* Header card: title + tabs + create */}
      <SectionCard
        noPadding
        title={t("products.categories.title")}
        headerActions={
          <Button variant="primary" size="sm" startIcon={<Plus size={14} />} onClick={openCreate}>
            {createLabel}
          </Button>
        }
      >
        {/* Tab row */}
        <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
          <SlidingTabFilter<CategoryEntity>
            options={tabOptions}
            value={tab}
            onChange={(id) => { setTab(id); setOffset(0); }}
          />
        </div>

        {/* Filters + pagination */}
        <CategoryFiltersBar
          tab={tab}
          name={name} setName={setName}
          status={status} setStatus={setStatus}
          featured={featured} setFeatured={setFeatured}
          priority={priority} setPriority={setPriority}
          limit={limit} setLimit={setLimit}
          offset={offset} setOffset={setOffset}
          total={total}
          mainCategoryId={mainCategoryId} setMainCategoryId={setMainCategoryId}
          subCategoryId={subCategoryId} setSubCategoryId={setSubCategoryId}
          mainOptions={mainOptionsQ.data?.data ?? []}
          subOptions={subOptionsQ.data?.data ?? []}
          loadingMainOptions={mainOptionsQ.isLoading}
          loadingSubOptions={subOptionsQ.isLoading}
        />
      </SectionCard>

      {/* Table */}
      <CategoriesTable
        tab={tab}
        rows={rows as any[]}
        loading={isLoading}
        isRefreshing={isRefreshing}
        onEdit={openEdit}
        onDelete={onDelete}
      />

      {/* Create/Edit Modal */}
      <CreateEditCategoryModal
        state={editState}
        onClose={() => setEditState((s) => ({ ...s, open: false }))}
        onSubmit={handleSubmitCreateUpdate}
        mainOptions={mainOptionsQ.data?.data ?? []}
        subOptions={subOptionsQ.data?.data ?? []}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!deleteState?.open}
        onClose={() => {
          if (delMain.isPending || delSub.isPending || delChild.isPending) return;
          setDeleteState(null);
        }}
        onConfirm={confirmDelete}
        loading={delMain.isPending || delSub.isPending || delChild.isPending}
        title={`Delete ${entityLabel}?`}
        subtitle="This action is permanent and cannot be undone."
        message={
          deleteCategoryName ? (
            <span>
              <span className="font-normal text-gray-500 dark:text-gray-400">{entityLabel}&nbsp;·&nbsp;</span>
              <span className="font-semibold">{deleteCategoryName}</span>
            </span>
          ) : undefined
        }
        consequenceLines={[
          "This category will be permanently deleted",
          "Any products or sub-categories linked to it may be affected",
          "This action cannot be recovered or reversed",
        ]}
        confirmLabel={`Delete ${entityLabel}`}
      />
    </div>
  );
}
