import type { MenuNode } from "./menu.types";

export const MENU_ROOT: MenuNode[] = [
  {
    label: "Eid Collections",
    children: [
      { label: "New Arrival", href: "/collections/eid/new" },
      { label: "Best Seller", href: "/collections/eid/best" },
    ],
  },
  {
    label: "Men’s",
    children: [
      { label: "Twill Pants", href: "/category/mens/twill-pants" },
      { label: "Trousers Pants", href: "/category/mens/trousers" },
      { label: "Cargo Pant", href: "/category/mens/cargo" },
      { label: "Jogger", href: "/category/mens/jogger" },
      { label: "T-Shirt", href: "/category/mens/t-shirt" },
      { label: "Jacket", href: "/category/mens/jacket" },
      { label: "Sweater", href: "/category/mens/sweater" },
      { label: "Hoodie", href: "/category/mens/hoodie" },
      { label: "Pullover", href: "/category/mens/pullover" },
      { label: "Kabli Set", href: "/category/mens/kabli-set" },
    ],
  },
  { label: "Women’s", href: "/category/womens" },
  { label: "Kids", href: "/category/kids" },
  { label: "Accessories", href: "/category/accessories" },
];
