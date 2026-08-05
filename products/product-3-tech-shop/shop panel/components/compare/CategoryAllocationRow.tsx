"use client";

import * as React from "react";
import { X } from "lucide-react";
import type {
  MainCategory,
  SubCategory,
  ChildCategory,
} from "@/lib/api/category/service";
import { AppSelect } from "@/components/shared/AppSelect";
import type { AppSelectOption } from "@/lib/ui/appSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

function hasStock(c: ChildCategory): boolean {
  return (c.total_stock ?? 0) > 0;
}

/**
 * Cascading category row — uses shared AppSelect (searchable when long lists).
 */
export default function CategoryAllocationRow({
  data,
  categories,
  onChange,
  onRemove,
  index,
}: CategoryAllocationRowProps) {
  const filterSub = (s: SubCategory) =>
    (s.child_categories ?? []).some(hasStock);

  const filterMain = (m: MainCategory) =>
    (m.sub_categories ?? []).some(filterSub);

  const mainOptions: AppSelectOption[] = categories
    .filter(filterMain)
    .map((c) => ({ value: String(c.id), label: c.name }));

  const selectedMain = categories.find(
    (c) => String(c.id) === data.mainCategoryId,
  );

  const subOptions: AppSelectOption[] = (selectedMain?.sub_categories ?? [])
    .filter(filterSub)
    .map((s: SubCategory) => ({ value: String(s.id), label: s.name }));

  const selectedSub = selectedMain?.sub_categories?.find(
    (s: SubCategory) => String(s.id) === data.subCategoryId,
  );

  const childOptions: AppSelectOption[] = (
    selectedSub?.child_categories ?? []
  )
    .filter(hasStock)
    .map((c: ChildCategory) => ({ value: String(c.id), label: c.name }));

  const [qtyStr, setQtyStr] = React.useState(String(data.qty || 1));

  React.useEffect(() => {
    setQtyStr(String(data.qty || 1));
  }, [data.qty]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setQtyStr(raw);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) {
      onChange({ ...data, qty: Math.min(n, 100) });
    }
  };

  const handleQtyBlur = () => {
    const n = parseInt(qtyStr, 10);
    const final = Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 1;
    setQtyStr(String(final));
    onChange({ ...data, qty: final });
  };

  return (
    <div
      className={cn(
        "group flex flex-col gap-2.5 rounded-sm border border-border bg-card p-3 shadow-product transition-colors sm:flex-row sm:items-center sm:gap-2",
        "hover:border-primary/25",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
        {index + 1}
      </span>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          value={data.mainCategoryId}
          onChange={(v) =>
            onChange({
              ...data,
              mainCategoryId: v,
              subCategoryId: "",
              childCategoryId: "",
            })
          }
          options={mainOptions}
          placeholder="Category"
          layer="page"
          emptyLabel="No categories"
          className="min-w-0"
        />

        <AppSelect
          value={data.subCategoryId}
          onChange={(v) =>
            onChange({ ...data, subCategoryId: v, childCategoryId: "" })
          }
          options={subOptions}
          placeholder="Sub category"
          disabled={!data.mainCategoryId}
          layer="page"
          emptyLabel="No sub categories"
          className="min-w-0"
        />

        <AppSelect
          value={data.childCategoryId}
          onChange={(v) => onChange({ ...data, childCategoryId: v })}
          options={childOptions}
          placeholder="Product type"
          disabled={!data.subCategoryId}
          layer="page"
          emptyLabel="No types"
          className="min-w-0"
        />

        <div className="relative min-w-0">
          <Input
            type="number"
            value={qtyStr}
            onChange={handleQtyChange}
            onBlur={handleQtyBlur}
            min={1}
            max={100}
            placeholder="Qty"
            aria-label="Quantity"
            className="h-9 rounded-sm pr-9 text-center text-xs font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-muted-foreground">
            pcs
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-sm text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive sm:self-center"
        title="Remove row"
        aria-label="Remove allocation row"
      >
        <X size={14} />
      </button>
    </div>
  );
}
