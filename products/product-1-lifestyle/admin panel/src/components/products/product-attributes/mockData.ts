import type {
  AttributeDefinition,
  BrandRow,
  ColorRow,
  ProductLite,
  ProductVariantRow,
} from "./types";

export const INITIAL_BRANDS: BrandRow[] = [
  {
    id: 1,
    name: "No Brand",
    img_path: null,
    status: true,
    priority: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: 2,
    name: "Nike",
    img_path: null,
    status: true,
    priority: 3,
    created_at: "",
    updated_at: "",
  },
  {
    id: 3,
    name: "Adidas",
    img_path: null,
    status: true,
    priority: 2,
    created_at: "",
    updated_at: "",
  },
];

export const INITIAL_COLORS: ColorRow[] = [
  { id: 1, name: "Red", hex: "#EF4444", status: true, priority: 1 },
  { id: 2, name: "Black", hex: "#111827", status: true, priority: 3 },
  { id: 3, name: "White", hex: "#F9FAFB", status: true, priority: 2 },
];

export const INITIAL_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: 101,
    name: "Size",
    type: "size",
    required: true,
    status: true,
    priority: "High",
    values: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: 102,
    name: "Material",
    type: "material",
    required: false,
    status: true,
    priority: "Normal",
    values: ["Cotton", "Polyester", "Leather"],
  },
];

export const INITIAL_PRODUCTS: ProductLite[] = [
  { id: 9001, name: "Men T-shirt", sku: "TSHIRT-001" },
  { id: 9002, name: "Ladies Bag", sku: "BAG-001" },
  { id: 9003, name: "Sandal", sku: "SANDAL-001" },
];

export const INITIAL_VARIANTS: ProductVariantRow[] = [];
