"use client";

import * as React from "react";
import { FiX, FiChevronDown } from "react-icons/fi";
import type { MainCategory, SubCategory, ChildCategory } from "@/lib/api/category/service";

/* ── Compact select with chevron ─────────────────────────── */
function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-full appearance-none rounded-lg border border-black/8 bg-white pl-3 pr-8 text-xs font-medium text-black outline-none transition-colors focus:border-[#191919] disabled:cursor-not-allowed disabled:bg-[#FAF8F5] disabled:text-gray-300"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FiChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

export interface AllocationRowData {
  id: string;
  mainCategoryId: string;
  subCategoryId: string;
  childCategoryId: string;
  qty: number;
}

interface CategoryAllocationRowProps {
  data: AllocationRowData;
  categories: MainCategory[];
  onChange: (updated: AllocationRowData) => void;
  onRemove: () => void;
  index: number;
}

/**
 * Check if a child category has products (total_stock > 0).
 */
function hasStock(c: ChildCategory): boolean {
  return (c.total_stock ?? 0) > 0;
}

export default function CategoryAllocationRow({
  data,
  categories,
  onChange,
  onRemove,
  index,
}: CategoryAllocationRowProps) {
  // ── Filter categories: only show ones that have products ──

  // A sub-category is shown only if it has at least one child with stock
  const filterSub = (s: SubCategory) =>
    (s.child_categories ?? []).some(hasStock);

  // A main-category is shown only if it has at least one qualifying sub
  const filterMain = (m: MainCategory) =>
    (m.sub_categories ?? []).some(filterSub);

  const mainOptions = categories
    .filter(filterMain)
    .map((c) => ({ value: String(c.id), label: c.name }));

  const selectedMain = categories.find((c) => String(c.id) === data.mainCategoryId);
  const subOptions: { value: string; label: string }[] = (selectedMain?.sub_categories ?? [])
    .filter(filterSub)
    .map((s: SubCategory) => ({ value: String(s.id), label: s.name }));

  const selectedSub = selectedMain?.sub_categories?.find(
    (s: SubCategory) => String(s.id) === data.subCategoryId,
  );
  const childOptions: { value: string; label: string }[] = (selectedSub?.child_categories ?? [])
    .filter(hasStock)
    .map((c: ChildCategory) => ({ value: String(c.id), label: c.name }));

  // ── Local qty state for smooth direct typing ──
  const [qtyStr, setQtyStr] = React.useState(String(data.qty || 1));

  // Sync external → local when parent changes qty (e.g. reset)
  React.useEffect(() => {
    setQtyStr(String(data.qty || 1));
  }, [data.qty]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setQtyStr(raw); // allow free typing, including empty

    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) {
      onChange({ ...data, qty: Math.min(n, 100) });
    }
  };

  const handleQtyBlur = () => {
    // On blur, clamp to valid value
    const n = parseInt(qtyStr, 10);
    const final = Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 1;
    setQtyStr(String(final));
    onChange({ ...data, qty: final });
  };

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3 py-2 transition-colors hover:bg-[#FAF8F5]">
      {/* Row number */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
        {index + 1}
      </span>

      {/* Cascading selects */}
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
        <Select
          value={data.mainCategoryId}
          onChange={(v) =>
            onChange({ ...data, mainCategoryId: v, subCategoryId: "", childCategoryId: "" })
          }
          options={mainOptions}
          placeholder="Category"
        />

        <Select
          value={data.subCategoryId}
          onChange={(v) => onChange({ ...data, subCategoryId: v, childCategoryId: "" })}
          options={subOptions}
          placeholder="Sub Category"
          disabled={!data.mainCategoryId}
        />

        <Select
          value={data.childCategoryId}
          onChange={(v) => onChange({ ...data, childCategoryId: v })}
          options={childOptions}
          placeholder="Type"
          disabled={!data.subCategoryId}
        />

        {/* Qty input — native input for direct typing */}
        <div className="relative w-20 shrink-0">
          <input
            type="number"
            value={qtyStr}
            onChange={handleQtyChange}
            onBlur={handleQtyBlur}
            min={1}
            max={100}
            placeholder="Qty"
            className="h-9 w-full rounded-lg border border-black/8 bg-white text-center text-xs font-bold text-black outline-none transition-colors focus:border-[#191919] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-gray-300">
            pcs
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
        title="Remove"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}
