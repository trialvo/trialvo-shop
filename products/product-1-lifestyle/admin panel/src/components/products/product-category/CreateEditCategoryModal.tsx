"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import type {
  CategoryEntity,
  CategoryFormValues,
  ChildCategoryFormValues,
  MainCategory,
  SubCategory,
  SubCategoryFormValues,
} from "@/components/products/product-category/types";

import { useCategorySingle } from "@/hooks/categories/useCategorySingle";
import ImagePickerSquare from "@/components/products/product-category/ImagePickerSquare";
import Select, { type Option } from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

export type EditModalState = {
  open: boolean;
  entity: CategoryEntity;
  mode: "create" | "edit";
  id: number | null;
};

type Props = {
  state: EditModalState;
  onClose: () => void;
  onSubmit: (
    entity: CategoryEntity,
    mode: "create" | "edit",
    id: number | null,
    values: any,
  ) => Promise<void>;
  mainOptions: MainCategory[];
  subOptions: SubCategory[];
  isSaving?: boolean;
};

const defaultValues: CategoryFormValues = {
  name: "",
  name_bd: "",
  priority: 1,
  status: true,
  featured: true,
  category_img: null,
};

export default function CreateEditCategoryModal({
  state,
  onClose,
  onSubmit,
  mainOptions,
  subOptions,
  isSaving = false,
}: Props) {
  const { t } = useTranslation();
  const { open, entity, mode, id } = state;
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  const singleQ = useCategorySingle(entity, id, open && mode === "edit");

  const [values, setValues] = useState<any>(defaultValues);
  const [existingImg, setExistingImg] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "create") {
      return entity === "main" ? t("products.categories.createMainTitle") : entity === "sub" ? t("products.categories.createSubTitle") : t("products.categories.createChildTitle");
    }
    return entity === "main" ? t("products.categories.editMainTitle") : entity === "sub" ? t("products.categories.editSubTitle") : t("products.categories.editChildTitle");
  }, [entity, mode, t]);

  // ✅ options for your Select component
  const mainSelectOptions: Option[] = useMemo(
    () => mainOptions.map((m) => ({ value: String(m.id), label: `#${m.id} — ${m.name}` })),
    [mainOptions],
  );

  const subSelectOptions: Option[] = useMemo(
    () => subOptions.map((s) => ({ value: String(s.id), label: `#${s.id} — ${s.name}` })),
    [subOptions],
  );

  const statusOptions: Option[] = useMemo(
    () => [
      { value: "true", label: t("common.enabled") },
      { value: "false", label: t("common.disabled") },
    ],
    [t],
  );

  const featuredOptions: Option[] = useMemo(
    () => [
      { value: "true", label: t("common.yes") },
      { value: "false", label: t("common.no") },
    ],
    [t],
  );

  // ✅ reset stale values when opening edit / switching target id
  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;

    setValues({ ...defaultValues });
    setExistingImg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, entity, id]);

  // create mode defaults
  useEffect(() => {
    if (!open) return;
    if (mode !== "create") return;

    setExistingImg(null);

    setValues(() => {
      if (entity === "sub") {
        const first = mainOptions[0]?.id ?? 0;
        const v: SubCategoryFormValues = { ...defaultValues, main_category_id: first };
        return v;
      }
      if (entity === "child") {
        const first = subOptions[0]?.id ?? 0;
        const v: ChildCategoryFormValues = { ...defaultValues, sub_category_id: first };
        return v;
      }
      return { ...defaultValues };
    });
  }, [entity, mainOptions, mode, open, subOptions]);

  // edit mode fill
  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    if (!singleQ.data) return;

    const d: any = singleQ.data;

    setExistingImg(d.img_path ?? null);

    setValues(() => {
      const base = {
        name: d.name ?? "",
        name_bd: d.name_bd ?? "",
        priority: Number(d.priority ?? 1),
        status: Boolean(d.status),
        featured: Boolean(d.featured),
        category_img: null,
      };

      if (entity === "sub") return { ...base, main_category_id: Number(d.main_category_id ?? 0) };
      if (entity === "child") return { ...base, sub_category_id: Number(d.sub_category_id ?? 0) };
      return base;
    });
  }, [entity, mode, open, singleQ.data]);

  if (!isMounted) return null;

  const isBusy = singleQ.isFetching || singleQ.isLoading || isSaving;

  const submitDisabled =
    isBusy ||
    !values?.name?.trim() ||
    (entity === "sub" && !values?.main_category_id) ||
    (entity === "child" && !values?.sub_category_id);

  const inputClass = cn(
    "h-10 w-full rounded-lg px-3 text-sm outline-none",
    "bg-white text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-[3px] focus:ring-brand-500/30",
    "dark:bg-gray-950 dark:text-white dark:ring-gray-800 dark:focus:ring-brand-500/20",
    isBusy && "opacity-70",
  );

  const closeDisabled = isBusy; // keep like your UI

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (closeDisabled) return;
          onClose();
        }}
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-full max-w-[820px] overflow-hidden rounded-2xl bg-white shadow-theme-xs ring-1 ring-inset ring-gray-200 dark:bg-gray-950 dark:ring-gray-800"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {entity === "main" ? "Main category" : entity === "sub" ? "Sub category" : "Child category"} — {mode === "create" ? "New entry" : `ID #${id}`}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} disabled={closeDisabled}>
            {t("common.close")}
          </Button>
        </div>

        {/* body */}
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Left: image */}
            <div className="md:col-span-4">
              <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/40 dark:ring-gray-800">
                <ImagePickerSquare
                  label={t("products.categories.categoryImage")}
                  hint={t("products.categories.imageHint")}
                  value={values.category_img ?? null}
                  existingUrl={existingImg}
                  onChange={(file) => setValues((p: any) => ({ ...p, category_img: file }))}
                />
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.categories.uploadHintText")}
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div className="md:col-span-8">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-12">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t("products.categories.name")}
                  </label>
                  <input
                    value={values.name}
                    onChange={(e) => setValues((p: any) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder={t("products.categories.categoryNamePlaceholder")}
                    disabled={isBusy}
                  />
                </div>

                <div className="md:col-span-12">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    বাংলা নাম <span className="text-gray-400">(ঐচ্ছিক)</span>
                  </label>
                  <input
                    value={values.name_bd ?? ""}
                    onChange={(e) => setValues((p: any) => ({ ...p, name_bd: e.target.value }))}
                    className={inputClass}
                    placeholder="বাংলা নাম লিখুন"
                    disabled={isBusy}
                  />
                </div>

                {entity === "sub" && (
                  <div className="md:col-span-12">
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t("products.categories.mainCategory")}
                    </label>

                    <Select
                      options={mainSelectOptions}
                      placeholder={mainSelectOptions.length ? t("products.categories.selectMainCategory") : t("products.categories.noMainCategories")}
                      value={values.main_category_id ? String(values.main_category_id) : ""}
                      onChange={(v) => setValues((p: any) => ({ ...p, main_category_id: Number(v) }))}
                      disabled={isBusy || mainSelectOptions.length === 0}
                    />
                  </div>
                )}

                {entity === "child" && (
                  <div className="md:col-span-12">
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t("products.categories.subCategory")}
                    </label>

                    <Select
                      options={subSelectOptions}
                      placeholder={subSelectOptions.length ? t("products.categories.selectSubCategory") : t("products.categories.noSubCategories")}
                      value={values.sub_category_id ? String(values.sub_category_id) : ""}
                      onChange={(v) => setValues((p: any) => ({ ...p, sub_category_id: Number(v) }))}
                      disabled={isBusy || subSelectOptions.length === 0}
                    />
                  </div>
                )}

                <div className="md:col-span-12">
                  <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t("products.categories.priority")}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 1, label: "Low", cls: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300", activeCls: "border-gray-400 bg-gray-100 text-gray-800 ring-2 ring-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-white dark:ring-gray-600" },
                      { value: 2, label: "Normal", cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400", activeCls: "border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700" },
                      { value: 3, label: "High", cls: "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400", activeCls: "border-red-400 bg-red-100 text-red-800 ring-2 ring-red-300 dark:border-red-500 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setValues((p: any) => ({ ...p, priority: opt.value }))}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-semibold transition focus:outline-none",
                          values.priority === opt.value ? opt.activeCls : opt.cls
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t("common.status")}
                  </label>
                  <Select
                    options={statusOptions}
                    value={values.status ? "true" : "false"}
                    onChange={(v) => setValues((p: any) => ({ ...p, status: v === "true" }))}
                    disabled={isBusy}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t("products.categories.featured")}
                  </label>
                  <Select
                    options={featuredOptions}
                    value={values.featured ? "true" : "false"}
                    onChange={(v) => setValues((p: any) => ({ ...p, featured: v === "true" }))}
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={isBusy}>
                  {t("common.cancel")}
                </Button>

                <Button
                  variant="primary"
                  onClick={() => onSubmit(entity, mode, id, values)}
                  disabled={submitDisabled}
                  isLoading={isSaving}
                  loadingText={t("products.categories.saving")}
                >
                  {mode === "create" ? t("common.create") : t("common.update")}
                </Button>
              </div>

              {mode === "edit" && singleQ.isError ? (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                  {t("products.categories.failedLoadCategory")}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ✅ overlay loader (prevents click while fetching/saving) */}
        {isBusy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-black/40">
            <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs ring-1 ring-inset ring-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:ring-gray-800">
              {t("common.loading")}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
