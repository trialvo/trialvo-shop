// src/components/products/product-attributes/types.ts

export type PriorityValue = 1 | 2 | 3 | 4;

export type Option = {
  value: string;
  label: string;
};

export type BrandRow = {
  id: number;
  name: string;
  img_path: string | null;
  status: boolean;
  priority: PriorityValue;
  created_at: string;
  updated_at: string;
};

export type ColorRow = {
  id: number;
  name: string;
  name_bd?: string | null;
  hex: string; // #RRGGBB
  status: boolean;
  priority: PriorityValue;
  created_at?: string;
  updated_at?: string;
};

export type AttributeType = "text" | "size" | "material" | "custom";

export type AttributeDefinition = {
  id: number;
  name: string;
  type: AttributeType;
  required: boolean;
  status: boolean;
  priority: "Low" | "Normal" | "Medium" | "High";
  values: string[];
};

export type ProductLite = {
  id: number;
  name: string;
  sku: string;
};

export type ProductAttributeSelection = Record<number, string[]>;

export function safeNumber(input: string, fallback: number): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function makeSkuBase(base: string): string {
  return base.trim().toUpperCase().replace(/\s+/g, "-");
}

export function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]],
  );
}

/** Variant (value) */
export interface VariantRow {
  id: number;
  attribute_id: number;
  name: string;
  name_bd?: string | null;
  serial: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariantRow {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  active: boolean;
  attributes: Record<string, string>;
}

/** Attribute */
export interface AttributeRow {
  id: number;
  name: string;
  name_bd?: string | null;
  priority: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  variants: VariantRow[];
}
