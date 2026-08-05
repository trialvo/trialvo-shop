import type { Customer, SaleProduct } from "@/components/sales/types";

export type CategoryOption = { id: string; name: string; image: string };

// Product Section: Category dropdown options (with images)
export const categories: CategoryOption[] = [
  { id: "all", name: "All Categories", image: "/images/product/product-02.jpg" },
  { id: "grocery", name: "Grocery", image: "/images/product/product-01.jpg" },
  { id: "fashion", name: "Fashion", image: "/images/product/product-04.jpg" },
  { id: "electronics", name: "Electronics", image: "/images/product/product-05.jpg" },
];

export const products: SaleProduct[] = [
  {
    id: "P-1001",
    title: "Mini Pumpkins",
    sku: "SKU-1439",
    category: "Grocery",
    subCategory: "Vegetable",
    childCategory: "Pumpkin",
    price: 6,
    image: "/images/product/product-01.jpg",
    variants: [{ id: "v1", name: "Regular" }, { id: "v2", name: "Organic" }],
    sizes: [{ id: "s1", name: "S" }, { id: "s2", name: "M" }, { id: "s3", name: "L" }],
  },
  {
    id: "P-1002",
    title: "Desi Cow Ghee",
    sku: "SKU-1440",
    category: "Grocery",
    subCategory: "Dairy",
    childCategory: "Ghee",
    price: 40,
    image: "/images/product/product-02.jpg",
    variants: [{ id: "v1", name: "250g" }, { id: "v2", name: "500g" }],
  },
  {
    id: "P-1003",
    title: "Chicken Tender Vegan",
    sku: "SKU-1441",
    category: "Grocery",
    subCategory: "Frozen",
    childCategory: "Snacks",
    price: 22.31,
    image: "/images/product/product-03.jpg",
    variants: [{ id: "v1", name: "Pack" }, { id: "v2", name: "Family Pack" }],
  },
];

export const customers: Customer[] = [
  {
    id: "C-101",
    name: "Mushrof",
    phone: "01700-000000",
    addresses: [
      { label: "Home", addressLine: "Dhaka, Mirpur 10", phone: "01700-000000" },
      { label: "Office", addressLine: "Banani, Road 11", phone: "01700-111111" },
    ],
  },
  {
    id: "C-102",
    name: "Antor",
    phone: "01800-000000",
    addresses: [{ label: "Home", addressLine: "Gazipur, Joydebpur", phone: "01800-000000" }],
  },
];

export const deliveryMethods = [
  { id: "home", name: "Home Delivery" },
  { id: "pickup", name: "Store Pickup" },
];
