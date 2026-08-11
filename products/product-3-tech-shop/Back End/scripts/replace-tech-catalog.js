/**
 * Replace fashion catalog rows with authentic tech/gadget products.
 *
 * SAFE SCOPE: only mutates catalog + homepage banners + mega sale in the TARGET database.
 * Does NOT edit myecomv2.sql dumps for lifestyle/fashion.
 *
 * Usage:
 *   node replace-tech-catalog.js
 *   DB_NAME=techshop_demo DB_HOST=127.0.0.1 DB_PORT=3430 DB_USER=root DB_PASSWORD=localdev2026 node replace-tech-catalog.js
 */
"use strict";

const mysql = require("mysql2/promise");

const cfg = {
  host: process.env.DB_HOST || process.env.SHARED_DEMO_DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || process.env.SHARED_DEMO_DB_PORT || "3430", 10),
  user: process.env.DB_USER || process.env.SHARED_DEMO_DB_USER || "root",
  password:
    process.env.DB_PASSWORD ||
    process.env.DB_ROOT_PASSWORD ||
    process.env.SHARED_DEMO_DB_PASSWORD ||
    "localdev2026",
  database: process.env.DB_NAME || "techshop_demo",
};

const U = "https://images.unsplash.com";
const img = (id, w = 900, h = 900) =>
  `${U}/${id}?w=${w}&h=${h}&fit=crop&q=85`;

/** Verified Unsplash tech shots (unique; GET-checked 200). */
const IMAGES = {
  phone1: img("photo-1511707171634-5f897ff02aa9"),
  phone2: img("photo-1510557880182-3d4d3cba35a5"),
  phone3: img("photo-1592750475338-74b7b21085ab"),
  laptop1: img("photo-1496181133206-80ce9b88a853"),
  laptop2: img("photo-1525547719571-a2d4ac8945e2"),
  laptop3: img("photo-1517336714731-489689fd1ca8"),
  tablet1: img("photo-1544244015-0df4b3ffc6b0"),
  buds1: img("photo-1590658268037-6bf12165a8df"),
  buds2: img("photo-1606220945770-b5b6c2c55bf1"),
  head1: img("photo-1505740420928-5e560c06d30e"),
  head2: img("photo-1484704849700-f032a568e944"),
  watch1: img("photo-1434493789847-2f02dc6ca35d"),
  watch2: img("photo-1579586337278-3befd40fd17a"),
  charge1: img("photo-1625948515291-69613efd103f"),
  charge2: img("photo-1572569511254-d8f925fe2cbb"),
  cable1: img("photo-1625948515291-69613efd103f"),
  speaker1: img("photo-1608043152269-423dbba4e7e1"),
  speaker2: img("photo-1600294037681-c80b4cb5b434"),
  mouse1: img("photo-1527864550417-7fd91fc51a46"),
  keyboard1: img("photo-1587829741301-dc798b83add3"),
  cam1: img("photo-1516035069371-29a1b244cc32"),
  power1: img("photo-1572569511254-d8f925fe2cbb"),
  game1: img("photo-1606144042614-b2417e99c4e3"),
  ssd1: img("photo-1597872200969-2b65d56bd16b"),
  router1: img("photo-1518770660439-4636190af475"),
  stand1: img("photo-1593640408182-31c70c8268f5"),
  case1: img("photo-1601784551446-20c9e07cdbdb"),
  desk1: img("photo-1519389950473-47ba0277781c"),
  heroPhones: img("photo-1550745165-9bc0b252726f", 1600, 900),
  heroLaptops: img("photo-1531297484001-80022131f5a1", 1600, 900),
  heroAudio: img("photo-1505740420928-5e560c06d30e", 1600, 900),
  heroGaming: img("photo-1606144042614-b2417e99c4e3", 1200, 900),
  heroAccess: img("photo-1550009158-9ebf69173e03", 1200, 900),
  offerWear: img("photo-1434493789847-2f02dc6ca35d", 1200, 800),
  offerDesk: img("photo-1593640408182-31c70c8268f5", 1200, 800),
};

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

async function q(conn, sql, params = []) {
  return conn.query(sql, params);
}

