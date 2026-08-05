import type { Option } from "./types";

export const ZONES: string[] = [
  "Home Top",
  "Home Middle",
  "Home Bottom",
  "Category Page",
  "Product Page",
  "Campaign",
];

// backend sends "Default"
export const TYPES: string[] = ["Default"];

export const STATUS_FILTER_OPTIONS: Option[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const FEATURED_FILTER_OPTIONS: Option[] = [
  { value: "", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "not_featured", label: "Not Featured" },
];

export function mapStatusFilterToApi(v: string): 0 | 1 | undefined {
  if (v === "active") return 1;
  if (v === "inactive") return 0;
  return undefined;
}

export function mapFeaturedFilterToApi(v: string): 0 | 1 | undefined {
  if (v === "featured") return 1;
  if (v === "not_featured") return 0;
  return undefined;
}
