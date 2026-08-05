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
        "h-full w-26 sm:w-full sm:max-w-45 shrink-0",
        "border-r border-[#D9D9D9] bg-[#F8F8F8]",
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
        triggerClassName={cn(
          "h-full w-full border-0 bg-transparent px-4",
          "text-sm font-medium text-black",
          "hover:bg-transparent",
        )}
        contentClassName="rounded-none w-50 sm:w-70"
        side="bottom"
        align="start"
        sideOffset={6}
        avoidCollisions={false}
        listMaxHeightClassName="max-h-[260px]"
      />
    </div>
  );
});

CategorySelect.displayName = "CategorySelect";

export default CategorySelect;
