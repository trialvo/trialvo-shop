"use client";

import SelectDropdown, { type SelectDropdownOption } from "@/components/common/form/SelectDropdown";
import { cn } from "@/lib/utils";
import * as React from "react";
import type { HeaderSearchCategory } from "./types";

type Props = {
  categories: HeaderSearchCategory[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const CategorySelect: React.FC<Props> = React.memo(({ categories, value, onChange, className }) => {
  const options = React.useMemo<SelectDropdownOption<string>[]>(
    () => categories.map((c) => ({ value: c.value, label: c.label })),
    [categories],
  );

  return (
    <div
      className={cn(
        "h-full w-26 sm:w-full sm:max-w-40 shrink-0",
        "border-r border-black/10 bg-transparent",
        className,
      )}
    >
      <SelectDropdown
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Choose Categories"
        searchPlaceholder="Search category..."
        emptyText="No category found."
        disabled={false}
        searchable
        triggerClassName={cn(
          // Embedded in the header search shell — inherit height, drop outer border
          "h-full min-h-11 rounded-none border-0 bg-transparent px-3 shadow-none",
          "text-[12px] font-normal tracking-[0.01em] text-black",
          "hover:border-transparent hover:bg-transparent",
          "focus-visible:border-transparent focus-visible:ring-0",
        )}
      />
    </div>
  );
});

CategorySelect.displayName = "CategorySelect";

export default CategorySelect;
