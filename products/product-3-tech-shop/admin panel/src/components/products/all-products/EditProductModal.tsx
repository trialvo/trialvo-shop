"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  Save,
  Star,
  ToggleLeft,
  Trash2,
  Truck,
  Video,
  Zap
} from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

import Input from "@/components/form/input/InputField";
import NumericInput from "@/components/form/input/NumericInput";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import RichTextEditor from "@/components/ui/editor/RichTextEditor";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImageMultiUploader, { type UploadedImage } from "@/components/ui/upload/ImageMultiUploader";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";

import {
  getAttributes,
  type Attribute,
  type AttributeVariant,
} from "@/api/attributes.api";
import { getBrands, type Brand } from "@/api/brands.api";
import {
  getChildCategories,
  getMainCategories,
  getSubCategories,
} from "@/api/categories.api";
import { api } from "@/api/client";
import { getColors, type Color } from "@/api/colors.api";
import {
  assignImageSku,
  getProduct,
  reorderProductImages,
  updateProduct,
  type ProductImage,
} from "@/api/products.api";
import type {
  ChildCategory,
  MainCategory,
  SubCategory,
} from "@/components/products/product-category/types";
import DraggableImageGrid from "@/components/products/create-product/DraggableImageGrid";
import BaseModal from "./BaseModal";

type Props = {
  open: boolean;
  productId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
};

type Option = { value: string; label: string; status?: boolean };

type ExistingImage = ProductImage;

type VariationColor = {
  id: number;
  name: string;
  hex?: string | null;
  priority?: number;
  status?: boolean;
};

type VariationVariant = {
  id: number;
  name: string;
  priority?: number;
  status?: boolean;
  attribute?: {
    id: number;
    name: string;
    priority?: number;
  };
};

type VariationRow = {
  id: number;
  product_id?: number;
  color_id?: number;
  variant_id?: number;
  color?: VariationColor | null;
  variant?: VariationVariant | null;
  buying_price: number;
  selling_price: number;
  discount: number;
  discount_type?: number | null;
  final_price?: number;
  stock: number;
  sku: string;
  weight_kg?: number;
  free_delivery?: boolean | null;
  status?: number | boolean;
  in_stock?: boolean;
};

type VariationDraft = {
  color_id: number;
  variant_id: number;
  buying_price: number;
  selling_price: number;
  discount: number;
  stock: number;
  sku: string;
  weight_kg: number;
  free_delivery: boolean | null; // null = inherit from product
};

type InlineEditState = Record<number, VariationDraft>;
type UnknownRecord = Record<string, unknown>;
type ApiErrorData = {
  error?: string;
  message?: string;
  errors?: Array<string | { message?: string; error?: string }>;
};
type AttributeWithValues = Attribute & { values?: unknown[] };
type UpdateProductResponseLike = {
  success?: boolean;
  error?: string;
  message?: string;
  flag?: number;
};

const EMPTY_VARIATION_DRAFT: VariationDraft = {
  color_id: 0,
  variant_id: 0,
  buying_price: 0,
  selling_price: 0,
  discount: 0,
  stock: 0,
  sku: "",
  weight_kg: 0,
  free_delivery: null,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function safeNumber(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.rows)) return payload.rows as T[];
  if (Array.isArray(payload.items)) return payload.items as T[];
  return [];
}

