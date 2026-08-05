// src/components/business-settings/banner-settings/BannerModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crop as CropIcon, Image as ImageIcon, Link2, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { cn } from "@/lib/utils";

import { createBanner, getBannerById, updateBanner, type BannerApi } from "@/api/banners.api";
import { getProducts, type ProductEntity } from "@/api/products.api";
// ✅ adjust this import path if your categories api file name/path is different
import { getChildCategories } from "@/api/categories.api";

import { toPublicUrl } from "@/utils/toPublicUrl";
import type { BannerRow, Option } from "./types";
import { TYPES, ZONES } from "./banner.constants";
import ImageCropperModal from "./BannerImageCropper";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: BannerRow | null;
  onClose: () => void;
};

type ImgMeta = { width: number; height: number; ratio: number };

const RECOMMENDED = { ratio: 3 / 1, width: 1200, height: 400 };

function ratioLabel(r: number) {
  return `${r.toFixed(2)}:1`;
}

function isImageFile(f: File) {
  return f.type.startsWith("image/");
}

function getApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return "Something went wrong!";
}


const typeOptions: Option[] = TYPES.map((t) => ({ value: t, label: t }));
const ZONE_LABEL_KEY: Record<string, string> = {
  "Home Top": "homeTop",
  "Home Middle": "homeMiddle",
  "Home Bottom": "homeBottom",
  "Category Page": "categoryPage",
  "Product Page": "productPage",
  Campaign: "campaign",
};

type LinkMode = "manual" | "product" | "category";

function encodePathSegment(v: string) {
  // matches your example: spaces become %20
  return encodeURIComponent(v);
}

function buildProductPath(p: Pick<ProductEntity, "id" | "slug">) {
  return `/products/${p.slug}/${p.id}/`;
}

function buildCategoryPath(c: { id: number; name: string }) {
  return `/category/${encodePathSegment(c.name)}/?childId=${c.id}`;
}

function detectLinkModeFromPath(path: string): LinkMode {
  const v = (path ?? "").trim();
  if (!v) return "manual";
  if (v.startsWith("/products/")) return "product";
  if (v.startsWith("/category/")) return "category";
  return "manual";
}

