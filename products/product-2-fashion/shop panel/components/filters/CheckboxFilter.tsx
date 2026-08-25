"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ColorItem } from "@/lib/api/color/service";
import type { VariantItem } from "@/lib/api/variant/service";
import { getLocalName } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import React from "react";

export type CheckboxFilterProps = {
  title: string;
  options: ColorItem[] | VariantItem[];
  selected: ReadonlySet<string>;
  onToggle: (value: string) => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
};

const CheckboxFilter: React.FC<CheckboxFilterProps> = ({
  title,
  options,
  selected,
  onToggle,
  onSearchChange,
  searchValue,
}) => {
  const { language } = useLanguage();
  const [internalQuery, setInternalQuery] = React.useState<string>("");
  const query = typeof searchValue === "string" ? searchValue : internalQuery;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o?.name ?? "").toLowerCase().includes(q));
  }, [options, query]);

  const handleQueryChange = (v: string) => {
    if (typeof searchValue !== "string") setInternalQuery(v);
    onSearchChange?.(v);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>

      <Input
        className="h-9"
        placeholder={`Search ${title}`}
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
      />

      <div className="max-h-42 space-y-2 overflow-auto pr-1">
        {filtered.map((o) => {
          const name = String(o?.name ?? "");
          const label = getLocalName(name, o?.name_bd, language);
          const checked = selected.has(name);

          return (
            <label key={String(o?.id)} className="flex items-center gap-2 text-sm">
              <Checkbox checked={checked} onCheckedChange={() => onToggle(name)} />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxFilter;
