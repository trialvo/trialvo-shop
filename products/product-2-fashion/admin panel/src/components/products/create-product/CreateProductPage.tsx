// CreateProductPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Package,
  Shield,
  Star,
  ToggleLeft,
  Truck,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Switch from "@/components/form/switch/Switch";
import RichTextEditor from "@/components/ui/editor/RichTextEditor";
import ImageMultiUploader, { type UploadedImage } from "@/components/ui/upload/ImageMultiUploader";
import VideoUploader from "@/components/ui/upload/VideoUploader";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { getBrands } from "@/api/brands.api";
import { getColors } from "@/api/colors.api";
import { getAttributes, type Attribute, type AttributeVariant } from "@/api/attributes.api";
import { getChildCategories, getMainCategories, getSubCategories } from "@/api/categories.api";
import { createProduct } from "@/api/products.api";

import SubmitBar from "./create-product-form/SubmitBar";
import Section from "./create-product-form/Section";
import BasicSection from "./create-product-form/BasicSection";
import VariationsSection from "./create-product-form/VariationsSection";
import SeoSection from "./create-product-form/SeoSection";
import PageHeader from "@/components/ui/layout/PageHeader";
type Option = { value: string; label: string };
type SkuMode = "auto" | "manual";
const SKU_MAX_LENGTH = 21;
const SKU_PRODUCT_LENGTH = 5;
const SKU_COLOR_LENGTH = 5;
const SKU_SIZE_LENGTH = 4;