function pickList<T>(payload: any, key: string): T[] {
  const v = payload?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

export default function BannerModal({ open, mode, initial, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const editingId = initial?.id;

  const bannerQuery = useQuery({
    queryKey: ["banner", editingId],
    queryFn: async () => {
      if (!editingId) return null;
      const res = await getBannerById(editingId);
      return res.banner;
    },
    enabled: open && mode === "edit" && Boolean(editingId),
    staleTime: 0,
  });

  const apiBanner: BannerApi | null = (bannerQuery.data as any) ?? null;

  // form state
  const [title, setTitle] = useState("");
  const [zone, setZone] = useState<string>(ZONES[0] ?? "Home Top");
  const [type, setType] = useState<string>("Default");

  // ✅ dynamic path
  const [path, setPath] = useState<string>("");
  const [linkMode, setLinkMode] = useState<LinkMode>("manual");

  // product/category list state
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState(true);

  // image
  const [imageUrl, setImageUrl] = useState<string | null>(null); // preview url (objectURL or public)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const [imgMeta, setImgMeta] = useState<ImgMeta | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ✅ crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceName, setCropSourceName] = useState<string | undefined>(undefined);

  const zoneOptions: Option[] = useMemo(
    () =>
      ZONES.map((z) => ({
        value: z,
        label: t(`banners.zones.${ZONE_LABEL_KEY[z] ?? "default"}`, { defaultValue: z }),
      })),
    [t]
  );

  const linkModeOptions: Option[] = useMemo(
    () => [
      { value: "manual", label: t("bannerModal.linkModeManual") },
      { value: "product", label: t("bannerModal.linkModeProduct") },
      { value: "category", label: t("bannerModal.linkModeCategory") },
    ],
    [t]
  );

  // ✅ Products list (render list, select -> auto path)
  const productsQuery = useQuery({
    queryKey: ["bannerPathProducts", productSearch],
    queryFn: () =>
      getProducts({
        search: productSearch.trim() ? productSearch.trim() : undefined,
        limit: 50,
        offset: 0,
      }),
    enabled: open && linkMode === "product",
    staleTime: 15_000,
    retry: 1,
  });

  const productList: ProductEntity[] = useMemo(() => {
    const data = productsQuery.data as any;
    return pickList<ProductEntity>(data, "products");
  }, [productsQuery.data]);

  // ✅ Child categories list (render list, select -> auto path)
  const childCatsQuery = useQuery({
    queryKey: ["bannerPathChildCategories", categorySearch],
    queryFn: () =>
      getChildCategories({
        search: categorySearch.trim() ? categorySearch.trim() : undefined,
        limit: 80,
        offset: 0,
      } as any),
    enabled: open && linkMode === "category",
    staleTime: 15_000,
    retry: 1,
  });

  const childCategoryList: Array<{ id: number; name: string; sub_category_id?: number }> = useMemo(() => {
    const data = childCatsQuery.data as any;
    return pickList<any>(data, "data")?.length
      ? (data.data as any[])
      : pickList<any>(data, "childCategories")?.length
        ? (data.childCategories as any[])
        : pickList<any>(data, "categories")?.length
          ? (data.categories as any[])
          : Array.isArray(data) ? data : [];
  }, [childCatsQuery.data]);

  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      setTitle("");
      setZone(ZONES[0] ?? "Home Top");
      setType("Default");

      setPath("");
      setLinkMode("manual");
      setProductSearch("");
      setCategorySearch("");

      setFeatured(false);
      setStatus(true);

      setImageUrl(null);
      setImageFile(null);
      setImageFileName(null);
      setImgMeta(null);

      setCropOpen(false);
      setCropSourceUrl(null);
      setCropSourceName(undefined);

      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const b = apiBanner
      ? {
        title: apiBanner.title,
        zone: apiBanner.zone,
        type: apiBanner.type,
        path: apiBanner.path,
        featured: apiBanner.featured,
        status: apiBanner.status,
        img_path: apiBanner.img_path,
      }
      : initial
        ? {
          title: initial.title,
          zone: initial.zone,
          type: initial.type,
          path: initial.path,
          featured: initial.featured,
          status: initial.status,
          img_path: initial.imgPath ? initial.imgPath.replace(toPublicUrl(""), "") : null,
        }
        : null;

    if (!b) return;

    setTitle(b.title ?? "");
    setZone(b.zone ?? (ZONES[0] ?? "Home Top"));
    setType(b.type ?? "Default");

    const nextPath = b.path ?? "";
    setPath(nextPath);
    setLinkMode(detectLinkModeFromPath(nextPath));
    setProductSearch("");
    setCategorySearch("");

    setFeatured(Boolean(b.featured));
    setStatus(Boolean(b.status));

    const serverImg = apiBanner?.img_path ?? null;
    setImageUrl(serverImg ? toPublicUrl(serverImg) : initial?.imgPath ?? null);

    setImageFile(null);
    setImageFileName(null);
    setImgMeta(null);

    setCropOpen(false);
    setCropSourceUrl(null);
    setCropSourceName(undefined);

    if (fileRef.current) fileRef.current.value = "";
  }, [open, mode, apiBanner, initial]);

  const loadMeta = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      setImgMeta({ width: w, height: h, ratio: h > 0 ? w / h : 0 });
    };
    img.src = src;
  };

  // ✅ when user picks a file -> open crop modal immediately
  const openCropForFile = (f: File) => {
    if (!isImageFile(f)) {
      toast.error(t("bannerModal.selectImageFile"));
      return;
    }
    const src = URL.createObjectURL(f);
    setCropSourceUrl(src);
    setCropSourceName(f.name);
    setCropOpen(true);
  };

  const onFileSelected = (f: File | null) => {
    if (!f) return;
    openCropForFile(f);
  };

  const pickImage = () => fileRef.current?.click();

  const resetImage = () => {
    // Reset to original server image (edit) or empty (create)
    if (mode === "edit") {
      const serverImg = apiBanner?.img_path ? toPublicUrl(apiBanner.img_path) : null;
      setImageUrl(serverImg ?? initial?.imgPath ?? null);
    } else {
      setImageUrl(null);
    }

    setImageFile(null);
    setImageFileName(null);
    setImgMeta(null);

    setCropOpen(false);
    setCropSourceUrl(null);
    setCropSourceName(undefined);

    if (fileRef.current) fileRef.current.value = "";
  };

  // Optional: allow re-crop current local file
  const reCropCurrent = () => {
    if (!imageFile) {
      toast.error(t("bannerModal.noCropImage"));
      return;
    }
    openCropForFile(imageFile);
  };

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (mode === "create" && !imageFile) return false; // create requires cropped image
    return true;
  }, [title, mode, imageFile]);

  const ratioDiff = useMemo(() => {
    if (!imgMeta?.ratio) return null;
    return Math.abs(imgMeta.ratio - RECOMMENDED.ratio);
  }, [imgMeta]);

  const ratioOk = useMemo(() => {
    if (ratioDiff == null) return null;
    return ratioDiff <= 0.12;
  }, [ratioDiff]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error("Image required");

      return createBanner({
        banner_img: imageFile,
        title: title.trim(),
        zone,
        type,
        path: path.trim() ? path.trim() : null,
        status,
        featured,
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("bannerModal.bannerCreated"));
        qc.invalidateQueries({ queryKey: ["banners"] });
        onClose();
        return;
      }
      toast.error(res?.message || res?.error || t("bannerModal.createFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Missing banner id");

      const base = apiBanner
        ? {
          title: apiBanner.title ?? "",
          zone: apiBanner.zone ?? "",
          type: apiBanner.type ?? "",
          path: apiBanner.path ?? "",
          status: Boolean(apiBanner.status),
          featured: Boolean(apiBanner.featured),
        }
        : initial
          ? {
            title: initial.title ?? "",
            zone: initial.zone ?? "",
            type: initial.type ?? "",
            path: initial.path ?? "",
            status: Boolean(initial.status),
            featured: Boolean(initial.featured),
          }
          : null;

      const patch: any = {};

      if (!base || title.trim() !== (base.title ?? "")) patch.title = title.trim();
      if (!base || zone !== (base.zone ?? "")) patch.zone = zone;
      if (!base || type !== (base.type ?? "")) patch.type = type;

      const nextPath = path.trim() ? path.trim() : "";
      const basePath = (base?.path ?? "") || "";
      if (!base || nextPath !== basePath) patch.path = nextPath ? nextPath : null;

      if (!base || Boolean(status) !== Boolean(base.status)) patch.status = Boolean(status);
      if (!base || Boolean(featured) !== Boolean(base.featured)) patch.featured = Boolean(featured);

      if (imageFile) patch.banner_img = imageFile;

      if (Object.keys(patch).length === 0) return { success: true, message: "No changes" };

      return updateBanner(editingId, patch);
    },
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("bannerModal.bannerUpdated"));
        qc.invalidateQueries({ queryKey: ["banners"] });
        qc.invalidateQueries({ queryKey: ["banner", editingId] });
        onClose();
        return;
      }
      toast.error(res?.message || res?.error || t("bannerModal.updateFailed"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const submit = () => {
    if (!canSave) return;
    if (mode === "create") createMut.mutate();
    else updateMut.mutate();
  };

  const pending = createMut.isPending || updateMut.isPending;
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  // ✅ when crop applied
  const onCropApply = ({ file, previewUrl }: { file: File; previewUrl: string }) => {
    setImageFile(file);
    setImageUrl(previewUrl);
    setImageFileName(file.name);
    loadMeta(previewUrl);

    // cleanup crop source url
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);

    setCropOpen(false);
    setCropSourceUrl(null);
    setCropSourceName(undefined);

    if (fileRef.current) fileRef.current.value = "";
  };

  const onCropClose = () => {
    // if user closes crop modal, don't change current selected image
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropOpen(false);
    setCropSourceUrl(null);
    setCropSourceName(undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onChangeLinkMode = (v: LinkMode) => {
    setLinkMode(v);
    if (v === "manual") return;

    // keep current path, but clear searches
    setProductSearch("");
    setCategorySearch("");
  };

  const selectProduct = (p: ProductEntity) => {
    const next = buildProductPath({ id: p.id, slug: p.slug });
    setPath(next);
    toast.success(t("bannerModal.productPathSet"));
  };

  const selectChildCategory = (c: { id: number; name: string }) => {
    const next = buildCategoryPath({ id: c.id, name: c.name });
    setPath(next);
    toast.success(t("bannerModal.categoryPathSet"));
  };

  if (!isMounted) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <button
          type="button"
          style={getModalBackdropStyle(isVisible)}
          className="absolute inset-0 bg-black/60"
          onClick={() => !pending && onClose()}
          aria-label={t("bannerModal.closeOverlay")}
        />

        <div
          onTransitionEnd={handleTransitionEnd}
          style={getModalDialogStyle(isVisible)}
          className="relative w-[96vw] max-w-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {mode === "create" ? t("bannerModal.titleCreate") : t("bannerModal.titleEdit")}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("bannerModal.subtitle")}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => !pending && onClose()}
              ariaLabel="Close"
              startIcon={<X size={18} />}
            />
          </div>

          {/* Body */}
          <div className="max-h-[80vh] overflow-y-auto px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerModal.bannerInfo")}</h4>

                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("bannerModal.titleLabel")} <span className="text-error-500">*</span>
                      </p>
                      <Input placeholder={t("bannerModal.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("bannerModal.zoneLabel")} <span className="text-error-500">*</span>
                      </p>
                      <Select
                        options={zoneOptions}
                        placeholder={t("bannerModal.zonePlaceholder")}
                        defaultValue={zone}
                        onChange={(v) => setZone(String(v))}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("bannerModal.typeLabel")} <span className="text-error-500">*</span>
                      </p>
                      <Select
                        options={typeOptions}
                        placeholder={t("bannerModal.typePlaceholder")}
                        defaultValue={type}
                        onChange={(v) => setType(String(v))}
                      />
                    </div>

                    {/* ✅ Dynamic Path Builder */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("bannerModal.pathLabel")}</p>

                        <div className="w-full sm:w-[240px]">
                          <Select
                            options={linkModeOptions}
                            placeholder={t("bannerModal.pathSourcePlaceholder")}
                            defaultValue={linkMode}
                            onChange={(v) => onChangeLinkMode(String(v) as LinkMode)}
                          />
                        </div>
                      </div>

                      {linkMode === "manual" ? (
                        <>
                          <Input
                            placeholder={t("bannerModal.manualPathPlaceholder")}
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("bannerModal.manualPathHint")}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                <Link2 size={16} />
                                {linkMode === "product" ? t("bannerModal.selectProduct") : t("bannerModal.selectCategory")}
                              </div>

                              <div className="w-full sm:w-[320px]">
                                <Input
                                  placeholder={linkMode === "product" ? t("bannerModal.searchProduct") : t("bannerModal.searchCategory")}
                                  value={linkMode === "product" ? productSearch : categorySearch}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (linkMode === "product") setProductSearch(v);
                                    else setCategorySearch(v);
                                  }}
                                />
                              </div>
                            </div>

                            {/* Selected path preview */}
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-xs text-gray-600 dark:text-gray-300">{t("bannerModal.selectedPath")}</div>
                              <div className="w-full sm:max-w-[520px]">
                                <div className="truncate rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  {path?.trim() ? path.trim() : "—"}
                                </div>
                              </div>
                            </div>

                            {/* List */}
                            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                              <div className="border-b border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                                {linkMode === "product" ? (
                                  productsQuery.isFetching ? t("bannerModal.loadingProducts") : t("bannerModal.productsCount", { count: productList.length })
                                ) : childCatsQuery.isFetching ? (
                                  t("bannerModal.loadingCategories")
                                ) : (
                                  t("bannerModal.categoriesCount", { count: childCategoryList.length })
                                )}
                              </div>

                              <div className="max-h-[260px] overflow-y-auto">
                                {linkMode === "product" ? (
                                  productsQuery.isLoading ? (
                                    <div className="p-3">
                                      <div className="h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                      <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                      <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                  ) : productList.length ? (
                                    productList.map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        className={cn(
                                          "w-full px-3 py-3 text-left transition",
                                          "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                                          "border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                        )}
                                        onClick={() => selectProduct(p)}
                                        disabled={pending}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                              {p.name}
                                            </div>
                                            <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                              slug: {p.slug} • id: {p.id}
                                            </div>
                                          </div>

                                          <div className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {t("bannerModal.set")}
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t("bannerModal.noProducts")}</div>
                                  )
                                ) : childCatsQuery.isLoading ? (
                                  <div className="p-3">
                                    <div className="h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                    <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                    <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
                                  </div>
                                ) : childCategoryList.length ? (
                                  childCategoryList.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      className={cn(
                                        "w-full px-3 py-3 text-left transition",
                                        "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                                        "border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                      )}
                                      onClick={() => selectChildCategory({ id: c.id, name: c.name })}
                                      disabled={pending}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                            {c.name}
                                          </div>
                                          <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                            childId: {c.id}
                                            {typeof c.sub_category_id === "number" ? ` • subId: ${c.sub_category_id}` : ""}
                                          </div>
                                        </div>

                                        <div className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                          {t("bannerModal.set")}
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t("bannerModal.noCategories")}</div>
                                )}
                              </div>
                            </div>

                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {t("bannerModal.autoPathHint")}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerModal.featured")}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t("bannerModal.featuredHint")}</p>
                        </div>
                        <Switch label="" defaultChecked={featured} onChange={(c) => setFeatured(c)} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerModal.statusLabel")}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{status ? t("bannerModal.statusActive") : t("bannerModal.statusInactive")}</p>
                        </div>
                        <Switch label="" defaultChecked={status} onChange={(c) => setStatus(c)} />
                      </div>
                    </div>
                  </div>

                  {mode === "edit" && bannerQuery.isFetching ? (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t("bannerModal.loadingBanner")}</p>
                  ) : null}
                </div>
              </div>

              {/* Right Upload */}
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerModal.bannerImage")}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t("bannerModal.imageSubtitle")}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={pickImage} disabled={pending}>
                        {t("bannerModal.upload")}
                      </Button>
                      <Button variant="outline" onClick={resetImage} disabled={pending}>
                        {t("bannerModal.reset")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={reCropCurrent}
                        disabled={pending || !imageFile}
                        startIcon={<CropIcon size={16} />}
                      >
                        {t("bannerModal.crop")}
                      </Button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-4 overflow-hidden rounded-xl border transition",
                      dragOver ? "border-brand-500" : "border-gray-200 dark:border-gray-800"
                    )}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0] ?? null;
                      if (file) onFileSelected(file);
                    }}
                  >
                    <div className="relative w-full bg-gray-50 dark:bg-gray-800">
                      <div className="pt-[33.333%]" />
                      <div className="absolute inset-0">
                        {imageUrl ? (
                          <>
                            <img src={imageUrl} alt="Banner preview" className="h-full w-full object-cover" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                          </>
                        ) : (
                          <button
                            type="button"
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
                            onClick={pickImage}
                            disabled={pending}
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                              <UploadCloud size={20} />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold">
                                {mode === "create" ? t("bannerModal.uploadRequired") : t("bannerModal.uploadOptional")}
                              </p>
                              <p className="mt-1 text-xs">{t("bannerModal.dragDrop")}</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex h-7 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                          <ImageIcon size={14} />
                          {imageFileName ?? (imageUrl ? t("bannerModal.currentImage") : t("bannerModal.noFileSelected"))}
                        </span>

                        {imgMeta ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center rounded-lg border border-gray-200 bg-white px-2 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                              {imgMeta.width}×{imgMeta.height}
                            </span>

                            <span
                              className={cn(
                                "inline-flex h-7 items-center rounded-lg border px-2 font-semibold",
                                ratioOk === true
                                  ? "border-success-200 bg-success-50 text-success-700 dark:border-success-900/30 dark:bg-success-500/10 dark:text-success-300"
                                  : "border-error-200 bg-error-50 text-error-700 dark:border-error-900/30 dark:bg-error-500/10 dark:text-error-300"
                              )}
                            >
                              Ratio {ratioLabel(imgMeta.ratio)}
                              {ratioOk === true ? " ✓" : " !"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">{t("bannerModal.cropRatioEnforced")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("bannerModal.bestPractice")}</h4>
                  <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <li>• {t("bannerModal.tipCrop")}</li>
                    <li>• {t("bannerModal.tipText")}</li>
                    <li>• {t("bannerModal.tipQuality")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="outline" onClick={() => !pending && onClose()} disabled={pending}>
              {t("bannerModal.cancel")}
            </Button>
            <Button onClick={submit} disabled={!canSave || pending}>
              {pending ? t("bannerModal.saving") : mode === "create" ? t("bannerModal.submit") : t("bannerModal.update")}
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ Crop modal */}
      <ImageCropperModal
        open={cropOpen}
        imageUrl={cropSourceUrl ?? ""}
        fileName={cropSourceName}
        aspect={3 / 1}
        onClose={onCropClose}
        onApply={onCropApply}
      />
    </>
  );
}
