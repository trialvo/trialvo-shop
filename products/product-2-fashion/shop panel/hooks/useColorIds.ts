"use client";

import { useColor } from "@/hooks/useColor";
import { useDebounce } from "@/hooks/useDebounce";
import React from "react";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function toId(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  const i = Math.trunc(n);
  return i > 0 ? i : 0;
}

export function useColorIds(
  colors: ReadonlySet<string>, 
  debounceMs: number = 1000
): string {
  const { colors: allColors = [] } = useColor({ status: true });
  const [colorIds, setColorIds] = React.useState<string>("");
  
  const debouncedColors = useDebounce(colors, debounceMs);
  
  React.useEffect(() => {
    if (!debouncedColors?.size) {
      setColorIds("");
      return;
    }

    if (!allColors.length) {
      setColorIds("");
      return;
    }

    const selectedColorIds = Array.from(debouncedColors)
      .map((colorName) => {
        const found = allColors.find((c) => norm(c?.name) === norm(colorName));
        return toId(found?.id);
      })
      .filter((id) => id > 0);

    setColorIds(selectedColorIds.join(","));
  }, [debouncedColors, allColors]);

  return colorIds;
}