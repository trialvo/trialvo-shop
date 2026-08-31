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
  // Clear immediately so "Clear all filters" does not wait on debounce
  const effectiveColors = colors.size === 0 ? colors : debouncedColors;

  React.useEffect(() => {
    if (!effectiveColors?.size) {
      setColorIds("");
      return;
    }

    if (!allColors.length) {
      setColorIds("");
      return;
    }

    const selectedColorIds = Array.from(effectiveColors)
      .map((colorName) => {
        const found = allColors.find((c) => norm(c?.name) === norm(colorName));
        return toId(found?.id);
      })
      .filter((id) => id > 0);

    setColorIds(selectedColorIds.join(","));
  }, [effectiveColors, allColors]);

  return colorIds;
}