type VariantRow = {
  key: string; // `${colorId}__${variantId}`
  colorId: number;
  variantId: number;

  buyingPrice: number;
  sellingPrice: number;
  discount: number;
  stock: number;
  sku: string;
  weightKg: number;
  freeDelivery: boolean | null; // null = inherit from product, true = free, false = paid

  active: boolean;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function genSkuFromParts(parts: string[]) {
  const cleaned = parts
    .map((p) => p.trim().toUpperCase().replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  const sku = [...cleaned, String(rand)].join("-");
  return sku.length > SKU_MAX_LENGTH ? sku.slice(0, SKU_MAX_LENGTH) : sku;
}

function cleanSkuPart(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function fixedPart(input: string, length: number) {
  const cleaned = cleanSkuPart(input).slice(0, length);
  return cleaned.padEnd(length, "X");
}

function buildSkuFromNames({
  productBase,
  colorName,
  variantName,
  colorId,
  variantId,
}: {
  productBase: string;
  colorName?: string;
  variantName?: string;
  colorId: number;
  variantId: number;
}) {
  const productPart = fixedPart(productBase || "PRODUCT", SKU_PRODUCT_LENGTH);
  const colorPart = fixedPart(colorName ?? `C${colorId}`, SKU_COLOR_LENGTH);
  const sizePart = fixedPart(variantName ?? `V${variantId}`, SKU_SIZE_LENGTH);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${productPart}-${colorPart}-${sizePart}-${String(rand)}`.slice(0, SKU_MAX_LENGTH);
}

function unwrapList<T>(payload: unknown): T[] {
  const anyPayload = payload as any;
  if (Array.isArray(anyPayload)) return anyPayload;
  if (Array.isArray(anyPayload?.data)) return anyPayload.data;
  if (Array.isArray(anyPayload?.rows)) return anyPayload.rows;
  if (Array.isArray(anyPayload?.colors)) return anyPayload.colors;
  if (Array.isArray(anyPayload?.brands)) return anyPayload.brands;
  if (Array.isArray(anyPayload?.attributes)) return anyPayload.attributes;
  return [];
}

function makeKey(colorId: number, variantId: number) {
  return `${colorId}__${variantId}`;
}

function ensureMatrixRows(
  selectedColorIds: number[],
  selectedVariantIds: number[],
  prev: VariantRow[],
  defaults: { buying: number; selling: number; discount: number },
  productBase: string,
  colorNameById: Map<number, string>,
  variantNameById: Map<number, string>,
) {
  const map = new Map(prev.map((r) => [r.key, r] as const));
  const next: VariantRow[] = [];

  for (const colorId of selectedColorIds) {
    for (const variantId of selectedVariantIds) {
      const key = makeKey(colorId, variantId);
      const existing = map.get(key);

      next.push(
        existing ?? {
          key,
          colorId,
          variantId,
          buyingPrice: defaults.buying,
          sellingPrice: defaults.selling,
          discount: defaults.discount,
          stock: 0,
          sku: "",
          weightKg: 0,
          freeDelivery: null, // null = inherit from product-level free_delivery
          active: true,
        },
      );
    }
  }

  return next;
}

function getApiErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;

  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof anyErr?.message === "string" && anyErr.message.trim()) return anyErr.message.trim();

  return "Failed to create product";
}

function getSuccessProductId(res: unknown): number | null {
  const anyRes = res as any;
  if (anyRes?.success === true && Number.isFinite(Number(anyRes?.productId))) return Number(anyRes.productId);
  if (Number.isFinite(Number(anyRes?.productId))) return Number(anyRes.productId);
  return null;
}

/* ----------------------------- UI Components ----------------------------- */

/* ----------------------------- UI Components ----------------------------- */

function CreateProductPageHeader() {
  const { t } = useTranslation();
  const badge = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
      <Package className="h-3 w-3" />
      {t("products.createProduct.newProduct")}
    </span>
  );
  return (
    <PageHeader
      title={t("products.createProduct.createProductTitle")}
      subtitle={t("products.createProduct.createProductSubtitle")}
      badge={badge}
    />
  );
}

function FloatingErrorBanner({
  message,
  visible,
  onDismiss,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  if (!message || !visible) return null;

  return (
    <div className={cn("fixed left-0 right-0 z-[60] px-4")} style={{ top: "calc(var(--app-header-height, 72px) + 12px)" }}>
      <div
        className={cn(
          "mx-auto w-full max-w-[1200px]",
          "rounded-xl border border-error-200 bg-error-50 px-5 py-4",
          "text-sm font-medium text-error-700 shadow-lg",
          "dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300",
        )}
        role="alert"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
            <p className="min-w-0 flex-1 pr-2">{message}</p>
          </div>

          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              "border-error-200 bg-white/70 text-error-700 transition hover:bg-white",
              "dark:border-error-900/40 dark:bg-white/[0.03] dark:text-error-300 dark:hover:bg-white/[0.06]",
            )}
            onClick={onDismiss}
            aria-label={t("products.createProduct.dismissError")}
            title={t("products.createProduct.dismiss")}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaSection({
  images,
  setImages,
  videoUrl,
  setVideoUrl,
}: {
  images: UploadedImage[];
  setImages: (next: UploadedImage[]) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section
      title={t("products.createProduct.mediaTitle")}
      description={t("products.createProduct.mediaDesc")}
      icon={<ImageIcon className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <ImageMultiUploader label={t("products.createProduct.productImages")} images={images} onChange={setImages} max={10} />

        <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-white/[0.015]">
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t("products.createProduct.videoUrl")}</p>
          </div>
          <VideoUploader label="" value={videoUrl} onChange={setVideoUrl} />
        </div>
      </div>
    </Section>
  );
}

function DescriptionsSection({
  shortDescription,
  setShortDescription,
  longDescription,
  setLongDescription,
}: {
  shortDescription: string;
  setShortDescription: (v: string) => void;
  longDescription: string;
  setLongDescription: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section
      title={t("products.createProduct.descriptionsTitle")}
      description={t("products.createProduct.descriptionsDesc")}
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <RichTextEditor
          label={t("products.createProduct.longDescription")}
          value={longDescription}
          onChange={setLongDescription}
          heightClassName="min-h-[260px]"
        />
      </div>
    </Section>
  );
}

function FlagsSection({
  flags,
  setFlags,
}: {
  flags: {
    status: boolean;
    featured: boolean;
    free_delivery: boolean;
    best_deal: boolean;
  };
  setFlags: React.Dispatch<
    React.SetStateAction<{
      status: boolean;
      featured: boolean;
      free_delivery: boolean;
      best_deal: boolean;
    }>
  >;
}) {
  const { t } = useTranslation();
  const items = [
    {
      key: "status" as const,
      label: t("products.createProduct.flagStatus"),
      description: t("products.createProduct.flagStatusDesc"),
      icon: <ToggleLeft className="h-5 w-5" />,
    },
    {
      key: "featured" as const,
      label: t("products.createProduct.flagFeatured"),
      description: t("products.createProduct.flagFeaturedDesc"),
      icon: <Star className="h-5 w-5" />,
    },
    {
      key: "free_delivery" as const,
      label: t("products.createProduct.flagFreeDelivery"),
      description: t("products.createProduct.flagFreeDeliveryDesc"),
      icon: <Truck className="h-5 w-5" />,
    },
    {
      key: "best_deal" as const,
      label: t("products.createProduct.flagBestDeal"),
      description: t("products.createProduct.flagBestDealDesc"),
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  return (
    <Section
      title={t("products.createProduct.flagsTitle")}
      description={t("products.createProduct.flagsDesc")}
      icon={<ToggleLeft className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "group flex items-center justify-between rounded-xl border p-4 transition-all",
              flags[item.key]
                ? "border-brand-200 bg-brand-50/50 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/5"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition",
                  flags[item.key]
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                )}
              >
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </div>
            <Switch
              key={`flag-${item.key}-${flags[item.key]}`}
              label=""
              defaultChecked={flags[item.key]}
              onChange={(checked) => setFlags((p) => ({ ...p, [item.key]: checked }))}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------- Page Component ---------------------------- */

export default function CreateProductPage() {
  const { t } = useTranslation();
  // -------------------- Form State --------------------
  const [productName, setProductName] = useState("");
  const [productNameBd, setProductNameBd] = useState("");
  const [productSlug, setProductSlug] = useState("");

  const [mainCategoryId, setMainCategoryId] = useState<number>(0);
  const [subCategoryId, setSubCategoryId] = useState<number>(0);

  // ✅ Child Category is OPTIONAL now
  // - initially null
  // - admin may keep it empty
  const [childCategoryId, setChildCategoryId] = useState<number | null>(null);

  const [brandId, setBrandId] = useState<number>(0);
  const [attributeId, setAttributeId] = useState<number>(0);

  const [skuMode, setSkuMode] = useState<SkuMode>("auto");
  const [skuBase, setSkuBase] = useState("");

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  const [flags, setFlags] = useState({
    status: true,
    featured: false,
    free_delivery: false,
    best_deal: false,
  });

  const [seo, setSeo] = useState({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    robots: "index, follow",
  });

  // Variations selection
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const [matrix, setMatrix] = useState<VariantRow[]>([]);

  const [validationError, setValidationError] = useState("");
  const [errorBannerVisible, setErrorBannerVisible] = useState(true);

  useEffect(() => {
    if (validationError) setErrorBannerVisible(true);
  }, [validationError]);

  // -------------------- Lookups --------------------
  const { data: mainRes, isLoading: mainLoading } = useQuery({
    queryKey: ["mainCategories-all"],
    queryFn: () => getMainCategories({ limit: 9999 }),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: subRes, isLoading: subLoading } = useQuery({
    queryKey: ["subCategories-by-main", mainCategoryId],
    queryFn: () => getSubCategories({ main_category_id: mainCategoryId, limit: 9999 }),
    enabled: !!mainCategoryId,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: childRes, isLoading: childLoading } = useQuery({
    queryKey: ["childCategories-by-sub", subCategoryId],
    queryFn: () => getChildCategories({ sub_category_id: subCategoryId, limit: 9999 }),
    enabled: !!subCategoryId,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: brandRes, isLoading: brandLoading } = useQuery({
    queryKey: ["brands-all"],
    queryFn: () => getBrands({ limit: 9999 }),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: colorRes, isLoading: colorLoading } = useQuery({
    queryKey: ["colors-all"],
    queryFn: () => getColors({ limit: 9999 }),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: attrRes, isLoading: attrLoading } = useQuery({
    queryKey: ["attributes-all"],
    queryFn: () => getAttributes({ limit: 9999 }),
    staleTime: 60_000,
    retry: 1,
  });

  const mainCategories = useMemo(() => unwrapList<any>(mainRes), [mainRes]);
  const subCategories = useMemo(() => unwrapList<any>(subRes), [subRes]);
  const childCategories = useMemo(() => unwrapList<any>(childRes), [childRes]);

  const brands = useMemo(() => unwrapList<any>(brandRes).filter((b: any) => b.status !== false), [brandRes]);
  const colors = useMemo(() => unwrapList<any>(colorRes).filter((c: any) => c.status !== false), [colorRes]);
  const attributes = useMemo(() => unwrapList<Attribute>(attrRes).filter((a) => a.status !== false), [attrRes]);

  const initialLoading = mainLoading || brandLoading || colorLoading || attrLoading;

  // -------------------- Default selections when lookups load --------------------
  useEffect(() => {
    if (!mainCategories.length) return;
    setMainCategoryId((p) => (p ? p : Number(mainCategories[0]?.id ?? 0)));
  }, [mainCategories]);

  // when main changes -> reset dependent fields fast
  useEffect(() => {
    setSubCategoryId(0);
    // ✅ child optional: reset to null
    setChildCategoryId(null);
  }, [mainCategoryId]);

  useEffect(() => {
    if (subLoading) return;

    if (!subCategories.length) {
      setSubCategoryId(0);
      return;
    }

    setSubCategoryId((p) =>
      subCategories.some((s: any) => Number(s.id) === Number(p)) ? p : Number(subCategories[0]?.id ?? 0),
    );
  }, [subCategories, subLoading]);

  // when sub changes -> reset child fast
  useEffect(() => {
    setChildCategoryId(null);
  }, [subCategoryId]);

  // ✅ IMPORTANT: do NOT auto select first child
  // - keep null unless admin selected something
  // - only clear if currently selected is not available anymore
  useEffect(() => {
    if (childLoading) return;

    if (!childCategories.length) {
      setChildCategoryId(null);
      return;
    }

    if (childCategoryId === null) return;

    const exists = childCategories.some((c: any) => Number(c.id) === Number(childCategoryId));
    if (!exists) setChildCategoryId(null);
  }, [childCategories, childLoading, childCategoryId]);

  useEffect(() => {
    if (!brands.length) return;
    setBrandId((p) => (p ? p : Number(brands[0]?.id ?? 0)));
  }, [brands]);

  useEffect(() => {
    if (!attributes.length) return;
    setAttributeId((p) => (p ? p : Number(attributes[0]?.id ?? 0)));
  }, [attributes]);

  // -------------------- Auto slug --------------------
  useEffect(() => {
    setProductSlug(slugify(productName));
  }, [productName]);

  // -------------------- Variants from selected attribute --------------------
  const selectedAttribute = useMemo(
    () => attributes.find((a) => Number(a.id) === Number(attributeId)),
    [attributes, attributeId],
  );

  const availableVariants: AttributeVariant[] = useMemo(() => {
    const list = Array.isArray(selectedAttribute?.variants) ? selectedAttribute.variants : [];
    return list.filter((v) => v && v.status !== false);
  }, [selectedAttribute]);

  // When attribute changes -> clear selectedVariantIds + matrix
  useEffect(() => {
    setSelectedVariantIds([]);
    setMatrix([]);
  }, [attributeId]);

  // -------------------- SKU base generator --------------------
  const generateSkuBase = () => {
    const brand = brands.find((b: any) => Number(b.id) === Number(brandId))?.name ?? "BRAND";
    const cat = mainCategories.find((c: any) => Number(c.id) === Number(mainCategoryId))?.name ?? "CAT";
    const name = productName || "PRODUCT";
    setSkuBase(genSkuFromParts([brand, cat, name]));
  };

  useEffect(() => {
    if (skuMode !== "auto") return;
    if (!productName.trim()) return;
    generateSkuBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuMode, productName, brandId, mainCategoryId]);

  // -------------------- Options --------------------
  const mainOptions: Option[] = useMemo(
    () =>
      mainCategories.map((c: any) => ({
        value: String(c.id),
        label: String(c.name),
        status: c.status !== false,
      })),
    [mainCategories],
  );

  const subOptions: Option[] = useMemo(
    () =>
      subCategories.map((s: any) => ({
        value: String(s.id),
        label: String(s.name),
        status: s.status !== false,
      })),
    [subCategories],
  );

  // ✅ For child select, we keep options normal (no auto select)
  const childOptions: Option[] = useMemo(
    () =>
      childCategories.map((c: any) => ({
        value: String(c.id),
        label: String(c.name),
        status: c.status !== false,
      })),
    [childCategories],
  );

  const brandOptions: Option[] = useMemo(
    () => brands.map((b: any) => ({ value: String(b.id), label: String(b.name) })),
    [brands],
  );

  const attributeOptions: Option[] = useMemo(
    () => attributes.map((a) => ({ value: String(a.id), label: String(a.name) })),
    [attributes],
  );

  // Colors dropdown incremental unique
  const remainingColors = useMemo(() => colors.filter((c: any) => !selectedColorIds.includes(Number(c.id))), [colors, selectedColorIds]);

  const colorOptions: Option[] = useMemo(
    () =>
      remainingColors.map((c: any) => ({
        value: String(c.id),
        label: String(c.name),
      })),
    [remainingColors],
  );

  const selectedColors = useMemo(() => {
    const byId = new Map(colors.map((c: any) => [Number(c.id), c]));
    return selectedColorIds.map((id) => byId.get(Number(id))).filter(Boolean);
  }, [colors, selectedColorIds]);

  const colorNameById = useMemo(() => {
    return new Map(colors.map((c: any) => [Number(c.id), String(c.name ?? "")]));
  }, [colors]);

  const variantNameById = useMemo(() => {
    return new Map(availableVariants.map((v) => [Number(v.id), String(v.name ?? "")]));
  }, [availableVariants]);

  // -------------------- Ensure matrix rows when selections change --------------------
  useEffect(() => {
    const productBase = productSlug || skuBase || "PRODUCT";

    const next = ensureMatrixRows(
      selectedColorIds,
      selectedVariantIds,
      matrix,
      { buying: 0, selling: 0, discount: 0 },
      productBase,
      colorNameById,
      variantNameById,
    );

    const same = next.length === matrix.length && next.every((n, i) => matrix[i]?.key === n.key);
    if (!same) setMatrix(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorIds, selectedVariantIds, productSlug, skuBase, colorNameById, variantNameById]);

  // -------------------- Matrix helpers --------------------
  const toggleVariantId = (id: number) => {
    setSelectedVariantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    setMatrix((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  // group rows by color (for rowspan view)
  const grouped = useMemo(() => {
    const g = new Map<number, VariantRow[]>();
    for (const r of matrix) {
      const arr = g.get(r.colorId) ?? [];
      arr.push(r);
      g.set(r.colorId, arr);
    }
    return selectedColorIds
      .map((id) => ({ colorId: id, rows: g.get(id) ?? [] }))
      .filter((x) => x.rows.length > 0);
  }, [matrix, selectedColorIds]);

  // -------------------- Validation --------------------
  const validate = () => {
    if (!productName.trim()) return t("products.createProduct.valProductName");
    if (!productSlug.trim()) return t("products.createProduct.valSlug");
    if (!mainCategoryId) return t("products.createProduct.valMainCategory");
    if (!subCategoryId) return t("products.createProduct.valSubCategory");

    // ✅ child category এখন optional, তাই আর required না
    // if (!childCategoryId) return "Child category is required.";

    if (!brandId) return t("products.createProduct.valBrand");
    if (!attributeId) return t("products.createProduct.valAttribute");

    if (selectedColorIds.length === 0) return t("products.createProduct.valColor");
    if (selectedVariantIds.length === 0) return t("products.createProduct.valVariant");

    const activeRows = matrix.filter((r) => r.active);
    if (!activeRows.length) return t("products.createProduct.valActiveVariation");

    const invalid = activeRows.find((r) => r.sellingPrice <= 0);
    if (invalid) return t("products.createProduct.valSellingPrice");

    return null;
  };

  // -------------------- Submit --------------------
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (res: unknown) => {
      const productId = getSuccessProductId(res);
      const anyRes = res as any;

      if (anyRes?.success === true) {
        toast.success(productId ? `${t("products.createProduct.productCreated")} (ID: ${productId})` : t("products.createProduct.productCreated"));
        setValidationError("");
        setErrorBannerVisible(false);
        return;
      }

      const msg =
        (typeof anyRes?.error === "string" && anyRes.error.trim()) ||
        (typeof anyRes?.message === "string" && anyRes.message.trim()) ||
        t("products.createProduct.failedCreateProduct");

      toast.error(msg);
      setValidationError(msg);
      setErrorBannerVisible(true);
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err);
      toast.error(msg);
      setValidationError(msg);
      setErrorBannerVisible(true);
    },
  });

  const submit = () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      setErrorBannerVisible(true);
      return;
    }

    const variations = matrix
      .filter((r) => r.active)
      .map((r) => ({
        color_id: r.colorId,
        variant_id: r.variantId,
        buying_price: Math.max(0, r.buyingPrice),
        selling_price: Math.max(0, r.sellingPrice),
        discount: Math.max(0, r.discount),
        stock: Math.max(0, r.stock),
        sku: r.sku,
        weight_kg: r.weightKg ?? 0,
        free_delivery: r.freeDelivery !== undefined ? r.freeDelivery : null,
      }));

    // ✅ Child Category rules:
    // - if not selected => null
    // - if selected => id
    createMutation.mutate({
      product_images: images.map((i) => i.file),
      name: productName.trim(),
      name_bd: productNameBd.trim() || undefined,
      slug: productSlug.trim(),
      main_category_id: mainCategoryId,
      sub_category_id: subCategoryId,

      // ✅ send null when not selected
      child_category_id: childCategoryId ?? null,

      brand_id: brandId,
      attribute_id: attributeId,
      video_path: videoUrl.trim() ? videoUrl.trim() : undefined,

      short_description: shortDescription,
      long_description: longDescription,

      status: flags.status,
      featured: flags.featured,
      free_delivery: flags.free_delivery,
      best_deal: flags.best_deal,

      meta_title: seo.meta_title,
      meta_description: seo.meta_description,
      meta_keywords: seo.meta_keywords,
      canonical_url: seo.canonical_url,
      og_title: seo.og_title,
      og_description: seo.og_description,
      robots: seo.robots,

      variations,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  // -------------------- UI --------------------
  if (initialLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <div className="h-7 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800/60" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FloatingErrorBanner message={validationError} visible={errorBannerVisible} onDismiss={() => setErrorBannerVisible(false)} />

      <CreateProductPageHeader />

      <BasicSection
        productName={productName}
        setProductName={setProductName}
        productNameBd={productNameBd}
        setProductNameBd={setProductNameBd}
        productSlug={productSlug}
        mainCategoryId={mainCategoryId}
        setMainCategoryId={setMainCategoryId}
        subCategoryId={subCategoryId}
        setSubCategoryId={setSubCategoryId}
        // ✅ BasicSection is still number-based, so map null <-> 0
        childCategoryId={childCategoryId ?? 0}
        setChildCategoryId={(n) => setChildCategoryId(n ? Number(n) : null)}
        brandId={brandId}
        setBrandId={setBrandId}
        mainOptions={mainOptions}
        subOptions={subOptions}
        childOptions={childOptions}
        brandOptions={brandOptions}
        subLoading={subLoading}
        childLoading={childLoading}
      // ✅ if you update BasicSection placeholder text, it will show:
      // "Select child category (optional)"
      />

      <VariationsSection
        colors={colors}
        availableVariants={availableVariants}
        productSlug={productSlug}
        attributeId={attributeId}
        setAttributeId={setAttributeId}
        attributeOptions={attributeOptions}
        selectedColorIds={selectedColorIds}
        setSelectedColorIds={setSelectedColorIds}
        selectedColors={selectedColors}
        colorOptions={colorOptions}
        selectedVariantIds={selectedVariantIds}
        toggleVariantId={toggleVariantId}
        grouped={grouped}
        matrix={matrix}
        updateRow={updateRow}
      />

      <MediaSection images={images} setImages={setImages} videoUrl={videoUrl} setVideoUrl={setVideoUrl} />

      <DescriptionsSection
        shortDescription={shortDescription}
        setShortDescription={setShortDescription}
        longDescription={longDescription}
        setLongDescription={setLongDescription}
      />

      <FlagsSection flags={flags} setFlags={setFlags} />

      <SeoSection seo={seo} setSeo={setSeo} />

      <SubmitBar onSubmit={submit} loading={createMutation.isPending} />
    </div>
  );
}
