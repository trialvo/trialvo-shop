export interface TopSellingProductRow {
  id: string; // order id
  title: string;
  sku: string;
  image: string;
  qty: number; // total sell
  total: number; // total sell amount
  category: string;
  totalByCategory: number;
}

export interface StockAlertProductRow {
  id: string; // order id
  title: string;
  sku: string;
  image: string;
  price: number;
  stock: number;
}

export const topSellingProducts: TopSellingProductRow[] = [
  {
    id: "ORD-5001",
    title: "Cozy Long Sleeve Flannel...",
    sku: "2101",
    image: "/images/product/product-01.jpg",
    qty: 5,
    total: 5215,
    category: "Shirt",
    totalByCategory: 21000,
  },
  {
    id: "ORD-5002",
    title: "Chashi Aromatic Chinigura...",
    sku: "2102",
    image: "/images/product/product-02.jpg",
    qty: 3,
    total: 975,
    category: "Grocery",
    totalByCategory: 14500,
  },
  {
    id: "ORD-5003",
    title: "Naira Cut Three Piece For...",
    sku: "2103",
    image: "/images/product/product-03.jpg",
    qty: 3,
    total: 2500,
    category: "Fashion",
    totalByCategory: 32000,
  },
  {
    id: "ORD-5004",
    title: "Long Sleeve Flannel Shirt...",
    sku: "2104",
    image: "/images/product/product-04.jpg",
    qty: 3,
    total: 3129,
    category: "Shirt",
    totalByCategory: 21000,
  },
  {
    id: "ORD-5005",
    title: "Premium High Quality Airb...",
    sku: "2105",
    image: "/images/product/product-05.jpg",
    qty: 3,
    total: 2790,
    category: "Accessories",
    totalByCategory: 9800,
  },

  // extra rows for modal pagination
  ...Array.from({ length: 25 }).map((_, idx) => {
    const n = idx + 6;
    return {
      id: `ORD-50${n.toString().padStart(2, "0")}`,
      title: n % 2 === 0 ? "Premium Shirt..." : "Exclusive Panjabi...",
      sku: (2100 + n).toString(),
      image: `/images/product/product-0${((n - 1) % 5) + 1}.jpg`,
      qty: (n % 5) + 1,
      total: 800 + (n % 7) * 450,
      category: ["Shirt", "Fashion", "Grocery", "Shoes"][n % 4],
      totalByCategory: 8000 + (n % 5) * 6500,
    };
  }),
];

export const stockAlertProducts: StockAlertProductRow[] = [
  {
    id: "ORD-9001",
    title: "White Panjabi with Chest...",
    sku: "3101",
    image: "/images/product/product-01.jpg",
    price: 550,
    stock: 0,
  },
  {
    id: "ORD-9002",
    title: "Premium Soft Cotton.. Excl...",
    sku: "3102",
    image: "/images/product/product-02.jpg",
    price: 799,
    stock: 0,
  },
  {
    id: "ORD-9003",
    title: "Trendy Panjabi with Chest...",
    sku: "3103",
    image: "/images/product/product-03.jpg",
    price: 999,
    stock: 0,
  },
  {
    id: "ORD-9004",
    title: "Exclusive Print Panjabi F...",
    sku: "3104",
    image: "/images/product/product-04.jpg",
    price: 699,
    stock: 0,
  },
  {
    id: "ORD-9005",
    title: "Shoes Men Patent artifici...",
    sku: "3105",
    image: "/images/product/product-05.jpg",
    price: 1199,
    stock: 0,
  },
];
