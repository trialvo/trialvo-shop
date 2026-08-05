import { AttributeVariant } from "@/api/attributes.api";
import Section from "./Section";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import NumericInput from "@/components/form/input/NumericInput";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import { Check, Layers, Palette, Tag, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type Option = { value: string; label: string };

type VariantRow = {
  key: string;
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

const SKU_MAX_LENGTH = 21;
const SKU_PRODUCT_LENGTH = 5;
const SKU_COLOR_LENGTH = 5;
const SKU_SIZE_LENGTH = 4;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {children}
    </p>
  );
}


function cleanSkuPart(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function fixedPart(input: string, length: number) {
  const cleaned = cleanSkuPart(input).slice(0, length);
  return cleaned.padEnd(length, "X");
}

function buildSku({
  productSlug,
  colorName,
  variantName,
  colorId,
  variantId,
}: {
  productSlug: string;
  colorName?: string;
  variantName?: string;
  colorId: number;
  variantId: number;
}) {
  const productPart = fixedPart(productSlug || "PRODUCT", SKU_PRODUCT_LENGTH);
  const colorPart = fixedPart(colorName ?? `C${colorId}`, SKU_COLOR_LENGTH);
  const sizePart = fixedPart(variantName ?? `V${variantId}`, SKU_SIZE_LENGTH);
  const rand = Math.floor(1000 + Math.random() * 9000);
  const sku = `${productPart}-${colorPart}-${sizePart}-${String(rand)}`;
  return sku.slice(0, SKU_MAX_LENGTH);
}

function VariationsSection({
  colors,
  availableVariants,
  productSlug,

  attributeId,
  setAttributeId,
  attributeOptions,

  selectedColorIds,
  setSelectedColorIds,
  selectedColors,
  colorOptions,

  selectedVariantIds,
  toggleVariantId,

  grouped,
  matrix,
  updateRow,
}: {
  colors: any[];
  availableVariants: AttributeVariant[];
  productSlug: string;

  attributeId: number;
  setAttributeId: (n: number) => void;
  attributeOptions: Option[];

  selectedColorIds: number[];
  setSelectedColorIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedColors: any[];
  colorOptions: Option[];

  selectedVariantIds: number[];
  toggleVariantId: (id: number) => void;

  grouped: Array<{ colorId: number; rows: VariantRow[] }>;
  matrix: VariantRow[];
  updateRow: (key: string, patch: Partial<VariantRow>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section
      title={t("products.createProduct.variationsTitle")}
      description={t("products.createProduct.variationsDesc")}
      icon={<Layers className="h-5 w-5" />}
      headerRight={
        matrix.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            {matrix.filter((r) => r.active).length}
            <span className="font-normal text-brand-500">{t("common.active")}</span>
          </span>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ──────────────────── Colors Picker Card ──────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {t("products.createProduct.colorsLabel")} <span className="text-error-500">*</span>
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("products.createProduct.selectColors")}</p>
              </div>
            </div>
            {selectedColors.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                {selectedColors.length} {t("products.attributes.selected").toLowerCase()}
              </span>
            )}
          </div>

          {/* Card body */}
          <div className="p-5">
            <Select
              key={`color-dd-${selectedColorIds.join("-")}`}
              options={colorOptions}
              placeholder={
                colorOptions.length ? t("products.createProduct.selectColors") : t("common.allSelected")
              }
              defaultValue=""
              onChange={(v) => {
                const id = Number(v);
                if (!Number.isFinite(id)) return;
                if (selectedColorIds.includes(id)) return;
                setSelectedColorIds((p) => [...p, id]);
              }}
            />

            {selectedColors.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedColors.map((c: any) => (
                  <div
                    key={c.id}
                    className="group relative flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-gray-600"
                  >
                    {/* Color swatch with ring */}
                    <span className="relative flex-shrink-0">
                      <span
                        className="block h-8 w-8 rounded-full border-2 border-white shadow-md ring-2 ring-brand-500/40 dark:border-gray-900"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    </span>

                    {/* Color info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{c.hex ?? "—"}</p>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 opacity-0 shadow-sm transition-all hover:border-error-300 hover:bg-error-50 hover:text-error-500 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-error-500/40 dark:hover:bg-error-500/10"
                      onClick={() =>
                        setSelectedColorIds((p) =>
                          p.filter((x) => x !== Number(c.id)),
                        )
                      }
                      aria-label="Remove color"
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedColors.length === 0 && (
              <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6 dark:border-gray-700 dark:bg-white/[0.01]">
                <Palette className="mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-gray-400 dark:text-gray-500">{t("products.createProduct.selectColors")}</p>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────── Attribute & Variants Card ──────────────────── */}
        <div className="space-y-4">
          <div>
            <FieldLabel>{t("products.createProduct.attributeLabel")} *</FieldLabel>
            <Select
              options={attributeOptions}
              placeholder={t("products.createProduct.selectAttribute")}
              value={String(attributeId)}
              onChange={(v) => setAttributeId(Number(v))}
            />
            <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
              {t("products.createProduct.selectSizes")}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Tag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t("products.createProduct.sizesLabel")} <span className="text-error-500">*</span>
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("products.createProduct.selectSizes")}</p>
                </div>
              </div>
              {selectedVariantIds.length > 0 && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  {selectedVariantIds.length} / {availableVariants.length}
                </span>
              )}
            </div>

            {/* Card body */}
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {availableVariants.map((v) => {
                  const active = selectedVariantIds.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVariantId(v.id)}
                      className={cn(
                        "group relative inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-200",
                        active
                          ? "border-brand-400 bg-gradient-to-b from-brand-50 to-brand-100/50 text-brand-700 shadow-sm ring-1 ring-brand-300/30 dark:border-brand-500/60 dark:from-brand-500/15 dark:to-brand-500/5 dark:text-brand-400 dark:ring-brand-500/20"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300",
                      )}
                    >
                      {/* Checkbox circle */}
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                          active
                            ? "border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-500"
                            : "border-gray-300 bg-white group-hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700",
                        )}
                      >
                        {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      {v.name}
                    </button>
                  );
                })}

                {!availableVariants.length ? (
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {t("products.createProduct.noVariantsAvailable")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variation Matrix Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {t("products.createProduct.variantMatrix")}
            {matrix.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {matrix.length} total rows
              </span>
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/50">
                {[
                  "Color",
                  "Variant",
                  "Buying",
                  "Selling",
                  "Discount",
                  "Stock",
                  "Wt (kg)",
                  "Free Del.",
                  "SKU",
                  "Active",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!grouped.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500"
                  >
                    {t("products.createProduct.variantMatrixEmpty")}
                  </td>
                </tr>
              ) : (
                grouped.flatMap((g) => {
                  const color = colors.find(
                    (c: any) => Number(c.id) === Number(g.colorId),
                  );
                  return g.rows.map((r, idx) => {
                    const variantName =
                      availableVariants.find((v) => v.id === r.variantId)
                        ?.name ?? `#${r.variantId}`;

                    return (
                      <tr
                        key={r.key}
                        className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.01]"
                      >
                        {idx === 0 ? (
                          <td
                            rowSpan={g.rows.length}
                            className="px-4 py-3 align-middle"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="h-5 w-7 rounded-md border border-gray-200/80 shadow-sm dark:border-gray-700"
                                style={{
                                  backgroundColor: color?.hex ?? "#111827",
                                }}
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {color?.name ?? "Unknown"}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {g.rows.length} variant{g.rows.length > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                        ) : null}

                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {variantName}
                        </td>

                        <td className="px-4 py-2">
                          <NumericInput
                            value={r.buyingPrice}
                            onValueChange={(n) => updateRow(r.key, { buyingPrice: n })}
                            min={0}
                          />
                        </td>

                        <td className="px-4 py-2">
                          <NumericInput
                            value={r.sellingPrice}
                            onValueChange={(n) => updateRow(r.key, { sellingPrice: n })}
                            min={0}
                          />
                        </td>

                        <td className="px-4 py-2">
                          <NumericInput
                            value={r.discount}
                            onValueChange={(n) => updateRow(r.key, { discount: n })}
                            min={0}
                          />
                        </td>

                        <td className="px-4 py-2">
                          <NumericInput
                            value={r.stock}
                            onValueChange={(n) => updateRow(r.key, { stock: Math.max(0, n) })}
                            min={0}
                          />
                        </td>

                        <td className="px-4 py-2">
                          <NumericInput
                            value={r.weightKg ?? 0}
                            onValueChange={(n) => updateRow(r.key, { weightKg: Math.max(0, n) })}
                            min={0}
                            step={0.001}
                          />
                        </td>

                        <td className="px-4 py-2">
                          <select
                            value={r.freeDelivery === null ? "inherit" : r.freeDelivery ? "free" : "paid"}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateRow(r.key, {
                                freeDelivery: v === "inherit" ? null : v === "free",
                              });
                            }}
                            className="w-[110px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          >
                            <option value="inherit">🔗 Inherit</option>
                            <option value="free">🚚 Free</option>
                            <option value="paid">💳 Paid</option>
                          </select>
                        </td>

                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={r.sku}
                              onChange={(e) =>
                                updateRow(r.key, {
                                  sku: String(e.target.value).slice(
                                    0,
                                    SKU_MAX_LENGTH,
                                  ),
                                })
                              }
                              wrapperClassName="min-w-[180px]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              onClick={() =>
                                updateRow(r.key, {
                                  sku: buildSku({
                                    productSlug,
                                    colorName: color?.name,
                                    variantName,
                                    colorId: r.colorId,
                                    variantId: r.variantId,
                                  }),
                                })
                              }
                            >
                              {t("products.createProduct.generateSkus")}
                            </Button>
                          </div>
                        </td>

                        <td className="px-4 py-2">
                          <Switch
                            key={`row-${r.key}-${r.active}`}
                            label=""
                            defaultChecked={r.active}
                            onChange={(checked) =>
                              updateRow(r.key, { active: checked })
                            }
                          />
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

export default VariationsSection;
