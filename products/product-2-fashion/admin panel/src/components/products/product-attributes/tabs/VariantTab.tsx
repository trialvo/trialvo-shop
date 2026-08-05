import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, RefreshCw, Search, Trash2, Wand2 } from "lucide-react";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";

import type {
  AttributeDefinition,
  BrandRow,
  ColorRow,
  Option,
  ProductAttributeSelection,
  ProductLite,
  ProductVariantRow,
} from "../types";
import { cartesian, makeSkuBase, safeNumber } from "../utils";

type Props = {
  products: ProductLite[];
  brands: BrandRow[];
  colors: ColorRow[];
  attributeDefs: AttributeDefinition[];

  productAttributeMap: Record<number, ProductAttributeSelection>;
  onChangeProductAttributeMap: (
    next: Record<number, ProductAttributeSelection>
  ) => void;

  productBrandMap: Record<number, number>;
  onChangeProductBrandMap: (next: Record<number, number>) => void;

  productColorMap: Record<number, number[]>;
  onChangeProductColorMap: (next: Record<number, number[]>) => void;

  variants: ProductVariantRow[];
  onChangeVariants: (next: ProductVariantRow[]) => void;
};

const PRICE_DEFAULT = 0;
const STOCK_DEFAULT = 0;

export default function VariantTab({
  products,
  brands,
  colors,
  attributeDefs,
  productAttributeMap,
  onChangeProductAttributeMap,
  productBrandMap,
  onChangeProductBrandMap,
  productColorMap,
  onChangeProductColorMap,
  variants,
  onChangeVariants,
}: Props) {
  const { t } = useTranslation();
  const productOptions: Option[] = useMemo(
    () => products.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` })),
    [products]
  );

  const brandOptions: Option[] = useMemo(() => {
    const active = brands.filter((b) => b.status);
    return active.map((b) => ({ value: String(b.id), label: b.name }));
  }, [brands]);

  const [activeProductId, setActiveProductId] = useState<number>(
    products[0]?.id ?? 0
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>("");

  const product = useMemo(
    () => products.find((p) => p.id === activeProductId) ?? null,
    [products, activeProductId]
  );

  const selectedBrandId = productBrandMap[activeProductId] ?? brands[0]?.id ?? 1;
  const selectedBrand =
    brands.find((b) => b.id === selectedBrandId)?.name ?? "No Brand";

  const selectedColorIds = productColorMap[activeProductId] ?? [];
  const selectedColors = useMemo(
    () => colors.filter((c) => selectedColorIds.includes(c.id) && c.status),
    [colors, selectedColorIds]
  );

  const selectedAttrs: ProductAttributeSelection =
    productAttributeMap[activeProductId] ?? {};

  const setSelectedForAttr = (attrId: number, values: string[]) => {
    onChangeProductAttributeMap({
      ...productAttributeMap,
      [activeProductId]: { ...selectedAttrs, [attrId]: values },
    });
  };

  const toggleAttrValue = (attrId: number, value: string) => {
    const prev = selectedAttrs[attrId] ?? [];
    const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    setSelectedForAttr(attrId, next);
  };

  const clearSelections = () => {
    onChangeProductAttributeMap({ ...productAttributeMap, [activeProductId]: {} });
    onChangeProductColorMap({ ...productColorMap, [activeProductId]: [] });
    onChangeProductBrandMap({
      ...productBrandMap,
      [activeProductId]: brands[0]?.id ?? 1,
    });
    setError("");
  };

  const toggleColor = (colorId: number) => {
    const prev = selectedColorIds;
    const next = prev.includes(colorId)
      ? prev.filter((id) => id !== colorId)
      : [...prev, colorId];

    onChangeProductColorMap({ ...productColorMap, [activeProductId]: next });
  };

  const requiredMissing = useMemo(() => {
    return attributeDefs
      .filter((a) => a.required)
      .filter((a) => (selectedAttrs[a.id] ?? []).length === 0);
  }, [attributeDefs, selectedAttrs]);

  const previewCount = useMemo(() => {
    if (!product) return 0;

    const dims: string[][] = [];
    if (selectedColors.length > 0) dims.push(selectedColors.map((c) => c.name));

    attributeDefs.forEach((a) => {
      const vals = selectedAttrs[a.id] ?? [];
      if (vals.length > 0) dims.push(vals);
    });

    return cartesian(dims).length || 1;
  }, [product, selectedColors, attributeDefs, selectedAttrs]);

  const generateVariants = () => {
    if (!product) return;

    if (requiredMissing.length > 0) {
      setError(
        `${t("products.attributes.requiredMissing")} ${requiredMissing.map((x) => x.name).join(", ")}`
      );
      return;
    }

    setError("");

    const dims: { label: string; values: string[] }[] = [];

    if (selectedColors.length > 0) {
      dims.push({ label: "Color", values: selectedColors.map((c) => c.name) });
    }

    attributeDefs.forEach((a) => {
      const vals = selectedAttrs[a.id] ?? [];
      if (vals.length > 0) dims.push({ label: a.name, values: vals });
    });

    const combos = cartesian(dims.map((d) => d.values));

    const baseSku = makeSkuBase(product.sku);
    const existingSku = new Set(
      variants.filter((v) => v.productId === product.id).map((v) => v.sku)
    );

    const nextIdStart = Math.max(0, ...variants.map((v) => v.id)) + 1;
    let idCounter = nextIdStart;

    const nextVariants: ProductVariantRow[] = [];

    const ensureOne = combos.length > 0 ? combos : [[]];

    ensureOne.forEach((combo) => {
      const attrs: Record<string, string> = {
        Brand: selectedBrand,
      };

      combo.forEach((val, idx) => {
        const label = dims[idx]?.label ?? `Attr${idx + 1}`;
        attrs[label] = val;
      });

      const nameParts = Object.entries(attrs)
        .filter(([k]) => k !== "Brand")
        .map(([k, v]) => `${k}: ${v}`);

      const labelName = nameParts.length > 0 ? nameParts.join(" / ") : "Default";

      const skuParts = [
        baseSku,
        ...Object.entries(attrs)
          .filter(([k]) => k !== "Brand")
          .map(([, v]) => makeSkuBase(v)),
      ];
      const sku = skuParts.join("-");

      if (existingSku.has(sku)) return;

      nextVariants.push({
        id: idCounter++,
        productId: product.id,
        name: labelName,
        sku,
        price: PRICE_DEFAULT,
        stock: STOCK_DEFAULT,
        active: true,
        attributes: attrs,
      });
    });

    onChangeVariants([...nextVariants, ...variants]);
  };

  const productVariants = useMemo(() => {
    const list = variants.filter((v) => v.productId === activeProductId);

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q)
    );
  }, [variants, activeProductId, search]);

  const updateVariant = (id: number, patch: Partial<ProductVariantRow>) => {
    onChangeVariants(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVariant = (id: number) => {
    onChangeVariants(variants.filter((v) => v.id !== id));
  };

  const clearProductVariants = () => {
    onChangeVariants(variants.filter((v) => v.productId !== activeProductId));
  };

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("products.attributes.selectProduct")} <span className="text-error-500">*</span>
            </p>
            <Select
              options={productOptions}
              placeholder="Select product"
              defaultValue={String(activeProductId)}
              onChange={(v) => {
                setActiveProductId(Number(v));
                setError("");
                setSearch("");
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("products.attributes.brandForProduct")}
            </p>
            <Select
              key={`brand-${activeProductId}-${selectedBrandId}`}
              options={brandOptions}
              placeholder="Select brand"
              defaultValue={String(selectedBrandId)}
              onChange={(v) =>
                onChangeProductBrandMap({
                  ...productBrandMap,
                  [activeProductId]: Number(v),
                })
              }
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("products.attributes.previewVariants")}
            </span>
            <span className="inline-flex h-7 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {previewCount}
            </span>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={clearSelections} startIcon={<RefreshCw size={16} />}>
              {t("products.attributes.resetSelections")}
            </Button>
            <Button onClick={generateVariants} startIcon={<Wand2 size={16} />}>
              {t("products.attributes.generateVariants")}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        ) : null}
      </div>

      {/* Color + Attributes selections */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
        {/* Colors */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("products.attributes.colorsMultiSelect")}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("products.attributes.selected")} {selectedColors.length}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {colors
              .filter((c) => c.status)
              .map((c) => {
                const active = selectedColorIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleColor(c.id)}
                    className={[
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                      active
                        ? "border-brand-500 bg-brand-500/10 text-gray-900 dark:text-white"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300",
                    ].join(" ")}
                  >
                    <span
                      className="h-4 w-6 rounded-md border border-gray-200 dark:border-gray-800"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("products.attributes.attributesDynamic")}
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {attributeDefs
              .slice()
              .sort((a, b) => a.id - b.id)
              .map((a) => {
                const selected = selectedAttrs[a.id] ?? [];
                const missing = a.required && selected.length === 0;

                return (
                  <div
                    key={a.id}
                    className={[
                      "rounded-xl border p-4",
                      missing
                        ? "border-error-200 bg-error-50 dark:border-error-900/40 dark:bg-error-500/10"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {a.name}{" "}
                          {a.required ? (
                            <span className="ml-2 inline-flex rounded-md bg-error-500/10 px-2 py-0.5 text-xs font-semibold text-error-600 dark:text-error-300">
                              {t("products.attributes.required")}
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {t("products.attributes.optional")}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t("products.attributes.selectValues")}
                        </p>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t("products.attributes.selected")} {selected.length}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {a.values.length === 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t("products.attributes.noValuesDefined")}
                        </span>
                      ) : null}

                      {a.values.map((v) => {
                        const active = selected.includes(v);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => toggleAttrValue(a.id, v)}
                            className={[
                              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                              active
                                ? "border-brand-500 bg-brand-500/10 text-gray-900 dark:text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]",
                            ].join(" ")}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedForAttr(a.id, [])}
                      >
                        {t("products.attributes.clear")}
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedForAttr(a.id, a.values)}
                        disabled={a.values.length === 0}
                        className="text-brand-600 dark:text-brand-400"
                      >
                        {t("products.attributes.selectAll")}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Variants List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("products.attributes.variantList")}
            </h3>
            <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {productVariants.length}
            </span>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="relative w-full sm:w-[280px]">
              <Input
                startIcon={<Search size={16} className="text-gray-400" />}
                className="pl-9"
                placeholder="Search variant (name / sku)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              startIcon={<Download size={16} />}
              onClick={() => console.log("Export variants")}
            >
              {t("common.export")}
            </Button>

            <Button
              variant="outline"
              onClick={clearProductVariants}
              startIcon={<Trash2 size={16} />}
              disabled={variants.filter((v) => v.productId === activeProductId).length === 0}
            >
              {t("products.attributes.clearProductVariants")}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                {["Id", "Variant", "SKU", "Price", "Stock", "Active", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left text-xs font-semibold text-brand-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {productVariants.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {v.id}
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {v.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Object.entries(v.attributes)
                          .map(([k, val]) => `${k}: ${val}`)
                          .join(" • ")}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      type="number"
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(v.id, {
                          price: safeNumber(String(e.target.value), v.price),
                        })
                      }
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      type="number"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(v.id, {
                          stock: safeNumber(String(e.target.value), v.stock),
                        })
                      }
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Switch
                      key={`active-${v.id}-${v.active}`}
                      label=""
                      defaultChecked={v.active}
                      onChange={(checked) => updateVariant(v.id, { active: checked })}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeVariant(v.id)}
                      startIcon={<Trash2 size={14} />}
                    >
                      {t("common.delete")}
                    </Button>
                  </td>
                </tr>
              ))}

              {productVariants.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("products.attributes.noVariantsEmpty")}
                    <span className="mx-1 font-semibold">{t("products.attributes.generateVariants")}</span>.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