function normalizeRobots(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

function normalizeId(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

const SKU_MAX_LENGTH = 21;
const SKU_PRODUCT_LENGTH = 5;
const SKU_COLOR_LENGTH = 5;
const SKU_SIZE_LENGTH = 4;

function cleanSkuPart(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function fixedPart(input: string, length: number) {
  const cleaned = cleanSkuPart(input).slice(0, length);
  return cleaned.padEnd(length, "X");
}

function buildSku({
  productBase,
  colorName,
  variantName,
}: {
  productBase: string;
  colorName: string;
  variantName: string;
}) {
  const productPart = fixedPart(productBase || "PRODUCT", SKU_PRODUCT_LENGTH);
  const colorPart = fixedPart(colorName || "COLOR", SKU_COLOR_LENGTH);
  const sizePart = fixedPart(variantName || "SIZE", SKU_SIZE_LENGTH);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${productPart}-${colorPart}-${sizePart}-${String(rand)}`.slice(
    0,
    SKU_MAX_LENGTH,
  );
}

function readId(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getVariationColorId(v: VariationRow) {
  return readId(v.color_id ?? v.color?.id ?? 0);
}

function getVariationVariantId(v: VariationRow) {
  return readId(v.variant_id ?? v.variant?.id ?? 0);
}

function pickNestedId(payload: unknown, directKey: string, nestedKey: string) {
  if (!isRecord(payload)) return 0;
  const nested = payload[nestedKey];
  const nestedId = isRecord(nested) ? nested.id : undefined;
  return readId(payload[directKey] ?? nestedId ?? 0);
}

function readStringValue(payload: unknown, key: string, fallback = "") {
  if (!isRecord(payload)) return fallback;
  const value = payload[key];
  return typeof value === "string" ? value : fallback;
}

function readNullableBool(payload: unknown, key: string): boolean | null {
  if (!isRecord(payload)) return null;
  const value = payload[key];
  if (value === null || value === undefined) return null;
  return Boolean(value);
}

function parseApiErrorData(data: unknown): ApiErrorData | null {
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      if (!isRecord(parsed)) return { message: data };
      return parsed as ApiErrorData;
    } catch {
      return { message: data };
    }
  }
  if (!isRecord(data)) return null;
  return data as ApiErrorData;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const errObj = isRecord(err) ? err : null;
  const response = errObj && isRecord(errObj.response) ? errObj.response : null;
  const data = parseApiErrorData(response?.data);

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.errors)) {
    return data.errors
      .map((e) => (typeof e === "string" ? e : (e.message ?? e.error)))
      .filter(Boolean)
      .join(", ");
  }

  const message = errObj?.message;
  if (typeof message === "string") return message;

  return fallback;
}

/**
 * Tries to extract "variant options" from attributes response in a safe way.
 * Supports common shapes:
 * - attr.variants: [{id,name}]
 * - attr.values:   [{id,name}] or ["M","L"] (string list)
 */
function buildVariantOptionsForAttribute(
  attributeId: number,
  attributesRaw: Attribute[],
): Option[] {
  const attr = attributesRaw.find(
    (a) => Number(a.id) === Number(attributeId),
  );
  if (!attr) return [];

  const variants = Array.isArray(attr?.variants) ? attr.variants : null;
  if (variants?.length) {
    return variants.map((x: AttributeVariant) => ({
      value: String(x.id),
      label: String(x.name ?? x.id),
    }));
  }

  const values = Array.isArray((attr as AttributeWithValues).values)
    ? (attr as AttributeWithValues).values
    : null;
  if (values?.length) {
    if (isRecord(values[0]) && "id" in values[0]) {
      return values
        .filter(isRecord)
        .map((x) => ({
          value: String(x.id),
          label: String(x.name ?? x.title ?? x.value ?? x.id),
        }));
    }
    return [];
  }

  return [];
}

export default function EditProductModal({
  open,
  productId,
  onClose,
  onUpdated,
}: Props) {
  const { t } = useTranslation();
  const enabled = open && !!productId;

  // lookups (load all, no params)
  const { data: mainRes, isFetching: mainFetching } = useQuery({
    queryKey: ["mainCategories-all"],
    queryFn: () => getMainCategories(),
    staleTime: 60_000,
  });

  const { data: subRes, isFetching: subFetching } = useQuery({
    queryKey: ["subCategories-all"],
    queryFn: () => getSubCategories(),
    staleTime: 60_000,
  });

  const { data: childRes, isFetching: childFetching } = useQuery({
    queryKey: ["childCategories-all"],
    queryFn: () => getChildCategories(),
    staleTime: 60_000,
  });

  const { data: colorsRes, isFetching: colorsFetching } = useQuery({
    queryKey: ["colors-all"],
    queryFn: () => getColors({ limit: 9999 }),
    staleTime: 60_000,
  });

  const { data: attrsRes, isFetching: attrsFetching } = useQuery({
    queryKey: ["attributes-all"],
    queryFn: () => getAttributes(),
    staleTime: 60_000,
  });

  const { data: brandsRes, isFetching: brandsFetching } = useQuery({
    queryKey: ["brands-all"],
    queryFn: () => getBrands({ limit: 500, offset: 0 }),
    staleTime: 60_000,
  });

  const mains = React.useMemo(() => unwrapList<MainCategory>(mainRes), [mainRes]);
  const subs = React.useMemo(() => unwrapList<SubCategory>(subRes), [subRes]);
  const childs = React.useMemo(() => unwrapList<ChildCategory>(childRes), [childRes]);

  const colorsRaw = React.useMemo(
    () => unwrapList<Color>(colorsRes),
    [colorsRes],
  );
  const attrsRaw = React.useMemo(() => unwrapList<Attribute>(attrsRes), [attrsRes]);
  const brandsRaw = React.useMemo(
    () => unwrapList<Brand>(brandsRes),
    [brandsRes],
  );

  const colorNameById = React.useMemo(
    () =>
      new Map(
        colorsRaw.map((c) => [
          Number(c.id),
          String(c.name ?? `#${c.id}`),
        ]),
      ),
    [colorsRaw],
  );

  const brandNameById = React.useMemo(
    () =>
      new Map(
        brandsRaw.map((b) => [
          Number(b.id),
          String(b.name ?? `#${b.id}`),
        ]),
      ),
    [brandsRaw],
  );

  const colorHexById = React.useMemo(
    () =>
      new Map(colorsRaw.map((c) => [Number(c.id), String(c.hex ?? "")])),
    [colorsRaw],
  );

  const getColorLabel = React.useCallback(
    (colorId: number) => colorNameById.get(Number(colorId)) ?? `#${colorId}`,
    [colorNameById],
  );

  const getColorHex = React.useCallback(
    (colorId: number) => colorHexById.get(Number(colorId)) ?? "",
    [colorHexById],
  );

  // product query
  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(Number(productId)),
    enabled,
    retry: 1,
  });

  // ----------------------------
  // Form state
  // ----------------------------
  const [name, setName] = React.useState("");
  const [nameBd, setNameBd] = React.useState("");
  const [slug, setSlug] = React.useState("");

  const [mainCategoryId, setMainCategoryId] = React.useState<number>(0);
  const [subCategoryId, setSubCategoryId] = React.useState<number>(0);
  const [childCategoryId, setChildCategoryId] = React.useState<number>(0);

  const [brandId, setBrandId] = React.useState<number>(0); // keep for API compatibility
  const [attributeId, setAttributeId] = React.useState<number>(0);

  // ✅ consistent naming: videoUrl
  const [videoUrl, setVideoUrl] = React.useState<string>("");
  const [shortDescription, setShortDescription] = React.useState<string>("");
  const [longDescription, setLongDescription] = React.useState<string>("");

  const [status, setStatus] = React.useState<boolean>(true);
  const [featured, setFeatured] = React.useState<boolean>(false);
  const [freeDelivery, setFreeDelivery] = React.useState<boolean>(false);
  const [bestDeal, setBestDeal] = React.useState<boolean>(false);

  const [metaTitle, setMetaTitle] = React.useState<string>("");
  const [metaDescription, setMetaDescription] = React.useState<string>("");
  const [metaKeywords, setMetaKeywords] = React.useState<string>("");
  const [canonicalUrl, setCanonicalUrl] = React.useState<string>("");
  const [ogTitle, setOgTitle] = React.useState<string>("");
  const [ogDescription, setOgDescription] = React.useState<string>("");
  const [robots, setRobots] = React.useState<string>("index, follow");

  const [existingImages, setExistingImages] = React.useState<ExistingImage[]>(
    [],
  );
  const [deleteImageIds, setDeleteImageIds] = React.useState<number[]>([]);
  const [newImages, setNewImages] = React.useState<UploadedImage[]>([]);

  // variations
  const [variations, setVariations] = React.useState<VariationRow[]>([]);

  const [varEdit, setVarEdit] = React.useState<InlineEditState>({});
  const [addDraft, setAddDraft] = React.useState<VariationDraft>({
    color_id: 0,
    variant_id: 0,
    buying_price: 0,
    selling_price: 0,
    discount: 0,
    stock: 0,
    sku: "",
    weight_kg: 0,
    free_delivery: null,
  });

  // small confirm modal for variation delete
  const [varDeleteOpen, setVarDeleteOpen] = React.useState(false);
  const [varDeleteId, setVarDeleteId] = React.useState<number | null>(null);

  // hydrate form when product changes
  React.useEffect(() => {
    if (!enabled) return;

    const p = productQuery.data?.product;
    if (!p) return;

    setName(String(p.name ?? ""));
    setNameBd(readStringValue(p, "name_bd"));
    setSlug(String(p.slug ?? ""));

    setMainCategoryId(pickNestedId(p, "main_category_id", "main_category"));
    setSubCategoryId(pickNestedId(p, "sub_category_id", "sub_category"));
    setChildCategoryId(pickNestedId(p, "child_category_id", "child_category"));

    setBrandId(pickNestedId(p, "brand_id", "brand"));
    setAttributeId(pickNestedId(p, "attribute_id", "attribute"));

    // ✅ initial value fix
    setVideoUrl(String(p.video_path ?? ""));
    setShortDescription(String(p.short_description ?? ""));
    setLongDescription(String(p.long_description ?? ""));

    setStatus(Boolean(p.status));
    setFeatured(Boolean(p.featured));
    setFreeDelivery(Boolean(p.free_delivery ?? false));
    setBestDeal(Boolean(p.best_deal));

    setMetaTitle(String(p.meta_title ?? ""));
    setMetaDescription(String(p.meta_description ?? ""));
    setMetaKeywords(String(p.meta_keywords ?? ""));
    setCanonicalUrl(String(p.canonical_url ?? ""));
    setOgTitle(String(p.og_title ?? ""));
    setOgDescription(String(p.og_description ?? ""));
    setRobots(normalizeRobots(String(p.robots ?? "index, follow")));

    setExistingImages(Array.isArray(p.images) ? p.images : []);
    setDeleteImageIds([]);
    setNewImages([]);

    const vars: VariationRow[] = (Array.isArray(p.variations) ? p.variations : [])
      .map((variation) => ({
        ...variation,
        color_id: variation.color?.id,
        variant_id: variation.variant?.id,
        free_delivery: readNullableBool(variation, "free_delivery"),
      }));
    setVariations(vars);
    // Auto-populate varEdit so all rows are always in edit mode
    const autoEdit: InlineEditState = {};
    for (const vr of vars) {
      const skuFd = vr.free_delivery;
      autoEdit[vr.id] = {
        color_id: getVariationColorId(vr),
        variant_id: getVariationVariantId(vr),
        buying_price: vr.buying_price,
        selling_price: vr.selling_price,
        discount: vr.discount,
        stock: vr.stock,
        sku: vr.sku ?? "",
        weight_kg: Number(vr.weight_kg ?? 0),
        free_delivery: skuFd === null || skuFd === undefined ? null : Boolean(skuFd),
      };
    }
    setVarEdit(autoEdit);

    setAddDraft(EMPTY_VARIATION_DRAFT);
  }, [enabled, productQuery.data]);

  // newImages is managed by ImageMultiUploader (includes cropper)

  // dropdown options
  const mainOptions: Option[] = React.useMemo(
    () =>
      mains.map((c) => ({
        value: String(c.id),
        label: String(c.name),
        status: c.status !== false,
      })),
    [mains],
  );

  const availableSubs = React.useMemo(() => {
    if (!mainCategoryId) return subs;
    return subs.filter(
      (s) => Number(s.main_category_id) === Number(mainCategoryId),
    );
  }, [subs, mainCategoryId]);

  const subOptions: Option[] = React.useMemo(
    () =>
      availableSubs.map((c) => ({
        value: String(c.id),
        label: String(c.name),
        status: c.status !== false,
      })),
    [availableSubs],
  );

  const availableChild = React.useMemo(() => {
    if (!subCategoryId) return childs;
    return childs.filter(
      (c) => Number(c.sub_category_id) === Number(subCategoryId),
    );
  }, [childs, subCategoryId]);

  const childOptions: Option[] = React.useMemo(
    () => [
      { value: "", label: t("products.editProduct.selectChildCategory") },
      ...availableChild.map((c) => ({
        value: String(c.id),
        label: String(c.name),
        status: c.status !== false,
      })),
    ],
    [availableChild],
  );

  const attributeOptions: Option[] = React.useMemo(() => {
    return attrsRaw.map((a) => ({
      value: String(a.id),
      label: String(a.name ?? `#${a.id}`),
    }));
  }, [attrsRaw]);

  const brandOptions: Option[] = React.useMemo(
    () => [
      { value: "", label: t("products.editProduct.selectBrand") },
      ...brandsRaw.map((b) => ({
        value: String(b.id),
        label: String(b.name ?? `#${b.id}`),
      })),
    ],
    [brandsRaw],
  );

  const colorOptions: Option[] = React.useMemo(() => {
    return colorsRaw.map((c) => ({
      value: String(c.id),
      label: String(c.name ?? `#${c.id}`),
    }));
  }, [colorsRaw]);

  const variantOptionsFromAttr = React.useMemo(() => {
    if (!attributeId) return [];
    return buildVariantOptionsForAttribute(attributeId, attrsRaw);
  }, [attributeId, attrsRaw]);

  const variantLabelById = React.useMemo(() => {
    return new Map(
      variantOptionsFromAttr.map((v) => [Number(v.value), String(v.label)]),
    );
  }, [variantOptionsFromAttr]);

  // keep sub/child valid
  React.useEffect(() => {
    if (!enabled) return;

    if (!availableSubs.length) {
      setSubCategoryId(0);
      return;
    }
    if (
      !availableSubs.some((s) => Number(s.id) === Number(subCategoryId))
    ) {
      setSubCategoryId(Number(availableSubs[0].id));
    }
  }, [enabled, availableSubs, subCategoryId]);

  React.useEffect(() => {
    if (!enabled) return;

    if (!availableChild.length) {
      setChildCategoryId(0);
      return;
    }
    // ✅ child category is optional
    // - keep 0 as "not selected"
    // - if an invalid child id exists, reset to 0 (do not auto-pick the first)
    if (!childCategoryId) return;

    if (
      !availableChild.some((c) => Number(c.id) === Number(childCategoryId))
    ) {
      setChildCategoryId(0);
    }
  }, [enabled, availableChild, childCategoryId]);

  // ----------------------------
  // Product update mutation
  // ----------------------------
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error(t("products.editProduct.failedLoad"));

      // 1. Update the product itself
      const productRes = await updateProduct(productId, {
        product_images: newImages.map((i) => i.file),
        name,
        name_bd: nameBd.trim() || undefined,
        slug,

        main_category_id: normalizeId(mainCategoryId),
        sub_category_id: normalizeId(subCategoryId),
        child_category_id: normalizeId(childCategoryId),

        brand_id: normalizeId(brandId),
        attribute_id: normalizeId(attributeId),

        video_path: videoUrl,
        short_description: shortDescription,
        long_description: longDescription,

        status,
        featured,
        free_delivery: freeDelivery,
        best_deal: bestDeal,

        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        canonical_url: canonicalUrl,
        og_title: ogTitle,
        og_description: ogDescription,
        robots,

        delete_image_ids: deleteImageIds.length ? deleteImageIds : undefined,
      });

      // 2. Save all modified variations
      const varPromises: Promise<unknown>[] = [];
      for (const v of variations) {
        const draft = varEdit[v.id];
        if (!draft) continue;
        const skuFd = v.free_delivery;
        const origFd = skuFd === null || skuFd === undefined ? null : Boolean(skuFd);
        const changed =
          draft.color_id !== getVariationColorId(v) ||
          draft.variant_id !== getVariationVariantId(v) ||
          draft.buying_price !== v.buying_price ||
          draft.selling_price !== v.selling_price ||
          draft.discount !== v.discount ||
          draft.stock !== v.stock ||
          draft.sku !== (v.sku ?? "") ||
          draft.weight_kg !== Number(v.weight_kg ?? 0) ||
          draft.free_delivery !== origFd;
        if (changed) {
          varPromises.push(updateVariation(v.id, draft));
        }
      }
      if (varPromises.length) await Promise.all(varPromises);

      return productRes;
    },
    onSuccess: async (res: UpdateProductResponseLike) => {
      if (
        res?.error ||
        (Number(res?.flag) >= 400 && Number.isFinite(Number(res?.flag)))
      ) {
        const msg =
          (typeof res?.error === "string" && res.error.trim()) ||
          (typeof res?.message === "string" && res.message.trim()) ||
          "Failed to update product";
        toast.error(msg);
        return;
      }

      toast.success(t("products.editProduct.productUpdated"));
      onUpdated?.();
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, t("products.editProduct.failedUpdate")));
    },
  });

  // ----------------------------
  // Variations API helpers
  // ----------------------------
  const createVariation = async (payload: VariationDraft) => {
    if (!productId) throw new Error(t("products.editProduct.failedLoad"));

    const body = {
      product_id: productId,
      color_id: payload.color_id,
      variant_id: payload.variant_id,
      buying_price: payload.buying_price,
      selling_price: payload.selling_price,
      discount: payload.discount,
      stock: payload.stock,
      sku: payload.sku,
      weight_kg: payload.weight_kg ?? 0,
      free_delivery: payload.free_delivery !== undefined ? payload.free_delivery : null,
    };

    const res = await api.post("/product/variation", body);
    return res.data;
  };

  const updateVariation = async (id: number, payload: VariationDraft) => {
    if (!productId) throw new Error(t("products.editProduct.failedLoad"));

    const body = {
      product_id: productId,
      color_id: payload.color_id,
      variant_id: payload.variant_id,
      buying_price: payload.buying_price,
      selling_price: payload.selling_price,
      discount: payload.discount,
      stock: payload.stock,
      sku: payload.sku,
      weight_kg: payload.weight_kg ?? 0,
      free_delivery: payload.free_delivery !== undefined ? payload.free_delivery : null,
    };

    const res = await api.put(`/product/variation/${id}`, body);
    return res.data;
  };

  const deleteVariation = async (id: number) => {
    const res = await api.delete(`/product/variation/${id}`);
    return res.data;
  };

  const createVarMutation = useMutation({
    mutationFn: (payload: VariationDraft) => createVariation(payload),
    onSuccess: async () => {
      toast.success(t("products.editProduct.variationAdded"));
      await productQuery.refetch();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, t("products.editProduct.failedAddVariation")));
    },
  });

  const updateVarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VariationDraft }) =>
      updateVariation(id, payload),
    onSuccess: async () => {
      toast.success(t("products.editProduct.variationUpdated"));
      setVarEdit({});
      await productQuery.refetch();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, t("products.editProduct.failedUpdateVariation")));
    },
  });

  const deleteVarMutation = useMutation({
    mutationFn: (id: number) => deleteVariation(id),
    onSuccess: async () => {
      toast.success(t("products.editProduct.variationDeleted"));
      setVarDeleteOpen(false);
      setVarDeleteId(null);
      await productQuery.refetch();
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, t("products.editProduct.failedDeleteVariation")));
    },
  });

  // ----------------------------
  // Variation UI helpers
  // ----------------------------
  const startEditVariation = (v: VariationRow) => {
    const skuFd = v.free_delivery;
    setVarEdit((p) => ({
      ...p,
      [v.id]: {
        color_id: getVariationColorId(v),
        variant_id: getVariationVariantId(v),
        buying_price: v.buying_price,
        selling_price: v.selling_price,
        discount: v.discount,
        stock: v.stock,
        sku: v.sku ?? "",
        weight_kg: Number(v.weight_kg ?? 0),
        free_delivery: skuFd === null || skuFd === undefined ? null : Boolean(skuFd),
      },
    }));
  };

  const cancelEditVariation = (id: number) => {
    setVarEdit((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  };

  const patchEditVariation = (id: number, patch: Partial<VariationDraft>) => {
    setVarEdit((p) => ({
      ...p,
      [id]: { ...(p[id] ?? EMPTY_VARIATION_DRAFT), ...patch },
    }));
  };

  const toggleDeleteImage = (imgId: number) => {
    setDeleteImageIds((prev) => {
      if (prev.includes(imgId)) return prev.filter((x) => x !== imgId);
      return [...prev, imgId];
    });
  };

  // addNewFiles removed — ImageMultiUploader manages new images with built-in cropper

  const isBusy =
    productQuery.isFetching ||
    updateMutation.isPending ||
    createVarMutation.isPending ||
    updateVarMutation.isPending ||
    deleteVarMutation.isPending;

  const deleteVariationMessage = React.useMemo(() => {
    if (varDeleteId === null) return undefined;

    const target = variations.find((v) => v.id === varDeleteId);
    if (!target) return t("products.editProduct.deleteVarConfirm");

    const colorLabel =
      target.color?.name ??
      colorNameById.get(getVariationColorId(target)) ??
      `#${getVariationColorId(target)}`;
    const variantLabel =
      target.variant?.name ??
      variantLabelById.get(getVariationVariantId(target)) ??
      `#${getVariationVariantId(target)}`;

    return `"${colorLabel} / ${variantLabel}${
      target.sku ? ` • SKU: ${target.sku}` : ""
    }"`;
  }, [
    colorNameById,
    t,
    varDeleteId,
    variantLabelById,
    variations,
  ]);

  const handleReorderImages = React.useCallback(
    (newOrder: ExistingImage[]) => {
      setExistingImages(newOrder);
      if (productId) {
        reorderProductImages(productId, newOrder.map((i) => i.id)).catch(() =>
          toast.error("Failed to save image order")
        );
      }
    },
    [productId],
  );

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-gray-400 dark:text-gray-500">
        {isBusy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Processing…
          </span>
        ) : (
          <span>ID: {productId}</span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          className="h-10 px-5"
          onClick={() => {
            if (isBusy) return;
            onClose();
          }}
        >
          {t("products.editProduct.cancel")}
        </Button>

        <Button
          className="h-10 px-6"
          startIcon={<Save size={15} />}
          onClick={() => updateMutation.mutate()}
          disabled={
            isBusy ||
            !name.trim() ||
            !slug.trim() ||
            !mainCategoryId ||
            !subCategoryId
          }
        >
          {updateMutation.isPending ? t("products.editProduct.saving") : t("products.editProduct.saveChanges")}
        </Button>
      </div>
    </div>
  );

  // initial loading for lookups + product
  const initialLoading =
    productQuery.isLoading ||
    (!productQuery.data &&
      (mainFetching ||
        subFetching ||
        childFetching ||
        colorsFetching ||
        attrsFetching ||
        brandsFetching));

  return (
    <>
      <BaseModal
        open={open}
        onClose={() => {
          if (isBusy) return;
          onClose();
        }}
        title={t("products.editProduct.modalTitle")}
        description={t("products.editProduct.modalDesc")}
        widthClassName="w-[1100px]"
        footer={footer}
      >
        {initialLoading ? (
          <div className="space-y-3">
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          </div>
        ) : productQuery.isError ? (
          <div className="py-14 text-center text-sm text-error-600">
            {t("products.editProduct.failedLoad")}
          </div>
        ) : (
          <div className="space-y-7">
            {/* ─── Basic Info ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Package size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.basicInfo")}</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  ID: {productId}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t("products.editProduct.nameLabel")} <span className="text-error-500">*</span>
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("products.editProduct.productNamePh")} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    বাংলা নাম <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span>
                  </label>
                  <Input
                    value={nameBd}
                    onChange={(e) => setNameBd(e.target.value)}
                    placeholder="পণ্যের বাংলা নাম লিখুন"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t("products.editProduct.slugLabel")} <span className="text-error-500">*</span>
                  </label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t("products.editProduct.productSlugPh")} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.categoryLabel")}</label>
                  <Select
                    key={`main-${mainCategoryId}`}
                    options={mainOptions}
                    placeholder={t("products.editProduct.selectCategory")}
                    defaultValue={mainCategoryId ? String(mainCategoryId) : ""}
                    onChange={(v) => {
                      setMainCategoryId(Number(v));
                      setSubCategoryId(0);
                      setChildCategoryId(0);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.subCategoryLabel")}</label>
                  <Select
                    key={`sub-${mainCategoryId}-${subCategoryId}`}
                    options={subOptions}
                    placeholder={t("products.editProduct.selectSubCategory")}
                    defaultValue={subCategoryId ? String(subCategoryId) : ""}
                    onChange={(v) => {
                      setSubCategoryId(Number(v));
                      setChildCategoryId(0);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.childCategoryLabel")}</label>
                  <Select
                    key={`child-${subCategoryId}-${childCategoryId}`}
                    options={childOptions}
                    placeholder={t("products.editProduct.selectChildCategory")}
                    defaultValue={childCategoryId ? String(childCategoryId) : ""}
                    onChange={(v) => setChildCategoryId(v ? Number(v) : 0)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.brandLabel")}</label>
                  <Select
                    key={`brand-${brandId}`}
                    options={brandOptions}
                    placeholder={t("products.editProduct.selectBrand")}
                    defaultValue={brandId ? String(brandId) : ""}
                    onChange={(v) => setBrandId(v ? Number(v) : 0)}
                  />
                </div>
              </div>
            </div>

            {/* ─── Media ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ImageIcon size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.mediaTitle")}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("products.editProduct.mediaDesc")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                    {existingImages.length} {t("products.editProduct.existingBadge")}
                  </span>
                  {deleteImageIds.length > 0 && (
                    <span className="rounded-md bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-600 dark:bg-error-500/10 dark:text-error-400">
                      {deleteImageIds.length} {t("products.editProduct.toDeleteBadge")}
                    </span>
                  )}
                  {newImages.length > 0 && (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      {newImages.length} {t("products.editProduct.newBadge")}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-5 p-5">
                {/* Video URL */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <Video size={13} /> {t("products.editProduct.videoUrlLabel")}
                  </label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={t("products.editProduct.videoUrlPh")}
                  />
                </div>

                {/* Existing Images */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <ImageIcon size={13} /> {t("products.editProduct.existingImages")}
                  </label>

                  {existingImages.length ? (
                    <DndProvider backend={HTML5Backend}>
                      <DraggableImageGrid
                        images={existingImages}
                        deleteImageIds={deleteImageIds}
                        onReorder={handleReorderImages}
                        onToggleDelete={toggleDeleteImage}
                        productSkus={variations
                          .map((v) => {
                            const colorId = getVariationColorId(v);
                            const variantId = getVariationVariantId(v);
                            if (!colorId && !variantId) return null; // completely empty row, skip
                            return {
                              id: v.id,
                              color_id: colorId,
                              color_name: v.color?.name || `Color #${colorId}`,
                              color_hex: v.color?.hex || "",
                              variant_id: variantId,
                              variant_name: v.variant?.name || (variantId ? `Size #${variantId}` : "—"),
                            };
                          })
                          .filter((s): s is NonNullable<typeof s> => s !== null)}
                        onSkuAssign={async (imageId, sku_id) => {
                          try {
                            await assignImageSku(imageId, sku_id);
                            const matchedSku = variations.find((v) => v.id === sku_id);
                            setExistingImages((prev) =>
                              prev.map((img) =>
                                img.id === imageId
                                  ? {
                                    ...img,
                                    sku_id,
                                    sku_color_id: matchedSku?.color?.id ?? null,
                                    sku_variant_id: matchedSku?.variant?.id ?? null,
                                  }
                                  : img
                              )
                            );
                          } catch (e) {
                            console.error("Failed to assign SKU to image:", e);
                          }
                        }}
                      />
                    </DndProvider>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{t("products.editProduct.noExistingImages")}</p>
                  )}
                </div>

                {/* New Images (with cropper) */}
                <ImageMultiUploader
                  label={t("products.editProduct.uploadNewImages")}
                  images={newImages}
                  onChange={setNewImages}
                  max={10}
                  helperText={t("products.editProduct.uploadCropHint")}
                />
              </div>
            </div>

            {/* ─── Flags ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ToggleLeft size={16} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.productFlags")}</h3>
              </div>
              <div className="grid grid-cols-1 gap-px bg-gray-100 dark:bg-gray-800 sm:grid-cols-4">
                {[
                  { label: t("products.editProduct.flagStatus"), desc: t("products.editProduct.flagStatusDesc"), icon: ToggleLeft, value: status, onChange: setStatus },
                  { label: t("products.editProduct.flagFeatured"), desc: t("products.editProduct.flagFeaturedDesc"), icon: Star, value: featured, onChange: setFeatured },
                  { label: t("products.editProduct.flagFreeDelivery"), desc: t("products.editProduct.flagFreeDeliveryDesc"), icon: Truck, value: freeDelivery, onChange: setFreeDelivery },
                  { label: t("products.editProduct.flagBestDeal"), desc: t("products.editProduct.flagBestDealDesc"), icon: Zap, value: bestDeal, onChange: setBestDeal },
                ].map((x) => (
                  <div key={x.label} className="flex items-center justify-between gap-3 bg-white px-5 py-4 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <x.icon size={15} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{x.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{x.desc}</p>
                      </div>
                    </div>
                    <Switch key={`${x.label}-${x.value}`} label="" defaultChecked={x.value} onChange={(checked) => x.onChange(checked)} />
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Descriptions ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.descriptionTitle")}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("products.editProduct.descriptionDesc")}</p>
                </div>
              </div>

              <div className="p-5">
                <RichTextEditor
                  label={t("products.editProduct.longDescLabel")}
                  value={longDescription}
                  onChange={setLongDescription}
                  heightClassName="min-h-[260px]"
                />
              </div>
            </div>

            {/* ─── Variations ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.variationsTitle")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("products.editProduct.variationsDesc")}</p>
                  </div>
                </div>

                <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                  <Layers size={12} /> {variations.length} {variations.length !== 1 ? t("products.editProduct.variationCount_other", { count: variations.length }) : t("products.editProduct.variationCount_one", { count: variations.length })}
                </span>
              </div>
              <div className="px-5 py-1 w-[50%]">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("products.editProduct.attributeLabel")}
                </p>
                <Select
                  key={`attr-${attributeId}`}
                  options={attributeOptions}
                  placeholder={t("products.editProduct.selectAttribute")}
                  defaultValue={attributeId ? String(attributeId) : ""}
                  onChange={(v) => setAttributeId(Number(v))}
                />
              </div>

              {/* Add row */}
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                  <div className="md:col-span-1">
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.colorLabel")}
                    </p>
                    <Select
                      key={`add-color-${addDraft.color_id}`}
                      options={colorOptions}
                      placeholder={t("products.editProduct.colorLabel")}
                      defaultValue={
                        addDraft.color_id ? String(addDraft.color_id) : ""
                      }
                      onChange={(v) =>
                        setAddDraft((p) => ({ ...p, color_id: Number(v) }))
                      }
                    />
                  </div>

                  <div className="md:col-span-1">
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.variantLabel")}
                    </p>

                    {variantOptionsFromAttr.length ? (
                      <Select
                        key={`add-variant-${attributeId}-${addDraft.variant_id}`}
                        options={variantOptionsFromAttr}
                        placeholder={t("products.editProduct.variantLabel")}
                        defaultValue={
                          addDraft.variant_id ? String(addDraft.variant_id) : ""
                        }
                        onChange={(v) =>
                          setAddDraft((p) => ({ ...p, variant_id: Number(v) }))
                        }
                      />
                    ) : (
                      <Input
                        type="number"
                        value={addDraft.variant_id}
                        onChange={(e) =>
                          setAddDraft((p) => ({
                            ...p,
                            variant_id: safeNumber(
                              e.target.value,
                              p.variant_id,
                            ),
                          }))
                        }
                        placeholder="variant_id"
                      />
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.buyLabel")}
                    </p>
                    <NumericInput
                      value={addDraft.buying_price}
                      onValueChange={(n) =>
                        setAddDraft((p) => ({ ...p, buying_price: n }))
                      }
                      min={0}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.sellLabel")}
                    </p>
                    <NumericInput
                      value={addDraft.selling_price}
                      onValueChange={(n) =>
                        setAddDraft((p) => ({ ...p, selling_price: n }))
                      }
                      min={0}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.discountLabel")}
                    </p>
                    <NumericInput
                      value={addDraft.discount}
                      onValueChange={(n) =>
                        setAddDraft((p) => ({ ...p, discount: n }))
                      }
                      min={0}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.stockLabel")}
                    </p>
                    <NumericInput
                      value={addDraft.stock}
                      onValueChange={(n) =>
                        setAddDraft((p) => ({ ...p, stock: Math.max(0, n) }))
                      }
                      min={0}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Wt (kg)
                    </p>
                    <NumericInput
                      value={addDraft.weight_kg}
                      onValueChange={(n) =>
                        setAddDraft((p) => ({ ...p, weight_kg: Math.max(0, n) }))
                      }
                      min={0}
                      step={0.001}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <p className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("products.editProduct.skuLabel")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={addDraft.sku}
                        onChange={(e) =>
                          setAddDraft((p) => ({
                            ...p,
                            sku: String(e.target.value).slice(0, SKU_MAX_LENGTH),
                          }))
                        }
                        wrapperClassName="min-w-[220px]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const productBase =
                            name.trim() ||
                            brandNameById.get(brandId) ||
                            "PRODUCT";
                          const colorName =
                            colorNameById.get(addDraft.color_id) ??
                            `C${addDraft.color_id}`;
                          const variantName =
                            variantLabelById.get(addDraft.variant_id) ??
                            `V${addDraft.variant_id}`;
                          setAddDraft((p) => ({
                            ...p,
                            sku: buildSku({
                              productBase,
                              colorName,
                              variantName,
                            }),
                          }));
                        }}
                      >
                        {t("products.editProduct.generate")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-2 md:col-span-2">
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() =>
                        setAddDraft({
                          color_id: 0,
                          variant_id: 0,
                          buying_price: 0,
                          selling_price: 0,
                          discount: 0,
                          stock: 0,
                          sku: "",
                          weight_kg: 0,
                          free_delivery: null,
                        })
                      }
                    >
                      {t("products.editProduct.reset")}
                    </Button>

                    <Button
                      className="h-11"
                      startIcon={<Plus className="h-4 w-4" />}
                      onClick={() => {
                        if (!addDraft.color_id)
                          return toast.error(t("products.editProduct.selectColor"));
                        if (!addDraft.variant_id)
                          return toast.error(t("products.editProduct.setVariantId"));
                        if (addDraft.selling_price <= 0)
                          return toast.error(t("products.editProduct.sellingPriceRequired"));
                        createVarMutation.mutate(addDraft);
                      }}
                      disabled={createVarMutation.isPending}
                    >
                      {t("products.editProduct.addVariation")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px] border-collapse">
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                      {[
                        t("products.editProduct.thColor"),
                        t("products.editProduct.thVariant"),
                        t("products.editProduct.thBuying"),
                        t("products.editProduct.thSelling"),
                        t("products.editProduct.thDiscount"),
                        t("products.editProduct.thStock"),
                        "Wt (kg)",
                        "Free Del.",
                        t("products.editProduct.thSku"),
                        t("products.editProduct.thAction"),
                      ].map((h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className={[
                            "px-4 py-4 text-left text-xs font-semibold text-brand-500",
                            h === t("products.editProduct.thAction")
                              ? "sticky right-0 z-10 bg-gray-50 dark:bg-gray-950"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {variations.length ? (
                      variations.map((v) => {
                        const draft = varEdit[v.id];
                        const colorId = getVariationColorId(v);
                        const variantId = getVariationVariantId(v);
                        const variantLabel = v.variant?.name ?? `#${variantId}`;

                        return (
                          <TableRow
                            key={v.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <TableCell className="px-4 py-2">
                              <Select
                                key={`edit-color-${v.id}-${draft?.color_id}`}
                                options={colorOptions}
                                placeholder={t("products.editProduct.colorLabel")}
                                defaultValue={String(draft?.color_id ?? colorId)}
                                onChange={(val) =>
                                  patchEditVariation(v.id, { color_id: Number(val) })
                                }
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              {variantOptionsFromAttr.length ? (
                                <Select
                                  key={`edit-variant-${v.id}-${draft?.variant_id}-${attributeId}`}
                                  options={variantOptionsFromAttr}
                                  placeholder={t("products.editProduct.variantLabel")}
                                  defaultValue={String(draft?.variant_id ?? variantId)}
                                  onChange={(val) =>
                                    patchEditVariation(v.id, { variant_id: Number(val) })
                                  }
                                />
                              ) : (
                                <Input
                                  type="number"
                                  value={draft?.variant_id ?? variantId}
                                  onChange={(e) =>
                                    patchEditVariation(v.id, {
                                      variant_id: safeNumber(e.target.value, variantId),
                                    })
                                  }
                                />
                              )}
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <NumericInput
                                value={draft?.buying_price ?? v.buying_price}
                                onValueChange={(n) =>
                                  patchEditVariation(v.id, { buying_price: n })
                                }
                                min={0}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <NumericInput
                                value={draft?.selling_price ?? v.selling_price}
                                onValueChange={(n) =>
                                  patchEditVariation(v.id, { selling_price: n })
                                }
                                min={0}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <NumericInput
                                value={draft?.discount ?? v.discount}
                                onValueChange={(n) =>
                                  patchEditVariation(v.id, { discount: n })
                                }
                                min={0}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <NumericInput
                                value={draft?.stock ?? v.stock}
                                onValueChange={(n) =>
                                  patchEditVariation(v.id, { stock: Math.max(0, n) })
                                }
                                min={0}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <NumericInput
                                value={draft?.weight_kg ?? Number(v.weight_kg ?? 0)}
                                onValueChange={(n) =>
                                  patchEditVariation(v.id, { weight_kg: Math.max(0, n) })
                                }
                                min={0}
                                step={0.001}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <select
                                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={draft?.free_delivery === null || draft?.free_delivery === undefined ? "inherit" : draft.free_delivery ? "true" : "false"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  patchEditVariation(v.id, {
                                    free_delivery: val === "inherit" ? null : val === "true",
                                  });
                                }}
                              >
                                <option value="inherit">🔗 Inherit</option>
                                <option value="true">🚚 Free</option>
                                <option value="false">💳 Paid</option>
                              </select>
                            </TableCell>

                            <TableCell className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={draft?.sku ?? v.sku ?? ""}
                                  onChange={(e) =>
                                    patchEditVariation(v.id, {
                                      sku: String(e.target.value).slice(0, SKU_MAX_LENGTH),
                                    })
                                  }
                                  wrapperClassName="min-w-[180px]"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const productBase = name.trim() || brandNameById.get(brandId) || "PRODUCT";
                                    const draftColorId = draft?.color_id ?? colorId;
                                    const draftVariantId = draft?.variant_id ?? variantId;
                                    const colorName = colorNameById.get(draftColorId) ?? `C${draftColorId}`;
                                    const variantName = variantLabelById.get(draftVariantId) ?? variantLabel;
                                    patchEditVariation(v.id, {
                                      sku: buildSku({ productBase, colorName, variantName }),
                                    });
                                  }}
                                >
                                  {t("products.editProduct.generate")}
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-2 sticky right-0 z-10 bg-white dark:bg-gray-900">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 border-error-200 text-error-500 hover:text-error-600 dark:border-error-500/30"
                                ariaLabel="Delete variation"
                                onClick={() => {
                                  setVarDeleteId(v.id);
                                  setVarDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          {t("products.editProduct.noVariations")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-gray-200 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {t("products.editProduct.variantTip")}
              </div>
            </div>

            {/* ─── SEO ─── */}
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("products.editProduct.seoTitle")}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("products.editProduct.seoDesc")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.metaTitle")}</label>
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.canonicalUrl")}</label>
                  <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.metaDescription")}</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-800 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.metaKeywords")}</label>
                  <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.ogTitle")}</label>
                  <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.robots")}</label>
                  <Input value={robots} onChange={(e) => setRobots(e.target.value)} placeholder="index, follow" />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("products.editProduct.ogDescription")}</label>
                  <textarea
                    className="min-h-[70px] w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-800 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* Variation Delete Confirm */}
      <ConfirmModal
        open={varDeleteOpen}
        onClose={() => {
          if (deleteVarMutation.isPending) return;
          setVarDeleteOpen(false);
          setVarDeleteId(null);
        }}
        onConfirm={() => {
          if (varDeleteId === null) return;
          deleteVarMutation.mutate(varDeleteId);
        }}
        loading={deleteVarMutation.isPending}
        title={t("products.editProduct.deleteVarTitle")}
        subtitle={t("products.editProduct.deleteVarDesc")}
        message={deleteVariationMessage}
        consequenceLines={[
          t("products.editProduct.deleteVarEffects.variationRemoved"),
          t("products.editProduct.deleteVarEffects.skuStockRemoved"),
          t("products.editProduct.deleteVarEffects.cannotRecover"),
        ]}
        confirmLabel={t("products.editProduct.delete")}
        cancelLabel={t("products.editProduct.cancel")}
        zIndexClassName="z-[10020]"
      />
    </>
  );
}
