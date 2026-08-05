import type {
  AttributeDefinition,
  BrandRow,
  Category,
  ChildCategory,
  ColorRow,
  SubCategory,
} from "./types";

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Fashion" },
  { id: 2, name: "Electronics" },
  { id: 3, name: "Home & Living" },
];

export const INITIAL_SUB_CATEGORIES: SubCategory[] = [
  { id: 11, categoryId: 1, name: "Men" },
  { id: 12, categoryId: 1, name: "Women" },
  { id: 21, categoryId: 2, name: "Mobile" },
  { id: 22, categoryId: 2, name: "Accessories" },
  { id: 31, categoryId: 3, name: "Kitchen" },
  { id: 32, categoryId: 3, name: "Decor" },
];

export const INITIAL_CHILD_CATEGORIES: ChildCategory[] = [
  { id: 111, subCategoryId: 11, name: "T-shirt" },
  { id: 112, subCategoryId: 11, name: "Shirt" },
  { id: 121, subCategoryId: 12, name: "Dress" },
  { id: 122, subCategoryId: 12, name: "Bag" },
  { id: 211, subCategoryId: 21, name: "Android" },
  { id: 212, subCategoryId: 21, name: "iPhone" },
  { id: 221, subCategoryId: 22, name: "Charger" },
  { id: 222, subCategoryId: 22, name: "Headphone" },
  { id: 311, subCategoryId: 31, name: "Cookware" },
  { id: 321, subCategoryId: 32, name: "Wall Art" },
];

// Brands / Colors / Attributes can later be wired to your ProductAttributes module/API.
export const INITIAL_BRANDS: BrandRow[] = [
  { id: 1, name: "No Brand", status: true, priority: "Normal" },
  { id: 2, name: "Nike", status: true, priority: "High" },
  { id: 3, name: "Adidas", status: true, priority: "Medium" },
];

export const INITIAL_COLORS: ColorRow[] = [
  { id: 1, name: "Red", hex: "#EF4444", status: true, priority: "Normal" },
  { id: 2, name: "Black", hex: "#111827", status: true, priority: "High" },
  { id: 3, name: "White", hex: "#F9FAFB", status: true, priority: "Medium" },
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
