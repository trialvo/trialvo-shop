// src/components/products/product-create/utils.ts
export function safeNumber(input: string, fallback: number): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeKey(colorId: number, variantId: number) {
  return `${colorId}__${variantId}`;
}

export function genSkuFromParts(parts: string[]): string {
  const cleaned = parts
    .map((p) => p.trim().toUpperCase().replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return [...cleaned, String(rand)].join("-");
}
