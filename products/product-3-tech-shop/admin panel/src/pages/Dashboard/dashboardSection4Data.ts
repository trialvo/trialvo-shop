export interface TopViewProduct {
  id: string; // order id
  title: string;
  sku: string;
  image: string; // public path
  views: number;
  lastVisit: string; // display string
}

export interface TopSellingDistrict {
  id: string;
  name: string;
  percent: number; // 0-100
  amount: number;
}

export const topViewProducts: TopViewProduct[] = [
  {
    id: "ORD-1001",
    title: "Original Wireless Bl",
    sku: "1439",
    image: "/images/product/product-01.jpg",
    views: 506,
    lastVisit: "2025-12-13 09:58 AM",
  },
  {
    id: "ORD-1002",
    title: "Mens Formal Pant",
    sku: "1437",
    image: "/images/product/product-02.jpg",
    views: 478,
    lastVisit: "2025-12-13 03:59 PM",
  },
  {
    id: "ORD-1003",
    title: "Mens Formal Pant",
    sku: "1438",
    image: "/images/product/product-03.jpg",
    views: 461,
    lastVisit: "2025-12-13 07:21 PM",
  },
  {
    id: "ORD-1004",
    title: "Mens Formal Pant",
    sku: "1428",
    image: "/images/product/product-04.jpg",
    views: 349,
    lastVisit: "2025-12-13 08:44 AM",
  },
  {
    id: "ORD-1005",
    title: "Mens Formal Pant",
    sku: "1436",
    image: "/images/product/product-05.jpg",
    views: 338,
    lastVisit: "2025-12-12 07:40 PM",
  },
  {
    id: "ORD-1006",
    title: "Mens Formal Pant",
    sku: "1432",
    image: "/images/product/product-02.jpg",
    views: 324,
    lastVisit: "2025-12-12 03:10 PM",
  },

  // extra data for modal pagination
  ...Array.from({ length: 31 }).map((_, idx) => {
    const n = idx + 7;
    return {
      id: `ORD-10${n.toString().padStart(2, "0")}`,
      title: n % 3 === 0 ? "Mens Formal Pant" : "Premium Shirt",
      sku: (1400 + n).toString(),
      image: `/images/product/product-0${((n - 1) % 5) + 1}.jpg`,
      views: 320 - ((n * 3) % 120),
      lastVisit: `2025-12-${(n % 12) + 1} ${(8 + (n % 9))
        .toString()
        .padStart(2, "0")}:${(10 + (n % 50)).toString().padStart(2, "0")} ${
        n % 2 === 0 ? "AM" : "PM"
      }`,
    };
  }),
];

export const topSellingDistricts: TopSellingDistrict[] = [
  { id: "D1", name: "Dhaka", percent: 18.88, amount: 125 },
  { id: "D2", name: "Gazipur", percent: 6.19, amount: 41 },
  { id: "D3", name: "Bagerhat", percent: 4.23, amount: 28 },
  { id: "D4", name: "Faridpur", percent: 2.57, amount: 17 },
  { id: "D5", name: "Feni", percent: 2.27, amount: 15 },
  { id: "D6", name: "B. Baria", percent: 2.11, amount: 14 },

  // extra for modal pagination
  { id: "D7", name: "Rajshahi", percent: 1.96, amount: 13 },
  { id: "D8", name: "Khulna", percent: 1.84, amount: 12 },
  { id: "D9", name: "Sylhet", percent: 1.71, amount: 11 },
  { id: "D10", name: "Comilla", percent: 1.55, amount: 10 },
  { id: "D11", name: "Rangpur", percent: 1.41, amount: 9 },
];