async function clearCatalog(conn) {
  const tables = [
    "product_images",
    "product_videos",
    "product_reviews",
    "review_images",
    "product_stock_logs",
    "product_view_logs",
    "mega_sale_products",
    "coupon_product_targets",
    "product_skus",
    "products",
    "child_categories",
    "sub_categories",
    "main_categories",
    "brands",
    "colors",
    "variants",
    "attributes",
  ];

  await q(conn, "SET FOREIGN_KEY_CHECKS=0");
  for (const t of tables) {
    try {
      await q(conn, `DELETE FROM \`${t}\``);
      await q(conn, `ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
    } catch (e) {
      // Table may not exist on older schemas — skip carefully.
      if (!String(e.message).includes("doesn't exist")) throw e;
    }
  }
  await q(conn, "SET FOREIGN_KEY_CHECKS=1");
}

async function seedTaxonomy(conn) {
  // Colors
  const colors = [
    [1, "Black", "কালো", "#111111"],
    [2, "White", "সাদা", "#FFFFFF"],
    [3, "Silver", "সিলভার", "#C0C0C0"],
    [4, "Space Gray", "স্পেস গ্রে", "#4A4A4A"],
    [5, "Blue", "নীল", "#1E88E5"],
    [6, "Green", "সবুজ", "#2E7D32"],
    [7, "Red", "লাল", "#C62828"],
  ];
  for (const [id, name, nameBd, hex] of colors) {
    await q(
      conn,
      `INSERT INTO colors (id, name, name_bd, hex, priority, status) VALUES (?,?,?,?,1,1)`,
      [id, name, nameBd, hex]
    );
  }

  // Attribute + variants (storage / option)
  await q(
    conn,
    `INSERT INTO attributes (id, name, name_bd, priority, status) VALUES (1, 'Storage', 'স্টোরেজ', 1, 1)`
  );
  const variants = [
    [1, 1, "Standard", "স্ট্যান্ডার্ড", 1],
    [2, 1, "128GB", "১২৮জিবি", 2],
    [3, 1, "256GB", "২৫৬জিবি", 3],
    [4, 1, "512GB", "৫১২জিবি", 4],
  ];
  for (const [id, attrId, name, nameBd, serial] of variants) {
    await q(
      conn,
      `INSERT INTO variants (id, attribute_id, name, serial, name_bd, status) VALUES (?,?,?,?,?,1)`,
      [id, attrId, name, serial, nameBd]
    );
  }

  // Brands
  const brands = [
    [1, "Apple"],
    [2, "Samsung"],
    [3, "Sony"],
    [4, "Xiaomi"],
    [5, "Anker"],
    [6, "JBL"],
    [7, "Logitech"],
    [8, "Lenovo"],
    [9, "OnePlus"],
    [10, "Baseus"],
  ];
  for (const [id, name] of brands) {
    await q(
      conn,
      `INSERT INTO brands (id, name, img_path, priority, status) VALUES (?,?,NULL,1,1)`,
      [id, name]
    );
  }

  // Categories
  await q(
    conn,
    `INSERT INTO main_categories (id, name, name_bd, img_path, status, featured, priority)
     VALUES (1, 'Electronics', 'ইলেকট্রনিক্স', ?, 1, 1, 3)`,
    [IMAGES.desk1]
  );

  const subs = [
    [1, 1, "Smartphones", "স্মার্টফোন", IMAGES.phone1, 1],
    [2, 1, "Laptops & Tablets", "ল্যাপটপ ও ট্যাবলেট", IMAGES.laptop1, 1],
    [3, 1, "Audio", "অডিও", IMAGES.head1, 1],
    [4, 1, "Wearables", "ওয়্যারেবল", IMAGES.watch1, 1],
    [5, 1, "Accessories", "এক্সেসরিজ", IMAGES.charge1, 1],
    [6, 1, "Gaming", "গেমিং", IMAGES.game1, 1],
  ];
  for (const [id, mainId, name, nameBd, image, featured] of subs) {
    await q(
      conn,
      `INSERT INTO sub_categories (id, main_category_id, name, name_bd, img_path, status, featured, priority)
       VALUES (?,?,?,?,?,1,?,2)`,
      [id, mainId, name, nameBd, image, featured]
    );
  }

  const children = [
    [1, 1, "Flagship Phones", "ফ্ল্যাগশিপ ফোন"],
    [2, 1, "Mid-range Phones", "মিড-রেঞ্জ ফোন"],
    [3, 2, "Ultrabooks", "আল্ট্রাবুক"],
    [4, 2, "Tablets", "ট্যাবলেট"],
    [5, 3, "Earbuds", "ইয়ারবাড"],
    [6, 3, "Headphones", "হেডফোন"],
    [7, 3, "Speakers", "স্পিকার"],
    [8, 4, "Smartwatches", "স্মার্টওয়াচ"],
    [9, 5, "Chargers & Cables", "চার্জার ও কেবল"],
    [10, 5, "Computer Peripherals", "কম্পিউটার পেরিফেরাল"],
    [11, 6, "Consoles & Controllers", "কনসোল ও কন্ট্রোলার"],
  ];
  for (const [id, subId, name, nameBd] of children) {
    await q(
      conn,
      `INSERT INTO child_categories (id, sub_category_id, name, name_bd, img_path, status, featured, priority)
       VALUES (?,?,?,?,NULL,1,0,1)`,
      [id, subId, name, nameBd]
    );
  }
}

/**
 * @typedef {{
 *  name: string, nameBd: string, brandId: number,
 *  subId: number, childId: number, image: string,
 *  short: string, shortBd: string,
 *  featured?: number, bestDeal?: number, freeDelivery?: number,
 *  skus: Array<{colorId:number, variantId:number, buy:number, sell:number, discount?:number, stock?:number, weight?:number}>
 * }} TechProduct
 */

/** @type {TechProduct[]} */
const PRODUCTS = [
  {
    name: "Galaxy S24 Ultra 256GB",
    nameBd: "গ্যালাক্সি S24 আল্ট্রা ২৫৬জিবি",
    brandId: 2,
    subId: 1,
    childId: 1,
    image: IMAGES.phone1,
    short: "Flagship Android phone with bright display and long battery life.",
    shortBd: "উজ্জ্বল ডিসপ্লে ও দীর্ঘ ব্যাটারি লাইফসহ ফ্ল্যাগশিপ অ্যান্ড্রয়েড ফোন।",
    featured: 1,
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 18 },
      { colorId: 4, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 12 },
      { colorId: 5, variantId: 4, buy: 108000, sell: 134999, discount: 4000, stock: 8 },
    ],
  },
  {
    name: "iPhone 15 128GB",
    nameBd: "আইফোন ১৫ ১২৮জিবি",
    brandId: 1,
    subId: 1,
    childId: 1,
    image: IMAGES.phone2,
    short: "A16-class performance, Dynamic Island, dual camera system.",
    shortBd: "শক্তিশালী পারফরম্যান্স, ডায়নামিক আইল্যান্ড ও ডুয়াল ক্যামেরা।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 2, buy: 78000, sell: 99999, discount: 3000, stock: 20 },
      { colorId: 5, variantId: 2, buy: 78000, sell: 99999, discount: 3000, stock: 14 },
      { colorId: 2, variantId: 3, buy: 88000, sell: 109999, discount: 2000, stock: 10 },
    ],
  },
  {
    name: "Redmi Note 13 Pro",
    nameBd: "রেডমি নোট ১৩ প্রো",
    brandId: 4,
    subId: 1,
    childId: 2,
    image: IMAGES.phone3,
    short: "Value flagship killer with AMOLED display and fast charging.",
    shortBd: "AMOLED ডিসপ্লে ও ফাস্ট চার্জিংসহ সাশ্রয়ী পারফরম্যান্স ফোন।",
    bestDeal: 1,
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 22000, sell: 29999, discount: 2000, stock: 40 },
      { colorId: 6, variantId: 3, buy: 22000, sell: 29999, discount: 2000, stock: 28 },
    ],
  },
  {
    name: "OnePlus Nord CE 4",
    nameBd: "ওয়ানপ্লাস নর্ড CE ৪",
    brandId: 9,
    subId: 1,
    childId: 2,
    image: IMAGES.phone1,
    short: "Smooth OxygenOS experience with rapid charging.",
    shortBd: "দ্রুত চার্জিংসহ স্মুথ OxygenOS অভিজ্ঞতা।",
    skus: [
      { colorId: 5, variantId: 3, buy: 24000, sell: 32999, discount: 1500, stock: 22 },
      { colorId: 4, variantId: 3, buy: 24000, sell: 32999, discount: 1500, stock: 16 },
    ],
  },
  {
    name: "MacBook Air M2 256GB",
    nameBd: "ম্যাকবুক এয়ার M2 ২৫৬জিবি",
    brandId: 1,
    subId: 2,
    childId: 3,
    image: IMAGES.laptop1,
    short: "Thin and light laptop for work, study, and creative tasks.",
    shortBd: "কাজ, পড়াশোনা ও ক্রিয়েটিভ কাজে হালকা ও শক্তিশালী ল্যাপটপ।",
    featured: 1,
    skus: [
      { colorId: 3, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 9, weight: 1.24 },
      { colorId: 4, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 7, weight: 1.24 },
    ],
  },
  {
    name: "Lenovo IdeaPad Slim 5",
    nameBd: "লেনোভো আইডিয়াপ্যাড স্লিম ৫",
    brandId: 8,
    subId: 2,
    childId: 3,
    image: IMAGES.laptop2,
    short: "Everyday Windows laptop with solid battery and SSD storage.",
    shortBd: "ভালো ব্যাটারি ও SSD স্টোরেজসহ দৈনন্দিন উইন্ডোজ ল্যাপটপ।",
    bestDeal: 1,
    skus: [
      { colorId: 4, variantId: 3, buy: 52000, sell: 68999, discount: 4000, stock: 15, weight: 1.6 },
      { colorId: 1, variantId: 4, buy: 58000, sell: 74999, discount: 3000, stock: 8, weight: 1.6 },
    ],
  },
  {
    name: "Samsung Galaxy Tab S9 FE",
    nameBd: "স্যামসাং গ্যালাক্সি ট্যাব S9 FE",
    brandId: 2,
    subId: 2,
    childId: 4,
    image: IMAGES.tablet1,
    short: "Entertainment and note-taking tablet with vivid screen.",
    shortBd: "উজ্জ্বল স্ক্রিনসহ বিনোদন ও নোট নেওয়ার ট্যাবলেট।",
    skus: [
      { colorId: 4, variantId: 2, buy: 28000, sell: 37999, discount: 2000, stock: 14 },
      { colorId: 6, variantId: 3, buy: 32000, sell: 42999, discount: 2000, stock: 10 },
    ],
  },
  {
    name: "iPad 10th Gen 64GB",
    nameBd: "আইপ্যাড ১০ম জেনারেশন ৬৪জিবি",
    brandId: 1,
    subId: 2,
    childId: 4,
    image: IMAGES.tablet1,
    short: "Colorful all-screen iPad for streaming, drawing, and study.",
    shortBd: "স্ট্রিমিং, ড্রয়িং ও পড়াশোনার জন্য অল-স্ক্রিন আইপ্যাড।",
    featured: 1,
    skus: [
      { colorId: 5, variantId: 1, buy: 36000, sell: 48999, discount: 2000, stock: 11 },
      { colorId: 3, variantId: 1, buy: 36000, sell: 48999, discount: 2000, stock: 9 },
    ],
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    nameBd: "সনি WH-1000XM5 হেডফোন",
    brandId: 3,
    subId: 3,
    childId: 6,
    image: IMAGES.head1,
    short: "Industry-leading noise cancelling with premium sound.",
    shortBd: "প্রিমিয়াম সাউন্ডসহ ইন্ডাস্ট্রি-লিডিং নয়েজ ক্যানসেলিং।",
    featured: 1,
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 28000, sell: 39999, discount: 3000, stock: 20 },
      { colorId: 3, variantId: 1, buy: 28000, sell: 39999, discount: 3000, stock: 12 },
    ],
  },
  {
    name: "JBL Tune 760NC",
    nameBd: "JBL টিউন ৭৬০NC",
    brandId: 6,
    subId: 3,
    childId: 6,
    image: IMAGES.head2,
    short: "Wireless over-ear headphones with active noise cancelling.",
    shortBd: "অ্যাকটিভ নয়েজ ক্যানসেলিংসহ ওয়্যারলেস ওভার-ইয়ার হেডফোন।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 6500, sell: 9999, discount: 1000, stock: 35 },
      { colorId: 5, variantId: 1, buy: 6500, sell: 9999, discount: 1000, stock: 22 },
    ],
  },
  {
    name: "Galaxy Buds2 Pro",
    nameBd: "গ্যালাক্সি বাডস২ প্রো",
    brandId: 2,
    subId: 3,
    childId: 5,
    image: IMAGES.buds1,
    short: "Compact ANC earbuds with rich audio and long battery.",
    shortBd: "রিচ অডিও ও দীর্ঘ ব্যাটারির কমপ্যাক্ট ANC ইয়ারবাড।",
    skus: [
      { colorId: 1, variantId: 1, buy: 12000, sell: 17999, discount: 1500, stock: 30 },
      { colorId: 2, variantId: 1, buy: 12000, sell: 17999, discount: 1500, stock: 18 },
    ],
  },
  {
    name: "AirPods Pro (2nd Gen)",
    nameBd: "এয়ারপডস প্রো (২য় জেনারেশন)",
    brandId: 1,
    subId: 3,
    childId: 5,
    image: IMAGES.buds2,
    short: "Adaptive audio, ANC, and MagSafe charging case.",
    shortBd: "অ্যাডাপটিভ অডিও, ANC ও MagSafe চার্জিং কেস।",
    featured: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 18000, sell: 26999, discount: 2000, stock: 25 },
    ],
  },
  {
    name: "JBL Flip 6 Portable Speaker",
    nameBd: "JBL ফ্লিপ ৬ পোর্টেবল স্পিকার",
    brandId: 6,
    subId: 3,
    childId: 7,
    image: IMAGES.speaker1,
    short: "Waterproof Bluetooth speaker with bold JBL sound.",
    shortBd: "বোল্ড JBL সাউন্ডসহ ওয়াটারপ্রুফ ব্লুটুথ স্পিকার।",
    bestDeal: 1,
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 26 },
      { colorId: 7, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 14 },
      { colorId: 5, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 12 },
    ],
  },
  {
    name: "Sony SRS-XB100",
    nameBd: "সনি SRS-XB100",
    brandId: 3,
    subId: 3,
    childId: 7,
    image: IMAGES.speaker2,
    short: "Ultra-portable durable speaker for outdoor use.",
    shortBd: "আউটডোর ব্যবহারের জন্য হালকা ও টেকসই স্পিকার।",
    skus: [
      { colorId: 1, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 40 },
      { colorId: 5, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 24 },
    ],
  },
  {
    name: "Apple Watch SE (2nd Gen)",
    nameBd: "অ্যাপল ওয়াচ SE (২য় জেনারেশন)",
    brandId: 1,
    subId: 4,
    childId: 8,
    image: IMAGES.watch1,
    short: "Fitness tracking, heart rate, and iPhone notifications.",
    shortBd: "ফিটনেস ট্র্যাকিং, হার্ট রেট ও আইফোন নোটিফিকেশন।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 22000, sell: 29999, discount: 2000, stock: 16 },
      { colorId: 3, variantId: 1, buy: 22000, sell: 29999, discount: 2000, stock: 12 },
    ],
  },
  {
    name: "Galaxy Watch 6",
    nameBd: "গ্যালাক্সি ওয়াচ ৬",
    brandId: 2,
    subId: 4,
    childId: 8,
    image: IMAGES.watch2,
    short: "Advanced health sensors with sleek circular design.",
    shortBd: "স্লিক সার্কুলার ডিজাইনসহ অ্যাডভান্সড হেলথ সেন্সর।",
    skus: [
      { colorId: 4, variantId: 1, buy: 20000, sell: 27999, discount: 2000, stock: 18 },
      { colorId: 3, variantId: 1, buy: 20000, sell: 27999, discount: 2000, stock: 10 },
    ],
  },
  {
    name: "Anker 737 Power Bank (PowerCore 24K)",
    nameBd: "অ্যাংকার ৭৩৭ পাওয়ার ব্যাংক (২৪কে)",
    brandId: 5,
    subId: 5,
    childId: 9,
    image: IMAGES.charge1,
    short: "High-capacity fast-charge power bank for phones and laptops.",
    shortBd: "ফোন ও ল্যাপটপের জন্য হাই-ক্যাপাসিটি ফাস্ট-চার্জ পাওয়ার ব্যাংক।",
    bestDeal: 1,
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1000, stock: 32 },
    ],
  },
  {
    name: "Baseus 65W GaN Charger",
    nameBd: "বেসিয়াস ৬৫W GaN চার্জার",
    brandId: 10,
    subId: 5,
    childId: 9,
    image: IMAGES.charge2,
    short: "Compact multi-port GaN charger for laptop and phone.",
    shortBd: "ল্যাপটপ ও ফোনের জন্য কমপ্যাক্ট মাল্টি-পোর্ট GaN চার্জার।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 50 },
      { colorId: 2, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 28 },
    ],
  },
  {
    name: "Anker USB-C to Lightning Cable (1.8m)",
    nameBd: "অ্যাংকার USB-C টু লাইটনিং কেবল (১.৮মিটার)",
    brandId: 5,
    subId: 5,
    childId: 9,
    image: IMAGES.cable1,
    short: "Durable braided cable for fast sync and charging.",
    shortBd: "ফাস্ট চার্জ ও সিঙ্কের জন্য টেকসই ব্রেইডেড কেবল।",
    skus: [
      { colorId: 1, variantId: 1, buy: 700, sell: 1299, discount: 100, stock: 80 },
      { colorId: 2, variantId: 1, buy: 700, sell: 1299, discount: 100, stock: 60 },
    ],
  },
  {
    name: "Logitech MX Master 3S Mouse",
    nameBd: "লজটেক MX মাস্টার ৩S মাউস",
    brandId: 7,
    subId: 5,
    childId: 10,
    image: IMAGES.mouse1,
    short: "Quiet clicks, MagSpeed scroll, multi-device productivity mouse.",
    shortBd: "কোয়ায়েট ক্লিক ও মাল্টি-ডিভাইস প্রোডাকটিভিটি মাউস।",
    featured: 1,
    skus: [
      { colorId: 4, variantId: 1, buy: 7500, sell: 10999, discount: 1000, stock: 22 },
      { colorId: 1, variantId: 1, buy: 7500, sell: 10999, discount: 1000, stock: 18 },
    ],
  },
  {
    name: "Logitech MX Keys S Keyboard",
    nameBd: "লজটেক MX কীজ S কীবোর্ড",
    brandId: 7,
    subId: 5,
    childId: 10,
    image: IMAGES.keyboard1,
    short: "Low-profile illuminated keyboard for desk setups.",
    shortBd: "ডেস্ক সেটআপের জন্য লো-প্রোফাইল ইলুমিনেটেড কীবোর্ড।",
    skus: [
      { colorId: 4, variantId: 1, buy: 8500, sell: 12499, discount: 1000, stock: 15 },
    ],
  },
  {
    name: "Samsung T7 Shield 1TB SSD",
    nameBd: "স্যামসাং T7 শিল্ড ১TB SSD",
    brandId: 2,
    subId: 5,
    childId: 10,
    image: IMAGES.ssd1,
    short: "Rugged portable SSD for fast file backup and transfer.",
    shortBd: "দ্রুত ফাইল ব্যাকআপ ও ট্রান্সফারের জন্য রাগেড পোর্টেবল SSD।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 9000, sell: 13499, discount: 1000, stock: 20 },
      { colorId: 5, variantId: 1, buy: 9000, sell: 13499, discount: 1000, stock: 12 },
    ],
  },
  {
    name: "PlayStation DualSense Controller",
    nameBd: "প্লেস্টেশন DualSense কন্ট্রোলার",
    brandId: 3,
    subId: 6,
    childId: 11,
    image: IMAGES.game1,
    short: "Haptic feedback wireless controller for PS5 and PC.",
    shortBd: "PS5 ও PC-এর জন্য হ্যাপটিক ফিডব্যাক ওয়্যারলেস কন্ট্রোলার।",
    featured: 1,
    freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 28 },
      { colorId: 1, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 20 },
      { colorId: 7, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 10 },
    ],
  },
  {
    name: "Xiaomi Smart Camera C300",
    nameBd: "শাওমি স্মার্ট ক্যামেরা C300",
    brandId: 4,
    subId: 5,
    childId: 10,
    image: IMAGES.cam1,
    short: "2K home security camera with night vision and app alerts.",
    shortBd: "নাইট ভিশন ও অ্যাপ অ্যালার্টসহ ২K হোম সিকিউরিটি ক্যামেরা।",
    skus: [
      { colorId: 2, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 36 },
    ],
  },
  {
    name: "TP-Link AX3000 Wi-Fi 6 Router",
    nameBd: "টিপি-লিংক AX3000 Wi-Fi ৬ রাউটার",
    brandId: 4,
    subId: 5,
    childId: 10,
    image: IMAGES.router1,
    short: "Dual-band Wi-Fi 6 router for faster home networking.",
    shortBd: "দ্রুত হোম নেটওয়ার্কিংয়ের জন্য ডুয়াল-ব্যান্ড Wi-Fi ৬ রাউটার।",
    skus: [
      { colorId: 1, variantId: 1, buy: 4200, sell: 6499, discount: 500, stock: 24 },
    ],
  },
  {
    name: "Spigen Tough Armor Phone Case",
    nameBd: "স্পিজেন টাফ আর্মার ফোন কেস",
    brandId: 10,
    subId: 5,
    childId: 9,
    image: IMAGES.case1,
    short: "Military-grade drop protection case for popular phones.",
    shortBd: "জনপ্রিয় ফোনের জন্য মিলিটারি-গ্রেড ড্রপ প্রোটেকশন কেস।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 900, sell: 1699, discount: 200, stock: 70 },
      { colorId: 5, variantId: 1, buy: 900, sell: 1699, discount: 200, stock: 40 },
    ],
  },
  {
    name: "Aluminum Laptop Stand",
    nameBd: "অ্যালুমিনিয়াম ল্যাপটপ স্ট্যান্ড",
    brandId: 10,
    subId: 5,
    childId: 10,
    image: IMAGES.stand1,
    short: "Ergonomic desk stand that improves airflow and posture.",
    shortBd: "এয়ারফ্লো ও পোশ্চার উন্নত করে এমন এরগনমিক ডেস্ক স্ট্যান্ড।",
    skus: [
      { colorId: 3, variantId: 1, buy: 1200, sell: 2199, discount: 200, stock: 45 },
      { colorId: 4, variantId: 1, buy: 1200, sell: 2199, discount: 200, stock: 30 },
    ],
  },
  {
    name: "Anker Soundcore Life Q30",
    nameBd: "অ্যাংকার সাউন্ডকোর লাইফ Q30",
    brandId: 5,
    subId: 3,
    childId: 6,
    image: IMAGES.head2,
    short: "Hybrid ANC headphones with long playback time.",
    shortBd: "দীর্ঘ প্লেব্যাক টাইমসহ হাইব্রিড ANC হেডফোন।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 30 },
      { colorId: 5, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 18 },
    ],
  },
];

async function seedProducts(conn) {
  let productId = 1;
  let skuId = 1;
  let imageId = 1;

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    await q(
      conn,
      `INSERT INTO products (
        id, name, name_bd, slug, main_category_id, sub_category_id, child_category_id,
        brand_id, attribute_id, video_path, face_image, status, featured, free_delivery,
        best_deal, view_count, sell_count, avg_rating, review_count,
        short_description, long_description, meta_title, canonical_url, meta_description,
        meta_keywords, og_title, og_description, robots, has_single_product_page
      ) VALUES (
        ?,?,?,?,1,?,?, ?,1,NULL,?,1,?,?, ?,0,0,0.00,0,
        ?, ?, ?, NULL, ?, ?, ?, ?, 'index, follow', 0
      )`,
      [
        productId,
        p.name,
        p.nameBd,
        slug,
        p.subId,
        p.childId,
        p.brandId,
        p.image,
        p.featured ? 1 : 0,
        p.freeDelivery ? 1 : 0,
        p.bestDeal ? 1 : 0,
        p.short,
        `<p>${p.short}</p><p>${p.shortBd}</p>`,
        p.name,
        p.short,
        "tech, gadgets, electronics",
        p.name,
        p.short,
      ]
    );

    await q(
      conn,
      `INSERT INTO product_images (id, product_id, img_path, serial, sku_id) VALUES (?,?,?,?,NULL)`,
      [imageId++, productId, p.image, 1]
    );
    // second gallery angle (reuse nearby tech image for variety)
    await q(
      conn,
      `INSERT INTO product_images (id, product_id, img_path, serial, sku_id) VALUES (?,?,?,?,NULL)`,
      [imageId++, productId, p.image, 2]
    );

    let skuSerial = 1;
    for (const s of p.skus) {
      const skuCode = `TECH-${productId}-${s.colorId}-${s.variantId}-${skuSerial++}`;
      await q(
        conn,
        `INSERT INTO product_skus (
          id, product_id, color_id, variant_id, sku, weight_kg,
          buying_price, selling_price, discount, discount_type, stock, status, free_delivery
        ) VALUES (?,?,?,?,?,?,?,?,?,0,?,1,NULL)`,
        [
          skuId++,
          productId,
          s.colorId,
          s.variantId,
          skuCode,
          s.weight ?? 0.25,
          s.buy,
          s.sell,
          s.discount ?? 0,
          s.stock ?? 10,
        ]
      );
    }

    productId += 1;
  }

  return { products: productId - 1, skus: skuId - 1, images: imageId - 1 };
}

/** Replace fashion homepage banners with tech heroes + offer tiles. */
async function seedBanners(conn) {
  await q(conn, "SET FOREIGN_KEY_CHECKS=0");
  try {
    await q(conn, "DELETE FROM banners");
    await q(conn, "ALTER TABLE banners AUTO_INCREMENT = 1");
  } catch (e) {
    if (!String(e.message).includes("doesn't exist")) throw e;
  }
  await q(conn, "SET FOREIGN_KEY_CHECKS=1");

  // Home Top: first N-2 = carousel, last 2 = side panels (shop splitHeroBanners).
  // Home Middle: OfferBanners section.
  const banners = [
    {
      title: "Flagship Smartphones",
      zone: "Home Top",
      img: IMAGES.heroPhones,
      path: "/shop?sub=1",
    },
    {
      title: "Laptops Built for Speed",
      zone: "Home Top",
      img: IMAGES.heroLaptops,
      path: "/shop?sub=2",
    },
    {
      title: "Immersive Wireless Audio",
      zone: "Home Top",
      img: IMAGES.heroAudio,
      path: "/shop?sub=3",
    },
    {
      title: "Gaming Controllers",
      zone: "Home Top",
      img: IMAGES.heroGaming,
      path: "/shop?sub=6",
    },
    {
      title: "Desk Accessories",
      zone: "Home Top",
      img: IMAGES.heroAccess,
      path: "/shop?sub=5",
    },
    {
      title: "Wearables Flash Sale",
      zone: "Home Middle",
      img: IMAGES.offerWear,
      path: "/shop?sub=4",
    },
    {
      title: "Power & Desk Essentials",
      zone: "Home Middle",
      img: IMAGES.offerDesk,
      path: "/shop?sub=5",
    },
  ];

  let id = 1;
  for (const b of banners) {
    await q(
      conn,
      `INSERT INTO banners (id, title, zone, type, img_path, path, featured, status)
       VALUES (?,?,?,'Custom URL',?,?,1,1)`,
      [id++, b.title, b.zone, b.img, b.path]
    );
  }
  return banners.length;
}

/** Activate Hot Deals arena with discounted tech SKUs. */
async function seedMegaSale(conn) {
  const endAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const endSql = endAt.toISOString().slice(0, 19).replace("T", " ");

  try {
    await q(
      conn,
      `INSERT INTO mega_sale_settings (id, is_active, campaign_end_at)
       VALUES (1, 1, ?)
       ON DUPLICATE KEY UPDATE is_active=1, campaign_end_at=VALUES(campaign_end_at)`,
      [endSql]
    );
  } catch (e) {
    if (!String(e.message).includes("doesn't exist")) throw e;
    return 0;
  }

  // Prefer products already marked featured / best_deal.
  const [products] = await q(
    conn,
    `SELECT id FROM products WHERE status=1 AND (featured=1 OR best_deal=1) ORDER BY featured DESC, id ASC LIMIT 10`
  );

  let serial = 1;
  for (const p of products) {
    await q(
      conn,
      `INSERT INTO mega_sale_products (product_id, serial, is_active, end_at)
       VALUES (?,?,1,?)`,
      [p.id, serial++, endSql]
    );
  }
  return products.length;
}

async function main() {
  console.log(`==> Replacing catalog in ${cfg.database} @ ${cfg.host}:${cfg.port}`);
  const conn = await mysql.createConnection(cfg);
  try {
    await clearCatalog(conn);
    await seedTaxonomy(conn);
    const stats = await seedProducts(conn);
    const bannerCount = await seedBanners(conn);
    const megaCount = await seedMegaSale(conn);
    const [rows] = await q(conn, "SELECT id, name FROM products ORDER BY id LIMIT 8");
    console.log("✅ Tech catalog ready:", { ...stats, banners: bannerCount, megaSaleProducts: megaCount });
    console.log(
      "Sample products:",
      rows.map((r) => r.name).join(" | ")
    );
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
