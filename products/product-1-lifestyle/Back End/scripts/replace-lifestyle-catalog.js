/**
 * Replace fashion-only catalog rows with diverse lifestyle merchandise.
 *
 * SAFE SCOPE: only mutates catalog + homepage banners + mega sale in the TARGET database.
 * Does NOT touch fashion/tech product folders or their SQL dumps.
 *
 * After seeding remote Unsplash URLs, materializeImages() downloads each unique
 * URL once, converts to compact local WebP, and rewrites DB paths so the shop
 * never depends on Unsplash at runtime. Cached files under uploads/.life-seed-cache
 * let the script re-run offline.
 *
 * Usage:
 *   node scripts/replace-lifestyle-catalog.js
 *   DB_NAME=lifestyle_demo DB_HOST=127.0.0.1 DB_PORT=3430 DB_USER=root DB_PASSWORD=localdev2026 node scripts/replace-lifestyle-catalog.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const sharp = require("sharp");

const cfg = {
  host: process.env.DB_HOST || process.env.SHARED_DEMO_DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || process.env.SHARED_DEMO_DB_PORT || "3430", 10),
  user: process.env.DB_USER || process.env.SHARED_DEMO_DB_USER || "root",
  password:
    process.env.DB_PASSWORD ||
    process.env.DB_ROOT_PASSWORD ||
    process.env.SHARED_DEMO_DB_PASSWORD ||
    "localdev2026",
  database: process.env.DB_NAME || "lifestyle_demo",
};

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");
const IMAGE_CACHE_DIR = path.join(UPLOADS_ROOT, ".life-seed-cache");
const WEBP_QUALITY = 78;
const PRODUCT_MAX = 800;
const BANNER_MAX_W = 1600;
const BANNER_MAX_H = 900;

const U = "https://images.unsplash.com";
const img = (id, w = 900, h = 900) =>
  `${U}/${id}?w=${w}&h=${h}&fit=crop&q=85`;

/** Verified Unsplash lifestyle shots (unique photo ids where possible). */
const IMAGES = {
  sg1: img("photo-1572635196237-14b3f281503f"),
  sg2: img("photo-1511499767150-a48a237f0083"),
  sg3: img("photo-1473496169904-658ba7c44d8a"),
  sg4: img("photo-1577803645773-f96470509666"),
  sg5: img("photo-1574258495973-f010dfbb5371"),
  sg6: img("photo-1508296695146-257a814070b4"),
  w1: img("photo-1523275335684-37898b6baf30"),
  w2: img("photo-1524592094714-0f0654e20314"),
  w3: img("photo-1434056886845-dac89ffe9b56"),
  w4: img("photo-1522312346375-d1a52e2b99b3"),
  w5: img("photo-1508685096489-7aacd43bd3b1"),
  w6: img("photo-1547996160-81dfa63595aa"),
  w7: img("photo-1533139502658-0198f920d8e8"),
  w8: img("photo-1587836374828-4dbafa94cf0e"),
  sh1: img("photo-1542291026-7eec264c27ff"),
  sh2: img("photo-1549298916-b41d501d3772"),
  sh3: img("photo-1460353581641-37baddab0fa2"),
  sh4: img("photo-1595950653106-6c9ebd614d3a"),
  sh5: img("photo-1614252369475-531eba835eb1"),
  sh6: img("photo-1533867617858-e7b97e060509"),
  sh7: img("photo-1603487742131-4160ec999306"),
  sh8: img("photo-1560769629-975ec94e6a86"),
  ap1: img("photo-1521572163474-6864f9cf17ab"),
  ap2: img("photo-1489987707025-afc232f7ea0f"),
  ap3: img("photo-1434389677669-e08b4cac3105"),
  ap4: img("photo-1576566588028-4147f3842f27"),
  ap5: img("photo-1542272604-787c3835535d"),
  ap6: img("photo-1541099649105-f69ad21f3246"),
  ap7: img("photo-1624378439575-d8705ad7ae80"),
  ap8: img("photo-1596755094514-f87e34085b2c"),
  tie1: img("photo-1507679799987-c73779587ccf"),
  tie2: img("photo-1594938298603-c8148c4dae35"),
  tie3: img("photo-1617137968427-85924c800a22"),
  tie4: img("photo-1593032465175-481ac7f401a0"),
  bg1: img("photo-1553062407-98eeb64c6a62"),
  bg2: img("photo-1548036328-c9fa89d128fa"),
  bg3: img("photo-1566150905458-1bf1fc113f0d"),
  bg4: img("photo-1627123424574-724758594e93"),
  bg5: img("photo-1584917865442-de89df76afd3"),
  bg6: img("photo-1547949003-9792a18a2601"),
  jw1: img("photo-1617038260897-41a1f14a8ca0"),
  jw2: img("photo-1605100804763-247f67b3557e"),
  jw3: img("photo-1611591437281-460bfbe1220a"),
  jw4: img("photo-1573408301185-9146fe634ad0"),
  jw5: img("photo-1602173574767-37ac01994b2a"),
  jw6: img("photo-1535632066927-ab7c9ab60908"),
  fr1: img("photo-1541643600914-78b084683601"),
  fr2: img("photo-1523293182086-7651a899d37f"),
  fr3: img("photo-1587017539504-67cfbddac569"),
  fr4: img("photo-1611930022073-b7a4ba5fcccd"),
  fr5: img("photo-1556228578-0d85b1a4d571"),
  fr6: img("photo-1571781926291-c477ebfd024b"),
  ft1: img("photo-1599901860904-17e6ed7083a0"),
  ft2: img("photo-1544367567-0f2fcb009e0b"),
  ft3: img("photo-1602143407151-7111542de6e8"),
  ft4: img("photo-1575311373937-040b8e1fd5b6"),
  ft5: img("photo-1571019614242-c5c5dee9f50b"),
  hm1: img("photo-1495474472287-4d71bcdd2085"),
  hm2: img("photo-1586023492125-27b2c045efd7"),
  hm3: img("photo-1602143407151-7111542de6e8"),
  hm4: img("photo-1603006905003-be475563bc59"),
  hm5: img("photo-1467043237213-65f2da53396f"),
  heroSun: img("photo-1511499767150-a48a237f0083", 1600, 900),
  heroWatch: img("photo-1523275335684-37898b6baf30", 1600, 900),
  heroShoe: img("photo-1542291026-7eec264c27ff", 1600, 900),
  heroBag: img("photo-1553062407-98eeb64c6a62", 1600, 900),
  heroStyle: img("photo-1483985988355-763728e1935b", 1600, 900),
  heroFormal: img("photo-1507679799987-c73779587ccf", 1200, 900),
  offerJewel: img("photo-1617038260897-41a1f14a8ca0", 1200, 800),
  offerFrag: img("photo-1541643600914-78b084683601", 1200, 800),
  heroHome: img("photo-1586023492125-27b2c045efd7", 1600, 900),
  heroFit: img("photo-1544367567-0f2fcb009e0b", 1600, 900),
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
  // Same wipe list as the tech seed — catalog + banners + mega sale only.
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
  const colors = [
    [1, "Black", "কালো", "#111111"],
    [2, "White", "সাদা", "#FFFFFF"],
    [3, "Silver", "সিলভার", "#C0C0C0"],
    [4, "Gold", "গোল্ড", "#D4AF37"],
    [5, "Brown", "বাদামি", "#6D4C41"],
    [6, "Navy", "নেভি", "#1A237E"],
    [7, "Red", "লাল", "#C62828"],
    [8, "Beige", "বেজ", "#D7CCC8"],
  ];
  for (const [id, name, nameBd, hex] of colors) {
    await q(
      conn,
      `INSERT INTO colors (id, name, name_bd, hex, priority, status) VALUES (?,?,?,?,1,1)`,
      [id, name, nameBd, hex]
    );
  }

  // Size covers apparel, shoes, watch case, and one-size accessories.
  await q(
    conn,
    `INSERT INTO attributes (id, name, name_bd, priority, status) VALUES (1, 'Size', 'সাইজ', 1, 1)`
  );
  const variants = [
    [1, 1, "One Size", "ওয়ান সাইজ", 1],
    [2, 1, "S", "এস", 2],
    [3, 1, "M", "এম", 3],
    [4, 1, "L", "এল", 4],
    [5, 1, "XL", "এক্সএল", 5],
    [6, 1, "40mm", "৪০মিমি", 6],
    [7, 1, "42mm", "৪২মিমি", 7],
    [8, 1, "Size 42", "সাইজ ৪২", 8],
    [9, 1, "Size 43", "সাইজ ৪৩", 9],
  ];
  for (const [id, attrId, name, nameBd, serial] of variants) {
    await q(
      conn,
      `INSERT INTO variants (id, attribute_id, name, serial, name_bd, status) VALUES (?,?,?,?,?,1)`,
      [id, attrId, name, serial, nameBd]
    );
  }

  // Demo lifestyle brands — plausible store names, not a trademark dump.
  const brands = [
    [1, "Raylux"],
    [2, "Fossil"],
    [3, "Casio"],
    [4, "Nike"],
    [5, "Adidas"],
    [6, "Clarks"],
    [7, "Tommy"],
    [8, "Hugo"],
    [9, "MK Studio"],
    [10, "Pandra"],
    [11, "Noir Bloom"],
    [12, "Oakline"],
    [13, "FitPulse"],
    [14, "HomeNest"],
    [15, "UrbanStride"],
    [16, "TimeCraft"],
  ];
  for (const [id, name] of brands) {
    await q(
      conn,
      `INSERT INTO brands (id, name, img_path, priority, status) VALUES (?,?,NULL,1,1)`,
      [id, name]
    );
  }

  await q(
    conn,
    `INSERT INTO main_categories (id, name, name_bd, img_path, status, featured, priority)
     VALUES (1, 'Lifestyle', 'লাইফস্টাইল', ?, 1, 1, 3)`,
    [IMAGES.heroStyle]
  );

  const subs = [
    [1, 1, "Sunglasses & Eyewear", "সানগ্লাস ও চশমা", IMAGES.sg2, 1],
    [2, 1, "Watches", "ঘড়ি", IMAGES.w1, 1],
    [3, 1, "Footwear", "জুতো", IMAGES.sh1, 1],
    [4, 1, "Apparel", "পোশাক", IMAGES.ap2, 1],
    [5, 1, "Ties & Formal Accessories", "টাই ও ফরমাল এক্সেসরিজ", IMAGES.tie1, 1],
    [6, 1, "Bags & Travel", "ব্যাগ ও ট্রাভেল", IMAGES.bg1, 1],
    [7, 1, "Jewelry", "জুয়েলারি", IMAGES.jw1, 1],
    [8, 1, "Fragrance & Grooming", "ফ্র্যাগ্রেন্স ও গ্রুমিং", IMAGES.fr1, 1],
    [9, 1, "Fitness & Wearables", "ফিটনেস ও ওয়্যারেবল", IMAGES.ft2, 1],
    [10, 1, "Home Lifestyle", "হোম লাইফস্টাইল", IMAGES.hm2, 0],
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
    [1, 1, "Aviator Sunglasses", "এভিয়েটর সানগ্লাস", IMAGES.sg1],
    [2, 1, "Wayfarer Sunglasses", "ওয়েফেয়ারার সানগ্লাস", IMAGES.sg3],
    [3, 2, "Analog Watches", "অ্যানালগ ঘড়ি", IMAGES.w2],
    [4, 2, "Smart Watches", "স্মার্টওয়াচ", IMAGES.w5],
    [5, 2, "Luxury Watches", "লাক্সারি ঘড়ি", IMAGES.w6],
    [6, 3, "Sneakers", "স্নিকার্স", IMAGES.sh2],
    [7, 3, "Formal Shoes", "ফরমাল জুতো", IMAGES.sh6],
    [8, 3, "Sandals", "স্যান্ডেল", IMAGES.sh7],
    [9, 4, "Casual Tops", "ক্যাজুয়াল টপ", IMAGES.ap1],
    [10, 4, "Bottoms", "বটমস", IMAGES.ap5],
    [11, 5, "Neckties", "নেকটাই", IMAGES.tie2],
    [12, 5, "Bow Ties", "বো টাই", IMAGES.tie3],
    [13, 5, "Pocket Squares", "পকেট স্কয়ার", IMAGES.tie4],
    [14, 6, "Backpacks", "ব্যাকপ্যাক", IMAGES.bg1],
    [15, 6, "Tote Bags", "টোট ব্যাগ", IMAGES.bg3],
    [16, 6, "Wallets", "ওয়ালেট", IMAGES.bg4],
    [17, 7, "Rings", "রিং", IMAGES.jw2],
    [18, 7, "Necklaces", "নেকলেস", IMAGES.jw3],
    [19, 7, "Bracelets", "ব্রেসলেট", IMAGES.jw4],
    [20, 8, "Perfumes", "পারফিউম", IMAGES.fr1],
    [21, 8, "Skincare", "স্কিনকেয়ার", IMAGES.fr4],
    [22, 9, "Fitness Bands", "ফিটনেস ব্যান্ড", IMAGES.ft4],
    [23, 9, "Yoga & Studio", "যোগা ও স্টুডিও", IMAGES.ft1],
    [24, 10, "Drinkware & Decor", "ড্রিঙ্কওয়্যার ও ডেকোর", IMAGES.hm1],
  ];
  for (const [id, subId, name, nameBd, image] of children) {
    await q(
      conn,
      `INSERT INTO child_categories (id, sub_category_id, name, name_bd, img_path, status, featured, priority)
       VALUES (?,?,?,?,?,1,0,1)`,
      [id, subId, name, nameBd, image]
    );
  }
}

/**
 * @typedef {{
 *  name: string, nameBd: string, brandId: number,
 *  subId: number, childId: number, image: string, image2?: string,
 *  short: string, shortBd: string,
 *  featured?: number, bestDeal?: number, freeDelivery?: number,
 *  weight?: number,
 *  skus: Array<{colorId:number, variantId:number, buy:number, sell:number, discount?:number, stock?:number, weight?:number}>
 * }} LifeProduct
 */

/** @type {LifeProduct[]} */
const PRODUCTS = [
  // --- Aviator sunglasses (child 1) ---
  {
    name: "Raylux Aviator Classic Gold",
    nameBd: "রেইলাক্স এভিয়েটর ক্লাসিক গোল্ড",
    brandId: 1, subId: 1, childId: 1, image: IMAGES.sg1, image2: IMAGES.sg2,
    short: "Gold-frame aviator with gradient lenses for bright days.",
    shortBd: "উজ্জ্বল দিনের জন্য গ্রেডিয়েন্ট লেন্সসহ গোল্ড-ফ্রেম এভিয়েটর।",
    featured: 1, bestDeal: 1,
    weight: 0.04,
    skus: [
      { colorId: 4, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 22 },
      { colorId: 1, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 16 },
    ],
  },
  {
    name: "Oakline Aviator Polarized",
    nameBd: "ওকলাইন এভিয়েটর পোলারাইজড",
    brandId: 12, subId: 1, childId: 1, image: IMAGES.sg2, image2: IMAGES.sg4,
    short: "Polarized aviators that cut road glare for drivers.",
    shortBd: "ড্রাইভারদের রোড গ্লেয়ার কমায় এমন পোলারাইজড এভিয়েটর।",
    featured: 1, freeDelivery: 1,
    weight: 0.04,
    skus: [
      { colorId: 3, variantId: 1, buy: 3200, sell: 4999, discount: 500, stock: 18 },
      { colorId: 6, variantId: 1, buy: 3200, sell: 4999, discount: 500, stock: 10 },
    ],
  },
  {
    name: "Tommy Aviator Navy",
    nameBd: "টমি এভিয়েটর নেভি",
    brandId: 7, subId: 1, childId: 1, image: IMAGES.sg4, image2: IMAGES.sg1,
    short: "Navy metal aviator with a slim unisex fit.",
    shortBd: "স্লিম ইউনিসেক্স ফিটসহ নেভি মেটাল এভিয়েটর।",
    weight: 0.04,
    skus: [
      { colorId: 6, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 20 },
    ],
  },
  {
    name: "Raylux Aviator Blackout",
    nameBd: "রেইলাক্স এভিয়েটর ব্ল্যাকআউট",
    brandId: 1, subId: 1, childId: 1, image: IMAGES.sg6, image2: IMAGES.sg5,
    short: "All-black aviator with dark lenses for high sun.",
    shortBd: "তীব্র রোদের জন্য ডার্ক লেন্সসহ অল-ব্ল্যাক এভিয়েটর।",
    bestDeal: 1,
    weight: 0.04,
    skus: [
      { colorId: 1, variantId: 1, buy: 2600, sell: 3999, discount: 400, stock: 24 },
    ],
  },
  // --- Wayfarer sunglasses (child 2) ---
  {
    name: "Raylux Wayfarer Original",
    nameBd: "রেইলাক্স ওয়েফেয়ারার অরিজিনাল",
    brandId: 1, subId: 1, childId: 2, image: IMAGES.sg3, image2: IMAGES.sg5,
    short: "Classic acetate wayfarer for city and weekend wear.",
    shortBd: "সিটি ও উইকেন্ডের জন্য ক্লাসিক অ্যাসিটেট ওয়েফেয়ারার।",
    featured: 1,
    weight: 0.05,
    skus: [
      { colorId: 1, variantId: 1, buy: 2400, sell: 3799, discount: 300, stock: 26 },
      { colorId: 5, variantId: 1, buy: 2400, sell: 3799, discount: 300, stock: 14 },
    ],
  },
  {
    name: "Oakline Wayfarer Matte",
    nameBd: "ওকলাইন ওয়েফেয়ারার ম্যাট",
    brandId: 12, subId: 1, childId: 2, image: IMAGES.sg5, image2: IMAGES.sg3,
    short: "Matte wayfarer with UV400 lenses and a sturdy hinge.",
    shortBd: "UV400 লেন্স ও মজবুত হিঞ্জসহ ম্যাট ওয়েফেয়ারার।",
    freeDelivery: 1,
    weight: 0.05,
    skus: [
      { colorId: 1, variantId: 1, buy: 2100, sell: 3299, discount: 250, stock: 22 },
      { colorId: 6, variantId: 1, buy: 2100, sell: 3299, discount: 250, stock: 12 },
    ],
  },
  {
    name: "MK Studio Square Frame",
    nameBd: "এমকে স্টুডিও স্কয়ার ফ্রেম",
    brandId: 9, subId: 1, childId: 2, image: IMAGES.sg6, image2: IMAGES.sg2,
    short: "Oversized square sunglasses with a soft gold logo mark.",
    shortBd: "সফট গোল্ড লোগো মার্কসহ ওভারসাইজড স্কয়ার সানগ্লাস।",
    featured: 1, bestDeal: 1,
    weight: 0.05,
    skus: [
      { colorId: 1, variantId: 1, buy: 3500, sell: 5499, discount: 600, stock: 15 },
      { colorId: 4, variantId: 1, buy: 3500, sell: 5499, discount: 600, stock: 9 },
    ],
  },
  {
    name: "Tommy Everyday Wayfarer",
    nameBd: "টমি এভরিডে ওয়েফেয়ারার",
    brandId: 7, subId: 1, childId: 2, image: IMAGES.sg3, image2: IMAGES.sg1,
    short: "Lightweight everyday wayfarer in a unisex fit.",
    shortBd: "ইউনিসেক্স ফিটসহ হালকা দৈনন্দিন ওয়েফেয়ারার।",
    freeDelivery: 1,
    weight: 0.04,
    skus: [
      { colorId: 6, variantId: 1, buy: 1800, sell: 2799, discount: 200, stock: 30 },
      { colorId: 7, variantId: 1, buy: 1800, sell: 2799, discount: 200, stock: 12 },
    ],
  },
  // --- Analog watches (child 3) ---
  {
    name: "Fossil Grant Chronograph",
    nameBd: "ফসিল গ্রান্ট ক্রোনোগ্রাফ",
    brandId: 2, subId: 2, childId: 3, image: IMAGES.w2, image2: IMAGES.w3,
    short: "Leather-strap chronograph for workdays and dinners.",
    shortBd: "কর্মদিবস ও ডিনারের জন্য লেদার-স্ট্র্যাপ ক্রোনোগ্রাফ।",
    featured: 1,
    weight: 0.08,
    skus: [
      { colorId: 5, variantId: 7, buy: 8500, sell: 12499, discount: 1000, stock: 14 },
      { colorId: 1, variantId: 6, buy: 8500, sell: 12499, discount: 1000, stock: 10 },
    ],
  },
  {
    name: "Casio MTP Analog Classic",
    nameBd: "ক্যাসিও এমটিপি অ্যানালগ ক্লাসিক",
    brandId: 3, subId: 2, childId: 3, image: IMAGES.w3, image2: IMAGES.w4,
    short: "Reliable everyday analog with a mineral glass face.",
    shortBd: "মিনারেল গ্লাস ফেসসহ নির্ভরযোগ্য দৈনন্দিন অ্যানালগ।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.07,
    skus: [
      { colorId: 3, variantId: 6, buy: 2200, sell: 3499, discount: 300, stock: 40 },
      { colorId: 4, variantId: 6, buy: 2200, sell: 3499, discount: 300, stock: 22 },
    ],
  },
  {
    name: "TimeCraft Field Watch",
    nameBd: "টাইমক্রাফট ফিল্ড ওয়াচ",
    brandId: 16, subId: 2, childId: 3, image: IMAGES.w4, image2: IMAGES.w7,
    short: "Date-window field watch with a NATO-style strap.",
    shortBd: "NATO-স্টাইল স্ট্র্যাপসহ ডেট-উইন্ডো ফিল্ড ওয়াচ।",
    weight: 0.08,
    skus: [
      { colorId: 6, variantId: 7, buy: 4200, sell: 6499, discount: 500, stock: 18 },
      { colorId: 5, variantId: 7, buy: 4200, sell: 6499, discount: 500, stock: 12 },
    ],
  },
  {
    name: "Tommy Dress Analog",
    nameBd: "টমি ড্রেস অ্যানালগ",
    brandId: 7, subId: 2, childId: 3, image: IMAGES.w7, image2: IMAGES.w2,
    short: "Slim dress watch that sits clean under a cuff.",
    shortBd: "কাফের নিচে পরিচ্ছন্ন দেখায় এমন স্লিম ড্রেস ওয়াচ।",
    featured: 1,
    weight: 0.06,
    skus: [
      { colorId: 3, variantId: 6, buy: 5500, sell: 8499, discount: 700, stock: 16 },
    ],
  },
  // --- Smart watches (child 4) ---
  {
    name: "FitPulse Active Watch",
    nameBd: "ফিটপালস অ্যাকটিভ ওয়াচ",
    brandId: 13, subId: 2, childId: 4, image: IMAGES.w5, image2: IMAGES.w1,
    short: "Round smartwatch with heart-rate and sleep scores.",
    shortBd: "হার্ট-রেট ও স্লিপ স্কোরসহ রাউন্ড স্মার্টওয়াচ।",
    featured: 1, bestDeal: 1,
    weight: 0.05,
    skus: [
      { colorId: 1, variantId: 7, buy: 6500, sell: 9999, discount: 800, stock: 20 },
      { colorId: 3, variantId: 6, buy: 6500, sell: 9999, discount: 800, stock: 14 },
    ],
  },
  {
    name: "Fossil Hybrid HR",
    nameBd: "ফসিল হাইব্রিড এইচআর",
    brandId: 2, subId: 2, childId: 4, image: IMAGES.w1, image2: IMAGES.w8,
    short: "Analog hands plus hidden notifications and steps.",
    shortBd: "অ্যানালগ হ্যান্ডসের সাথে লুকানো নোটিফিকেশন ও স্টেপ।",
    freeDelivery: 1,
    weight: 0.07,
    skus: [
      { colorId: 5, variantId: 7, buy: 9800, sell: 13999, discount: 1200, stock: 12 },
    ],
  },
  {
    name: "Casio G-Smart Lite",
    nameBd: "ক্যাসিও জি-স্মার্ট লাইট",
    brandId: 3, subId: 2, childId: 4, image: IMAGES.w8, image2: IMAGES.w5,
    short: "Rugged smartwatch with long battery for travel days.",
    shortBd: "ট্রাভেল দিনের জন্য দীর্ঘ ব্যাটারির রাগেড স্মার্টওয়াচ।",
    weight: 0.09,
    skus: [
      { colorId: 1, variantId: 7, buy: 7200, sell: 10999, discount: 900, stock: 15 },
      { colorId: 7, variantId: 7, buy: 7200, sell: 10999, discount: 900, stock: 8 },
    ],
  },
  // --- Luxury watches (child 5) ---
  {
    name: "TimeCraft Gold Automatic",
    nameBd: "টাইমক্রাফট গোল্ড অটোমেটিক",
    brandId: 16, subId: 2, childId: 5, image: IMAGES.w6, image2: IMAGES.w8,
    short: "Exhibition-back automatic with a gold-tone bracelet.",
    shortBd: "গোল্ড-টোন ব্রেসলেটসহ এক্সিবিশন-ব্যাক অটোমেটিক।",
    featured: 1,
    weight: 0.12,
    skus: [
      { colorId: 4, variantId: 7, buy: 18000, sell: 24999, discount: 2000, stock: 6 },
      { colorId: 3, variantId: 7, buy: 18000, sell: 24999, discount: 2000, stock: 4 },
    ],
  },
  {
    name: "Hugo Prestige Watch",
    nameBd: "হিউগো প্রেস্টিজ ওয়াচ",
    brandId: 8, subId: 2, childId: 5, image: IMAGES.w8, image2: IMAGES.w6,
    short: "Minimal luxury face with a polished link bracelet.",
    shortBd: "পলিশড লিংক ব্রেসলেটসহ মিনিমাল লাক্সারি ফেস।",
    featured: 1, bestDeal: 1,
    weight: 0.11,
    skus: [
      { colorId: 1, variantId: 7, buy: 22000, sell: 29999, discount: 2500, stock: 7 },
    ],
  },
  {
    name: "MK Studio Lexington",
    nameBd: "এমকে স্টুডিও লেক্সিংটন",
    brandId: 9, subId: 2, childId: 5, image: IMAGES.w6, image2: IMAGES.w3,
    short: "Pavé bezel dress watch for evenings and gifts.",
    shortBd: "সন্ধ্যা ও উপহারের জন্য পাভে বেজেল ড্রেস ওয়াচ।",
    weight: 0.1,
    skus: [
      { colorId: 4, variantId: 6, buy: 14000, sell: 19999, discount: 1500, stock: 9 },
      { colorId: 3, variantId: 6, buy: 14000, sell: 19999, discount: 1500, stock: 6 },
    ],
  },
  // --- Sneakers (child 6) ---
  {
    name: "Nike Court Runner",
    nameBd: "নাইকি কোর্ট রানার",
    brandId: 4, subId: 3, childId: 6, image: IMAGES.sh1, image2: IMAGES.sh3,
    short: "Cushioned court sneaker for walks and light training.",
    shortBd: "হাঁটা ও হালকা ট্রেনিংয়ের জন্য কুশনড কোর্ট স্নিকার।",
    featured: 1, bestDeal: 1,
    weight: 0.7,
    skus: [
      { colorId: 1, variantId: 8, buy: 5500, sell: 8499, discount: 700, stock: 18 },
      { colorId: 2, variantId: 9, buy: 5500, sell: 8499, discount: 700, stock: 14 },
      { colorId: 7, variantId: 8, buy: 5500, sell: 8499, discount: 700, stock: 10 },
    ],
  },
  {
    name: "Adidas Street Boost",
    nameBd: "অ্যাডিডাস স্ট্রিট বুস্ট",
    brandId: 5, subId: 3, childId: 6, image: IMAGES.sh3, image2: IMAGES.sh4,
    short: "Everyday boost sneaker with a knit upper.",
    shortBd: "নিট আপারসহ দৈনন্দিন বুস্ট স্নিকার।",
    featured: 1, freeDelivery: 1,
    weight: 0.65,
    skus: [
      { colorId: 1, variantId: 8, buy: 6200, sell: 9499, discount: 800, stock: 16 },
      { colorId: 2, variantId: 9, buy: 6200, sell: 9499, discount: 800, stock: 12 },
    ],
  },
  {
    name: "UrbanStride Daily Kick",
    nameBd: "আরবানস্ট্রাইড ডেইলি কিক",
    brandId: 15, subId: 3, childId: 6, image: IMAGES.sh2, image2: IMAGES.sh8,
    short: "Retro runner that pairs with jeans and chinos.",
    shortBd: "জিন্স ও চিনোর সাথে মানা রেট্রো রানার।",
    bestDeal: 1,
    weight: 0.68,
    skus: [
      { colorId: 2, variantId: 8, buy: 2800, sell: 4299, discount: 400, stock: 28 },
      { colorId: 5, variantId: 9, buy: 2800, sell: 4299, discount: 400, stock: 16 },
    ],
  },
  {
    name: "Tommy Casual Sneaker",
    nameBd: "টমি ক্যাজুয়াল স্নিকার",
    brandId: 7, subId: 3, childId: 6, image: IMAGES.sh4, image2: IMAGES.sh2,
    short: "Clean leather sneaker for smart-casual outfits.",
    shortBd: "স্মার্ট-ক্যাজুয়াল আউটফিটের জন্য পরিচ্ছন্ন লেদার স্নিকার।",
    weight: 0.72,
    skus: [
      { colorId: 2, variantId: 8, buy: 4800, sell: 7299, discount: 600, stock: 14 },
      { colorId: 6, variantId: 9, buy: 4800, sell: 7299, discount: 600, stock: 10 },
    ],
  },
  // --- Formal shoes (child 7) ---
  {
    name: "Clarks Oxford Leather",
    nameBd: "ক্লার্কস অক্সফোর্ড লেদার",
    brandId: 6, subId: 3, childId: 7, image: IMAGES.sh6, image2: IMAGES.sh5,
    short: "Cap-toe oxford that holds a shine for office days.",
    shortBd: "অফিস দিনের জন্য শাইন ধরে রাখে এমন ক্যাপ-টো অক্সফোর্ড।",
    featured: 1,
    weight: 0.85,
    skus: [
      { colorId: 1, variantId: 8, buy: 7200, sell: 10999, discount: 900, stock: 12 },
      { colorId: 5, variantId: 9, buy: 7200, sell: 10999, discount: 900, stock: 10 },
    ],
  },
  {
    name: "Hugo Formal Derby",
    nameBd: "হিউগো ফরমাল ডার্বি",
    brandId: 8, subId: 3, childId: 7, image: IMAGES.sh5, image2: IMAGES.sh6,
    short: "Open-lacing derby with a cushioned insole.",
    shortBd: "কুশনড ইনসোলসহ ওপেন-লেসিং ডার্বি।",
    bestDeal: 1,
    weight: 0.88,
    skus: [
      { colorId: 1, variantId: 8, buy: 8500, sell: 12999, discount: 1000, stock: 9 },
      { colorId: 5, variantId: 9, buy: 8500, sell: 12999, discount: 1000, stock: 7 },
    ],
  },
  {
    name: "Clarks Monk Strap",
    nameBd: "ক্লার্কস মাঙ্ক স্ট্র্যাপ",
    brandId: 6, subId: 3, childId: 7, image: IMAGES.sh6, image2: IMAGES.sh8,
    short: "Single-buckle monk strap for dinners and weddings.",
    shortBd: "ডিনার ও বিয়ের জন্য সিঙ্গেল-বাকল মাঙ্ক স্ট্র্যাপ।",
    freeDelivery: 1,
    weight: 0.86,
    skus: [
      { colorId: 5, variantId: 8, buy: 7800, sell: 11999, discount: 1000, stock: 8 },
    ],
  },
  // --- Sandals (child 8) ---
  {
    name: "Clarks Weekend Sandal",
    nameBd: "ক্লার্কস উইকেন্ড স্যান্ডেল",
    brandId: 6, subId: 3, childId: 8, image: IMAGES.sh7, image2: IMAGES.sh8,
    short: "Adjustable leather sandal for warm-weather walks.",
    shortBd: "গরম আবহাওয়ায় হাঁটার জন্য অ্যাডজাস্টেবল লেদার স্যান্ডেল।",
    freeDelivery: 1,
    weight: 0.45,
    skus: [
      { colorId: 5, variantId: 8, buy: 2800, sell: 4299, discount: 350, stock: 20 },
      { colorId: 8, variantId: 9, buy: 2800, sell: 4299, discount: 350, stock: 14 },
    ],
  },
  {
    name: "UrbanStride Slide",
    nameBd: "আরবানস্ট্রাইড স্লাইড",
    brandId: 15, subId: 3, childId: 8, image: IMAGES.sh8, image2: IMAGES.sh7,
    short: "Cloud-foam slide for home, gym, and short trips.",
    shortBd: "বাড়ি, জিম ও ছোট ভ্রমণের জন্য ক্লাউড-ফোম স্লাইড।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.35,
    skus: [
      { colorId: 1, variantId: 8, buy: 900, sell: 1499, discount: 150, stock: 40 },
      { colorId: 2, variantId: 9, buy: 900, sell: 1499, discount: 150, stock: 28 },
    ],
  },
  {
    name: "Adidas Comfort Slide",
    nameBd: "অ্যাডিডাস কমফোর্ট স্লাইড",
    brandId: 5, subId: 3, childId: 8, image: IMAGES.sh7, image2: IMAGES.sh4,
    short: "Contoured slide with a quick-dry footbed.",
    shortBd: "কুইক-ড্রাই ফুটবেডসহ কনটুর্ড স্লাইড।",
    weight: 0.36,
    skus: [
      { colorId: 1, variantId: 8, buy: 1600, sell: 2499, discount: 200, stock: 26 },
      { colorId: 6, variantId: 9, buy: 1600, sell: 2499, discount: 200, stock: 16 },
    ],
  },
  // --- Casual tops (child 9) ---
  {
    name: "Nike Dri-Fit Tee",
    nameBd: "নাইকি ড্রাই-ফিট টি",
    brandId: 4, subId: 4, childId: 9, image: IMAGES.ap1, image2: IMAGES.ap4,
    short: "Breathable training tee that wicks sweat fast.",
    shortBd: "ঘাম দ্রুত শোষে এমন ব্রিদেবল ট্রেনিং টি।",
    featured: 1, freeDelivery: 1,
    weight: 0.18,
    skus: [
      { colorId: 1, variantId: 3, buy: 1400, sell: 2299, discount: 200, stock: 30 },
      { colorId: 2, variantId: 4, buy: 1400, sell: 2299, discount: 200, stock: 22 },
      { colorId: 6, variantId: 5, buy: 1400, sell: 2299, discount: 200, stock: 14 },
    ],
  },
  {
    name: "Adidas Essentials Hoodie",
    nameBd: "অ্যাডিডাস এসেনশিয়ালস হুডি",
    brandId: 5, subId: 4, childId: 9, image: IMAGES.ap3, image2: IMAGES.ap2,
    short: "Soft fleece hoodie for commute and weekend rest days.",
    shortBd: "যাতায়াত ও উইকেন্ড বিশ্রামের জন্য সফট ফ্লিস হুডি।",
    featured: 1,
    weight: 0.45,
    skus: [
      { colorId: 1, variantId: 3, buy: 3200, sell: 4999, discount: 400, stock: 18 },
      { colorId: 6, variantId: 4, buy: 3200, sell: 4999, discount: 400, stock: 14 },
      { colorId: 4, variantId: 2, buy: 3200, sell: 4999, discount: 400, stock: 8 },
    ],
  },
  {
    name: "Tommy Oxford Shirt",
    nameBd: "টমি অক্সফোর্ড শার্ট",
    brandId: 7, subId: 4, childId: 9, image: IMAGES.ap8, image2: IMAGES.ap2,
    short: "Button-down oxford that works with chinos or jeans.",
    shortBd: "চিনো বা জিন্সের সাথে চলে এমন বাটন-ডাউন অক্সফোর্ড।",
    bestDeal: 1,
    weight: 0.28,
    skus: [
      { colorId: 2, variantId: 3, buy: 2600, sell: 3999, discount: 350, stock: 20 },
      { colorId: 6, variantId: 4, buy: 2600, sell: 3999, discount: 350, stock: 16 },
      { colorId: 8, variantId: 5, buy: 2600, sell: 3999, discount: 350, stock: 10 },
    ],
  },
  {
    name: "Hugo Slim Polo",
    nameBd: "হিউগো স্লিম পোলো",
    brandId: 8, subId: 4, childId: 9, image: IMAGES.ap4, image2: IMAGES.ap1,
    short: "Pique polo with a slim collar for smart Fridays.",
    shortBd: "স্মার্ট ফ্রাইডের জন্য স্লিম কলারসহ পিকে পোলো।",
    weight: 0.22,
    skus: [
      { colorId: 6, variantId: 3, buy: 2400, sell: 3699, discount: 300, stock: 16 },
      { colorId: 1, variantId: 4, buy: 2400, sell: 3699, discount: 300, stock: 12 },
    ],
  },
  {
    name: "UrbanStride Linen Shirt",
    nameBd: "আরবানস্ট্রাইড লিনেন শার্ট",
    brandId: 15, subId: 4, childId: 9, image: IMAGES.ap2, image2: IMAGES.ap8,
    short: "Breathable linen shirt for humid Dhaka evenings.",
    shortBd: "ঢাকার আর্দ্র সন্ধ্যার জন্য ব্রিদেবল লিনেন শার্ট।",
    freeDelivery: 1,
    weight: 0.24,
    skus: [
      { colorId: 8, variantId: 3, buy: 1800, sell: 2799, discount: 250, stock: 22 },
      { colorId: 2, variantId: 4, buy: 1800, sell: 2799, discount: 250, stock: 18 },
    ],
  },
  // --- Bottoms (child 10) ---
  {
    name: "Tommy Chino Trouser",
    nameBd: "টমি চিনো ট্রাউজার",
    brandId: 7, subId: 4, childId: 10, image: IMAGES.ap7, image2: IMAGES.ap5,
    short: "Tapered chino with stretch for all-day comfort.",
    shortBd: "সারাদিনের আরামের জন্য স্ট্রেচসহ টেপার্ড চিনো।",
    featured: 1,
    weight: 0.4,
    skus: [
      { colorId: 8, variantId: 3, buy: 2200, sell: 3499, discount: 300, stock: 18 },
      { colorId: 6, variantId: 4, buy: 2200, sell: 3499, discount: 300, stock: 16 },
      { colorId: 1, variantId: 5, buy: 2200, sell: 3499, discount: 300, stock: 10 },
    ],
  },
  {
    name: "Adidas Track Pant",
    nameBd: "অ্যাডিডাস ট্র্যাক প্যান্ট",
    brandId: 5, subId: 4, childId: 10, image: IMAGES.ap7, image2: IMAGES.ap3,
    short: "Tapered track pant with zip pockets for travel.",
    shortBd: "ট্রাভেলের জন্য জিপ পকেটসহ টেপার্ড ট্র্যাক প্যান্ট।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.32,
    skus: [
      { colorId: 1, variantId: 3, buy: 2100, sell: 3299, discount: 250, stock: 24 },
      { colorId: 6, variantId: 4, buy: 2100, sell: 3299, discount: 250, stock: 16 },
    ],
  },
  {
    name: "UrbanStride Stretch Jean",
    nameBd: "আরবানস্ট্রাইড স্ট্রেচ জিন",
    brandId: 15, subId: 4, childId: 10, image: IMAGES.ap5, image2: IMAGES.ap6,
    short: "Mid-rise stretch jean that keeps its shape.",
    shortBd: "আকৃতি ধরে রাখে এমন মিড-রাইজ স্ট্রেচ জিন।",
    weight: 0.5,
    skus: [
      { colorId: 6, variantId: 3, buy: 2400, sell: 3799, discount: 300, stock: 20 },
      { colorId: 1, variantId: 4, buy: 2400, sell: 3799, discount: 300, stock: 14 },
    ],
  },
  // --- Neckties (child 11) ---
  {
    name: "Hugo Silk Necktie",
    nameBd: "হিউগো সিল্ক নেকটাই",
    brandId: 8, subId: 5, childId: 11, image: IMAGES.tie2, image2: IMAGES.tie1,
    short: "Hand-finished silk tie with a quiet woven pattern.",
    shortBd: "শান্ত বোনা প্যাটার্নসহ হ্যান্ড-ফিনিশড সিল্ক টাই।",
    featured: 1,
    weight: 0.06,
    skus: [
      { colorId: 6, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 24 },
      { colorId: 7, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 12 },
    ],
  },
  {
    name: "Tommy Stripe Tie",
    nameBd: "টমি স্ট্রাইপ টাই",
    brandId: 7, subId: 5, childId: 11, image: IMAGES.tie1, image2: IMAGES.tie2,
    short: "Diagonal stripe necktie that brightens a navy suit.",
    shortBd: "নেভি স্যুট উজ্জ্বল করে এমন তির্যক স্ট্রাইপ নেকটাই।",
    freeDelivery: 1,
    weight: 0.06,
    skus: [
      { colorId: 6, variantId: 1, buy: 1100, sell: 1799, discount: 150, stock: 28 },
      { colorId: 7, variantId: 1, buy: 1100, sell: 1799, discount: 150, stock: 16 },
    ],
  },
  {
    name: "TimeCraft Navy Tie",
    nameBd: "টাইমক্রাফট নেভি টাই",
    brandId: 16, subId: 5, childId: 11, image: IMAGES.tie4, image2: IMAGES.tie2,
    short: "Matte navy tie for interviews and evening events.",
    shortBd: "ইন্টারভিউ ও সন্ধ্যার অনুষ্ঠানের জন্য ম্যাট নেভি টাই।",
    bestDeal: 1,
    weight: 0.06,
    skus: [
      { colorId: 6, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 32 },
    ],
  },
  // --- Bow ties (child 12) ---
  {
    name: "Hugo Satin Bow Tie",
    nameBd: "হিউগো স্যাটিন বো টাই",
    brandId: 8, subId: 5, childId: 12, image: IMAGES.tie3, image2: IMAGES.tie1,
    short: "Pre-tied satin bow for weddings and galas.",
    shortBd: "বিয়ে ও গালার জন্য প্রি-টাইড স্যাটিন বো।",
    featured: 1,
    weight: 0.04,
    skus: [
      { colorId: 1, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 18 },
      { colorId: 7, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 10 },
    ],
  },
  {
    name: "Tommy Velvet Bow",
    nameBd: "টমি ভেলভেট বো",
    brandId: 7, subId: 5, childId: 12, image: IMAGES.tie3, image2: IMAGES.tie4,
    short: "Soft velvet bow tie for winter formal nights.",
    shortBd: "শীতের ফরমাল রাতের জন্য সফট ভেলভেট বো টাই।",
    weight: 0.04,
    skus: [
      { colorId: 6, variantId: 1, buy: 1200, sell: 1899, discount: 150, stock: 14 },
    ],
  },
  // --- Pocket squares (child 13) ---
  {
    name: "Hugo Pocket Square Set",
    nameBd: "হিউগো পকেট স্কয়ার সেট",
    brandId: 8, subId: 5, childId: 13, image: IMAGES.tie4, image2: IMAGES.tie1,
    short: "Three silk squares in navy, ivory, and wine.",
    shortBd: "নেভি, আইভরি ও ওয়াইন—তিনটি সিল্ক পকেট স্কয়ার।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.03,
    skus: [
      { colorId: 6, variantId: 1, buy: 800, sell: 1299, discount: 100, stock: 26 },
    ],
  },
  {
    name: "Tommy Linen Pocket Square",
    nameBd: "টমি লিনেন পকেট স্কয়ার",
    brandId: 7, subId: 5, childId: 13, image: IMAGES.tie4, image2: IMAGES.tie2,
    short: "Textured linen square for relaxed summer suits.",
    shortBd: "গ্রীষ্মের আরামদায়ক স্যুটের জন্য টেক্সচার্ড লিনেন স্কয়ার।",
    weight: 0.02,
    skus: [
      { colorId: 8, variantId: 1, buy: 500, sell: 899, discount: 80, stock: 34 },
      { colorId: 2, variantId: 1, buy: 500, sell: 899, discount: 80, stock: 20 },
    ],
  },
  // --- Backpacks (child 14) ---
  {
    name: "Nike Heritage Backpack",
    nameBd: "নাইকি হেরিটেজ ব্যাকপ্যাক",
    brandId: 4, subId: 6, childId: 14, image: IMAGES.bg1, image2: IMAGES.bg2,
    short: "Laptop sleeve backpack for campus and office commutes.",
    shortBd: "ক্যাম্পাস ও অফিস যাতায়াতের জন্য ল্যাপটপ স্লিভ ব্যাকপ্যাক।",
    featured: 1, freeDelivery: 1,
    weight: 0.55,
    skus: [
      { colorId: 1, variantId: 1, buy: 2800, sell: 4299, discount: 400, stock: 22 },
      { colorId: 6, variantId: 1, buy: 2800, sell: 4299, discount: 400, stock: 12 },
    ],
  },
  {
    name: "Adidas Classic Backpack",
    nameBd: "অ্যাডিডাস ক্লাসিক ব্যাকপ্যাক",
    brandId: 5, subId: 6, childId: 14, image: IMAGES.bg2, image2: IMAGES.bg1,
    short: "Roomy daypack with a padded back panel.",
    shortBd: "প্যাডেড ব্যাক প্যানেলসহ রুমি ডেপ্যাক।",
    bestDeal: 1,
    weight: 0.52,
    skus: [
      { colorId: 1, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 20 },
      { colorId: 7, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 10 },
    ],
  },
  {
    name: "UrbanStride Travel Pack",
    nameBd: "আরবানস্ট্রাইড ট্রাভেল প্যাক",
    brandId: 15, subId: 6, childId: 14, image: IMAGES.bg6, image2: IMAGES.bg1,
    short: "Carry-on travel pack with hidden anti-theft zip.",
    shortBd: "লুকানো অ্যান্টি-থেফট জিপসহ ক্যারি-অন ট্রাভেল প্যাক।",
    featured: 1,
    weight: 0.7,
    skus: [
      { colorId: 1, variantId: 1, buy: 3500, sell: 5499, discount: 500, stock: 14 },
      { colorId: 5, variantId: 1, buy: 3500, sell: 5499, discount: 500, stock: 8 },
    ],
  },
  // --- Totes (child 15) ---
  {
    name: "MK Studio Leather Tote",
    nameBd: "এমকে স্টুডিও লেদার টোট",
    brandId: 9, subId: 6, childId: 15, image: IMAGES.bg5, image2: IMAGES.bg3,
    short: "Structured leather tote that fits a 14-inch laptop.",
    shortBd: "১৪ ইঞ্চি ল্যাপটপ ধরে এমন স্ট্রাকচার্ড লেদার টোট।",
    featured: 1, bestDeal: 1,
    weight: 0.8,
    skus: [
      { colorId: 5, variantId: 1, buy: 8500, sell: 12999, discount: 1200, stock: 10 },
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1200, stock: 7 },
    ],
  },
  {
    name: "Tommy Canvas Tote",
    nameBd: "টমি ক্যানভাস টোট",
    brandId: 7, subId: 6, childId: 15, image: IMAGES.bg3, image2: IMAGES.bg5,
    short: "Everyday canvas tote with an inner zip pocket.",
    shortBd: "ভেতরের জিপ পকেটসহ দৈনন্দিন ক্যানভাস টোট।",
    freeDelivery: 1,
    weight: 0.35,
    skus: [
      { colorId: 8, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 24 },
      { colorId: 6, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 14 },
    ],
  },
  {
    name: "HomeNest Market Tote",
    nameBd: "হোমনেস্ট মার্কেট টোট",
    brandId: 14, subId: 6, childId: 15, image: IMAGES.bg3, image2: IMAGES.bg6,
    short: "Fold-flat market tote for groceries and weekend shops.",
    shortBd: "বাজার ও উইকেন্ড শপিংয়ের জন্য ভাঁজ করা যায় এমন মার্কেট টোট।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.22,
    skus: [
      { colorId: 8, variantId: 1, buy: 700, sell: 1199, discount: 100, stock: 40 },
      { colorId: 6, variantId: 1, buy: 700, sell: 1199, discount: 100, stock: 22 },
    ],
  },
  // --- Wallets (child 16) ---
  {
    name: "Fossil Bifold Wallet",
    nameBd: "ফসিল বাইফোল্ড ওয়ালেট",
    brandId: 2, subId: 6, childId: 16, image: IMAGES.bg4, image2: IMAGES.bg5,
    short: "Slim bifold with RFID lining and a coin pocket.",
    shortBd: "RFID লাইনিং ও কয়েন পকেটসহ স্লিম বাইফোল্ড।",
    featured: 1,
    weight: 0.08,
    skus: [
      { colorId: 5, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 26 },
      { colorId: 1, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 18 },
    ],
  },
  {
    name: "Hugo Card Holder",
    nameBd: "হিউগো কার্ড হোল্ডার",
    brandId: 8, subId: 6, childId: 16, image: IMAGES.bg4, image2: IMAGES.bg2,
    short: "Six-slot card holder that fits a front pocket.",
    shortBd: "সামনের পকেটে যায় এমন ছয়-স্লট কার্ড হোল্ডার।",
    freeDelivery: 1,
    weight: 0.04,
    skus: [
      { colorId: 1, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 30 },
      { colorId: 5, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 16 },
    ],
  },
  {
    name: "MK Studio Zip Wallet",
    nameBd: "এমকে স্টুডিও জিপ ওয়ালেট",
    brandId: 9, subId: 6, childId: 16, image: IMAGES.bg5, image2: IMAGES.bg4,
    short: "Zip-around wallet with a phone slip and coin purse.",
    shortBd: "ফোন স্লিপ ও কয়েন পার্সসহ জিপ-অ্যারাউন্ড ওয়ালেট।",
    bestDeal: 1,
    weight: 0.15,
    skus: [
      { colorId: 5, variantId: 1, buy: 3800, sell: 5799, discount: 500, stock: 14 },
      { colorId: 1, variantId: 1, buy: 3800, sell: 5799, discount: 500, stock: 9 },
    ],
  },
  // --- Rings (child 17) ---
  {
    name: "Pandra Stack Ring",
    nameBd: "প্যান্ড্রা স্ট্যাক রিং",
    brandId: 10, subId: 7, childId: 17, image: IMAGES.jw2, image2: IMAGES.jw1,
    short: "Polished stack ring that mixes with everyday bands.",
    shortBd: "দৈনন্দিন ব্যান্ডের সাথে মেশে এমন পলিশড স্ট্যাক রিং।",
    featured: 1, freeDelivery: 1,
    weight: 0.01,
    skus: [
      { colorId: 3, variantId: 2, buy: 1800, sell: 2799, discount: 250, stock: 20 },
      { colorId: 4, variantId: 3, buy: 1800, sell: 2799, discount: 250, stock: 16 },
    ],
  },
  {
    name: "MK Studio Signet Ring",
    nameBd: "এমকে স্টুডিও সিগনেট রিং",
    brandId: 9, subId: 7, childId: 17, image: IMAGES.jw5, image2: IMAGES.jw2,
    short: "Oval signet with a brushed face for daily wear.",
    shortBd: "দৈনন্দিন পরার জন্য ব্রাশড ফেসসহ ওভাল সিগনেট।",
    weight: 0.02,
    skus: [
      { colorId: 4, variantId: 3, buy: 3200, sell: 4999, discount: 400, stock: 12 },
      { colorId: 3, variantId: 4, buy: 3200, sell: 4999, discount: 400, stock: 8 },
    ],
  },
  {
    name: "TimeCraft Steel Band Ring",
    nameBd: "টাইমক্রাফট স্টিল ব্যান্ড রিং",
    brandId: 16, subId: 7, childId: 17, image: IMAGES.jw2, image2: IMAGES.jw6,
    short: "Minimal steel band that pairs with a watch.",
    shortBd: "ঘড়ির সাথে মানা মিনিমাল স্টিল ব্যান্ড।",
    bestDeal: 1,
    weight: 0.01,
    skus: [
      { colorId: 3, variantId: 3, buy: 900, sell: 1499, discount: 150, stock: 28 },
      { colorId: 1, variantId: 4, buy: 900, sell: 1499, discount: 150, stock: 18 },
    ],
  },
  // --- Necklaces (child 18) ---
  {
    name: "Pandra Heart Pendant",
    nameBd: "প্যান্ড্রা হার্ট পেন্ডেন্ট",
    brandId: 10, subId: 7, childId: 18, image: IMAGES.jw3, image2: IMAGES.jw1,
    short: "Delicate heart pendant on an adjustable chain.",
    shortBd: "অ্যাডজাস্টেবল চেইনে সূক্ষ্ম হার্ট পেন্ডেন্ট।",
    featured: 1,
    weight: 0.02,
    skus: [
      { colorId: 3, variantId: 1, buy: 2800, sell: 4299, discount: 400, stock: 18 },
      { colorId: 4, variantId: 1, buy: 2800, sell: 4299, discount: 400, stock: 12 },
    ],
  },
  {
    name: "MK Studio Chain Necklace",
    nameBd: "এমকে স্টুডিও চেইন নেকলেস",
    brandId: 9, subId: 7, childId: 18, image: IMAGES.jw6, image2: IMAGES.jw3,
    short: "Layered chain necklace for open collars and dresses.",
    shortBd: "ওপেন কলার ও ড্রেসের জন্য লেয়ার্ড চেইন নেকলেস।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.03,
    skus: [
      { colorId: 4, variantId: 1, buy: 3500, sell: 5499, discount: 500, stock: 14 },
      { colorId: 3, variantId: 1, buy: 3500, sell: 5499, discount: 500, stock: 10 },
    ],
  },
  {
    name: "Pandra Pearl Strand",
    nameBd: "প্যান্ড্রা পার্ল স্ট্র্যান্ড",
    brandId: 10, subId: 7, childId: 18, image: IMAGES.jw1, image2: IMAGES.jw6,
    short: "Classic pearl strand with a discreet clasp.",
    shortBd: "ডিসক্রিট ক্ল্যাসপসহ ক্লাসিক পার্ল স্ট্র্যান্ড।",
    featured: 1,
    weight: 0.04,
    skus: [
      { colorId: 2, variantId: 1, buy: 4200, sell: 6499, discount: 600, stock: 10 },
    ],
  },
  // --- Bracelets (child 19) ---
  {
    name: "Pandra Charm Bracelet",
    nameBd: "প্যান্ড্রা চার্ম ব্রেসলেট",
    brandId: 10, subId: 7, childId: 19, image: IMAGES.jw4, image2: IMAGES.jw1,
    short: "Link bracelet ready for everyday charms.",
    shortBd: "দৈনন্দিন চার্মের জন্য রেডি লিংক ব্রেসলেট।",
    featured: 1, bestDeal: 1,
    weight: 0.03,
    skus: [
      { colorId: 3, variantId: 1, buy: 3800, sell: 5799, discount: 500, stock: 16 },
      { colorId: 4, variantId: 1, buy: 3800, sell: 5799, discount: 500, stock: 10 },
    ],
  },
  {
    name: "Fossil Leather Cuff",
    nameBd: "ফসিল লেদার কাফ",
    brandId: 2, subId: 7, childId: 19, image: IMAGES.jw4, image2: IMAGES.w3,
    short: "Wrap leather cuff with a snap closure.",
    shortBd: "স্ন্যাপ ক্লোজারসহ র‍্যাপ লেদার কাফ।",
    freeDelivery: 1,
    weight: 0.04,
    skus: [
      { colorId: 5, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 20 },
      { colorId: 1, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 12 },
    ],
  },
  {
    name: "MK Studio Tennis Bracelet",
    nameBd: "এমকে স্টুডিও টেনিস ব্রেসলেট",
    brandId: 9, subId: 7, childId: 19, image: IMAGES.jw5, image2: IMAGES.jw4,
    short: "Sparkling tennis line that sits flat on the wrist.",
    shortBd: "কবজিতে সমান বসে এমন স্পার্কলিং টেনিস লাইন।",
    weight: 0.02,
    skus: [
      { colorId: 3, variantId: 1, buy: 4500, sell: 6999, discount: 600, stock: 11 },
    ],
  },
  // --- Perfumes (child 20) ---
  {
    name: "Noir Bloom Eau de Parfum",
    nameBd: "নয়ার ব্লুম ও দ্য পারফিউম",
    brandId: 11, subId: 8, childId: 20, image: IMAGES.fr1, image2: IMAGES.fr2,
    short: "Floral-woody EDP for day meetings and dinners.",
    shortBd: "দিনের মিটিং ও ডিনারের জন্য ফ্লোরাল-উডি ইডিপি।",
    featured: 1, bestDeal: 1,
    weight: 0.22,
    skus: [
      { colorId: 1, variantId: 1, buy: 4200, sell: 6499, discount: 600, stock: 20 },
    ],
  },
  {
    name: "Hugo Scent Pour Homme",
    nameBd: "হিউগো সেন্ট পুর হোম",
    brandId: 8, subId: 8, childId: 20, image: IMAGES.fr2, image2: IMAGES.fr3,
    short: "Fresh aromatic cologne with citrus top notes.",
    shortBd: "সাইট্রাস টপ নোটসহ ফ্রেশ অ্যারোমেটিক কোলোন।",
    featured: 1, freeDelivery: 1,
    weight: 0.24,
    skus: [
      { colorId: 6, variantId: 1, buy: 3500, sell: 5499, discount: 500, stock: 18 },
    ],
  },
  {
    name: "Tommy Fresh Cologne",
    nameBd: "টমি ফ্রেশ কোলোন",
    brandId: 7, subId: 8, childId: 20, image: IMAGES.fr3, image2: IMAGES.fr1,
    short: "Clean everyday cologne that is office-safe.",
    shortBd: "অফিসে নিরাপদ এমন পরিচ্ছন্ন দৈনন্দিন কোলোন।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.2,
    skus: [
      { colorId: 2, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 26 },
    ],
  },
  {
    name: "MK Studio Bloom Mist",
    nameBd: "এমকে স্টুডিও ব্লুম মিস্ট",
    brandId: 9, subId: 8, childId: 20, image: IMAGES.fr2, image2: IMAGES.fr5,
    short: "Soft floral body mist for warm afternoons.",
    shortBd: "উষ্ণ বিকেলের জন্য সফট ফ্লোরাল বডি মিস্ট।",
    weight: 0.18,
    skus: [
      { colorId: 7, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 22 },
    ],
  },
  {
    name: "Noir Bloom Night Intense",
    nameBd: "নয়ার ব্লুম নাইট ইনটেন্স",
    brandId: 11, subId: 8, childId: 20, image: IMAGES.fr1, image2: IMAGES.fr3,
    short: "Deeper night scent with amber and vanilla.",
    shortBd: "অ্যাম্বার ও ভ্যানিলাসহ গভীর রাতের সুবাস।",
    featured: 1,
    weight: 0.23,
    skus: [
      { colorId: 1, variantId: 1, buy: 4800, sell: 7499, discount: 700, stock: 14 },
    ],
  },
  // --- Skincare (child 21) ---
  {
    name: "Noir Bloom Face Serum",
    nameBd: "নয়ার ব্লুম ফেস সিরাম",
    brandId: 11, subId: 8, childId: 21, image: IMAGES.fr4, image2: IMAGES.fr6,
    short: "Lightweight serum for morning glow under sunscreen.",
    shortBd: "সানস্ক্রিনের নিচে সকালের গ্লোর জন্য হালকা সিরাম।",
    featured: 1, freeDelivery: 1,
    weight: 0.12,
    skus: [
      { colorId: 2, variantId: 1, buy: 1800, sell: 2799, discount: 250, stock: 28 },
    ],
  },
  {
    name: "HomeNest Daily Moisturizer",
    nameBd: "হোমনেস্ট ডেইলি ময়েশ্চারাইজার",
    brandId: 14, subId: 8, childId: 21, image: IMAGES.fr6, image2: IMAGES.fr4,
    short: "Non-greasy daily cream for humid climates.",
    shortBd: "আর্দ্র আবহাওয়ার জন্য নন-গ্রিসি দৈনন্দিন ক্রিম।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.16,
    skus: [
      { colorId: 2, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 36 },
    ],
  },
  {
    name: "FitPulse After-Sun Gel",
    nameBd: "ফিটপালস আফটার-সান জেল",
    brandId: 13, subId: 8, childId: 21, image: IMAGES.fr5, image2: IMAGES.fr6,
    short: "Cooling aloe gel after outdoor training or travel.",
    shortBd: "আউটডোর ট্রেনিং বা ট্রাভেলের পর কুলিং অ্যালো জেল।",
    weight: 0.2,
    skus: [
      { colorId: 6, variantId: 1, buy: 600, sell: 999, discount: 80, stock: 40 },
    ],
  },
  // --- Fitness bands (child 22) ---
  {
    name: "FitPulse Band 3",
    nameBd: "ফিটপালস ব্যান্ড ৩",
    brandId: 13, subId: 9, childId: 22, image: IMAGES.ft4, image2: IMAGES.w5,
    short: "Slim fitness band with sleep scores and long battery.",
    shortBd: "স্লিপ স্কোর ও দীর্ঘ ব্যাটারির স্লিম ফিটনেস ব্যান্ড।",
    featured: 1, bestDeal: 1, freeDelivery: 1,
    weight: 0.03,
    skus: [
      { colorId: 1, variantId: 1, buy: 1800, sell: 2799, discount: 250, stock: 40 },
      { colorId: 7, variantId: 1, buy: 1800, sell: 2799, discount: 250, stock: 22 },
    ],
  },
  {
    name: "Casio Step Band",
    nameBd: "ক্যাসিও স্টেপ ব্যান্ড",
    brandId: 3, subId: 9, childId: 22, image: IMAGES.ft4, image2: IMAGES.ft5,
    short: "Simple step-and-heart band that lasts two weeks.",
    shortBd: "দুই সপ্তাহ চলে এমন সিম্পল স্টেপ-অ্যান্ড-হার্ট ব্যান্ড।",
    freeDelivery: 1,
    weight: 0.03,
    skus: [
      { colorId: 1, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 32 },
      { colorId: 6, variantId: 1, buy: 1400, sell: 2199, discount: 200, stock: 16 },
    ],
  },
  {
    name: "FitPulse Heart Band",
    nameBd: "ফিটপালস হার্ট ব্যান্ড",
    brandId: 13, subId: 9, childId: 22, image: IMAGES.w5, image2: IMAGES.ft4,
    short: "AMOLED band with 24-hour heart tracking.",
    shortBd: "২৪ ঘণ্টা হার্ট ট্র্যাকিংসহ AMOLED ব্যান্ড।",
    featured: 1,
    weight: 0.03,
    skus: [
      { colorId: 1, variantId: 1, buy: 2400, sell: 3699, discount: 300, stock: 24 },
      { colorId: 3, variantId: 1, buy: 2400, sell: 3699, discount: 300, stock: 12 },
    ],
  },
  // --- Yoga & studio (child 23) ---
  {
    name: "FitPulse Yoga Mat Pro",
    nameBd: "ফিটপালস যোগা ম্যাট প্রো",
    brandId: 13, subId: 9, childId: 23, image: IMAGES.ft1, image2: IMAGES.ft2,
    short: "Non-slip 6mm mat with a carry strap.",
    shortBd: "ক্যারি স্ট্র্যাপসহ নন-স্লিপ ৬মিমি ম্যাট।",
    featured: 1, freeDelivery: 1,
    weight: 1.1,
    skus: [
      { colorId: 6, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 22 },
      { colorId: 7, variantId: 1, buy: 1600, sell: 2499, discount: 200, stock: 14 },
    ],
  },
  {
    name: "HomeNest Cork Yoga Mat",
    nameBd: "হোমনেস্ট কর্ক যোগা ম্যাট",
    brandId: 14, subId: 9, childId: 23, image: IMAGES.ft2, image2: IMAGES.ft1,
    short: "Natural cork surface that grips better as you sweat.",
    shortBd: "ঘামলে আরও গ্রিপ হয় এমন ন্যাচারাল কর্ক সারফেস।",
    bestDeal: 1,
    weight: 1.3,
    skus: [
      { colorId: 8, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 16 },
    ],
  },
  {
    name: "FitPulse Resistance Set",
    nameBd: "ফিটপালস রেজিস্ট্যান্স সেট",
    brandId: 13, subId: 9, childId: 23, image: IMAGES.ft5, image2: IMAGES.ft2,
    short: "Three-band home set with door anchor and handles.",
    shortBd: "ডোর অ্যাঙ্কর ও হ্যান্ডেলসহ তিন-ব্যান্ড হোম সেট।",
    freeDelivery: 1,
    weight: 0.45,
    skus: [
      { colorId: 1, variantId: 1, buy: 1100, sell: 1799, discount: 150, stock: 28 },
    ],
  },
  // --- Drinkware & decor (child 24) ---
  {
    name: "HomeNest Ceramic Mug Set",
    nameBd: "হোমনেস্ট সিরামিক মাগ সেট",
    brandId: 14, subId: 10, childId: 24, image: IMAGES.hm1, image2: IMAGES.hm2,
    short: "Set of two stoneware mugs for morning tea.",
    shortBd: "সকালের চায়ের জন্য দুইটি স্টোনওয়্যার মাগ।",
    featured: 1, freeDelivery: 1,
    weight: 0.7,
    skus: [
      { colorId: 8, variantId: 1, buy: 800, sell: 1299, discount: 100, stock: 30 },
      { colorId: 2, variantId: 1, buy: 800, sell: 1299, discount: 100, stock: 18 },
    ],
  },
  {
    name: "HomeNest Soy Candle",
    nameBd: "হোমনেস্ট সয়া ক্যান্ডেল",
    brandId: 14, subId: 10, childId: 24, image: IMAGES.hm4, image2: IMAGES.hm2,
    short: "Slow-burn soy candle with a sandalwood scent.",
    shortBd: "চন্দন সুবাসের স্লো-বার্ন সয়া ক্যান্ডেল।",
    bestDeal: 1, freeDelivery: 1,
    weight: 0.35,
    skus: [
      { colorId: 8, variantId: 1, buy: 700, sell: 1199, discount: 100, stock: 36 },
      { colorId: 5, variantId: 1, buy: 700, sell: 1199, discount: 100, stock: 20 },
    ],
  },
  {
    name: "UrbanStride Steel Bottle",
    nameBd: "আরবানস্ট্রাইড স্টিল বোতল",
    brandId: 15, subId: 10, childId: 24, image: IMAGES.hm3, image2: IMAGES.ft3,
    short: "Insulated 750ml bottle that keeps water cold all day.",
    shortBd: "সারাদিন পানি ঠান্ডা রাখে এমন ইনসুলেটেড ৭৫০মিলি বোতল।",
    featured: 1, bestDeal: 1,
    weight: 0.38,
    skus: [
      { colorId: 3, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 32 },
      { colorId: 1, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 24 },
      { colorId: 6, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 16 },
    ],
  },
  {
    name: "HomeNest Table Vase",
    nameBd: "হোমনেস্ট টেবিল ভেজ",
    brandId: 14, subId: 10, childId: 24, image: IMAGES.hm5, image2: IMAGES.hm2,
    short: "Matte ceramic vase for a single stem or dried grass.",
    shortBd: "একটি স্টেম বা শুকনো ঘাসের জন্য ম্যাট সিরামিক ভেজ।",
    weight: 0.55,
    skus: [
      { colorId: 8, variantId: 1, buy: 1100, sell: 1799, discount: 150, stock: 18 },
      { colorId: 2, variantId: 1, buy: 1100, sell: 1799, discount: 150, stock: 12 },
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
        "lifestyle, accessories, watches, bags, fragrance",
        p.name,
        p.short,
      ]
    );

    await q(
      conn,
      `INSERT INTO product_images (id, product_id, img_path, serial, sku_id) VALUES (?,?,?,?,NULL)`,
      [imageId++, productId, p.image, 1]
    );
    // Second gallery angle — prefer a distinct shot so the PDP is not a duplicate.
    await q(
      conn,
      `INSERT INTO product_images (id, product_id, img_path, serial, sku_id) VALUES (?,?,?,?,NULL)`,
      [imageId++, productId, p.image2 || p.image, 2]
    );

    let skuSerial = 1;
    for (const s of p.skus) {
      const skuCode = `LIFE-${productId}-${s.colorId}-${s.variantId}-${skuSerial++}`;
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
          s.weight ?? p.weight ?? 0.25,
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

/** Replace fashion homepage banners with lifestyle heroes + offer tiles. */
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
  // Keep 5 Home Top so existing carousel/side split stays intact.
  const banners = [
    { title: "Sunglasses Season", zone: "Home Top", img: IMAGES.heroSun, path: "/shop?sub=1" },
    { title: "Watches That Travel", zone: "Home Top", img: IMAGES.heroWatch, path: "/shop?sub=2" },
    { title: "Everyday Footwear", zone: "Home Top", img: IMAGES.heroShoe, path: "/shop?sub=3" },
    { title: "Bags for the Week", zone: "Home Top", img: IMAGES.heroBag, path: "/shop?sub=6" },
    { title: "Formal Finishing", zone: "Home Top", img: IMAGES.heroFormal, path: "/shop?sub=5" },
    { title: "Jewelry Flash Sale", zone: "Home Middle", img: IMAGES.offerJewel, path: "/shop?sub=7" },
    { title: "Fragrance Edit", zone: "Home Middle", img: IMAGES.offerFrag, path: "/shop?sub=8" },
    { title: "Home Lifestyle", zone: "Home Middle", img: IMAGES.heroHome, path: "/shop?sub=10" },
    { title: "Studio & Fitness", zone: "Home Middle", img: IMAGES.heroFit, path: "/shop?sub=9" },
    { title: "Style Essentials", zone: "Home Middle", img: IMAGES.heroStyle, path: "/shop?sub=4" },
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

/** Activate Hot Deals arena with discounted lifestyle SKUs. */
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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function urlHash(url) {
  return crypto.createHash("sha1").update(String(url)).digest("hex");
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function fileSizeOk(absPath) {
  try {
    const st = fs.statSync(absPath);
    return st.isFile() && st.size > 1024;
  } catch {
    return false;
  }
}

function downloadRemote(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("http://") ? http : https;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": "LifestyleSeed/1.0 (catalog image materializer)",
          Accept: "image/*,*/*;q=0.8",
        },
        timeout: 25000,
      },
      (res) => {
        const code = res.statusCode || 0;
        if (code >= 300 && code < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          downloadRemote(next, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        if (code !== 200) {
          res.resume();
          reject(new Error(`HTTP ${code} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error(`Timeout downloading ${url}`));
    });
    req.on("error", reject);
  });
}

/**
 * Download each unique remote URL once. Persist the raw bytes so a later
 * offline re-run can still rebuild WebP files without hitting Unsplash.
 */
async function fetchUniqueBuffer(url, memCache, stats) {
  if (memCache.has(url)) return memCache.get(url);

  ensureDir(IMAGE_CACHE_DIR);
  const cacheFile = path.join(IMAGE_CACHE_DIR, `${urlHash(url)}.bin`);
  if (fileSizeOk(cacheFile)) {
    const cached = fs.readFileSync(cacheFile);
    memCache.set(url, cached);
    stats.cacheHits += 1;
    return cached;
  }

  const buf = await downloadRemote(url);
  if (!buf || buf.length < 512) {
    throw new Error(`Tiny download (${buf ? buf.length : 0} bytes) for ${url}`);
  }
  fs.writeFileSync(cacheFile, buf);
  memCache.set(url, buf);
  stats.downloads += 1;
  return buf;
}

async function writeWebp(absPath, sourceBuf, maxW, maxH) {
  ensureDir(path.dirname(absPath));
  if (fileSizeOk(absPath)) return { skipped: true, bytes: fs.statSync(absPath).size };

  // rotate() applies EXIF orientation then strips metadata on WebP encode.
  await sharp(sourceBuf)
    .rotate()
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(absPath);

  return { skipped: false, bytes: fs.statSync(absPath).size };
}

function publicToAbs(publicPath) {
  return path.join(UPLOADS_ROOT, String(publicPath).replace(/^\/uploads\/?/, "").replace(/\//g, path.sep));
}

/**
 * Rewrite remote catalog/banner paths to compact local WebP under uploads/.
 * Failed downloads reuse the last good lifestyle buffer so rows never stay remote-only.
 */
async function materializeImages(conn) {
  ensureDir(UPLOADS_ROOT);
  const memCache = new Map();
  const stats = { downloads: 0, cacheHits: 0, wrote: 0, skipped: 0, fallbacks: 0, failures: [] };
  let lastGoodBuf = null;

  async function sourceFor(url) {
    try {
      const buf = await fetchUniqueBuffer(url, memCache, stats);
      lastGoodBuf = buf;
      return buf;
    } catch (err) {
      stats.failures.push(`${url} -> ${err.message}`);
      console.warn("  image download failed:", err.message);
      if (lastGoodBuf) {
        stats.fallbacks += 1;
        return lastGoodBuf;
      }
      // Last resort: reuse any already-written lifestyle webp so the row is still local.
      const fallbackDirs = ["products", "faceimage", "banners", "categories"];
      for (const rel of fallbackDirs) {
        const dir = path.join(UPLOADS_ROOT, rel);
        if (!fs.existsSync(dir)) continue;
        const hit = walkFirstWebp(dir);
        if (hit) {
          stats.fallbacks += 1;
          lastGoodBuf = fs.readFileSync(hit);
          return lastGoodBuf;
        }
      }
      throw err;
    }
  }

  async function convertRow(remoteUrl, publicPath, maxW, maxH) {
    const abs = publicToAbs(publicPath);
    let buf = null;
    if (isRemoteUrl(remoteUrl)) {
      buf = await sourceFor(remoteUrl);
    } else if (fileSizeOk(abs)) {
      stats.skipped += 1;
      return publicPath;
    } else if (lastGoodBuf) {
      buf = lastGoodBuf;
      stats.fallbacks += 1;
    } else {
      throw new Error(`No source image for ${publicPath}`);
    }

    const result = await writeWebp(abs, buf, maxW, maxH);
    if (result.skipped) stats.skipped += 1;
    else stats.wrote += 1;
    return publicPath;
  }

  const [products] = await q(conn, "SELECT id, slug, face_image FROM products ORDER BY id");
  for (const row of products) {
    const local = `/uploads/faceimage/face_life_${row.id}.webp`;
    const pathOut = await convertRow(row.face_image, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.face_image) {
      await q(conn, "UPDATE products SET face_image=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [gallery] = await q(conn, "SELECT id, product_id, img_path, serial FROM product_images ORDER BY id");
  const [slugRows] = await q(conn, "SELECT id, slug FROM products");
  const slugById = new Map(slugRows.map((r) => [r.id, r.slug || `product-${r.id}`]));
  for (const row of gallery) {
    const slug = slugById.get(row.product_id) || `product-${row.product_id}`;
    const local = `/uploads/products/life_${slug}_${row.serial}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE product_images SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [mains] = await q(conn, "SELECT id, img_path FROM main_categories");
  for (const row of mains) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/main/life_main_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE main_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [subs] = await q(conn, "SELECT id, img_path FROM sub_categories");
  for (const row of subs) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/sub/life_sub_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE sub_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [children] = await q(conn, "SELECT id, img_path FROM child_categories");
  for (const row of children) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/child/life_child_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE child_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [banners] = await q(conn, "SELECT id, img_path FROM banners");
  for (const row of banners) {
    if (!row.img_path) continue;
    const local = `/uploads/banners/life_hero_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, BANNER_MAX_W, BANNER_MAX_H);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE banners SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  return stats;
}

function walkFirstWebp(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.name.endsWith(".webp") && fileSizeOk(full)) return full;
    }
  }
  return null;
}

async function printVerify(conn) {
  const [[counts]] = await q(
    conn,
    `SELECT
      (SELECT COUNT(*) FROM main_categories) AS mains,
      (SELECT COUNT(*) FROM sub_categories) AS subs,
      (SELECT COUNT(*) FROM child_categories) AS children,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM product_skus) AS skus,
      (SELECT COUNT(*) FROM product_images) AS images,
      (SELECT COUNT(*) FROM brands) AS brands,
      (SELECT COUNT(*) FROM banners) AS banners`
  );
  const [faces] = await q(conn, "SELECT id, name, face_image FROM products ORDER BY id LIMIT 3");
  const [[remoteLeft]] = await q(
    conn,
    `SELECT COUNT(*) AS n FROM products WHERE face_image NOT LIKE '/uploads/%'`
  );

  console.log("Verify counts:", counts);
  console.log("face_image starting with /uploads/:", remoteLeft.n === 0 ? "ALL" : `MISSING ${remoteLeft.n}`);
  for (const p of faces) {
    const abs = publicToAbs(p.face_image);
    const size = fileSizeOk(abs) ? fs.statSync(abs).size : 0;
    console.log(`  #${p.id} ${p.name}`);
    console.log(`     ${p.face_image}  (${size} bytes, exists=${fileSizeOk(abs)})`);
  }
  return { counts, samples: faces };
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
    console.log("Catalog rows inserted:", { ...stats, banners: bannerCount, megaSaleProducts: megaCount });

    console.log("==> Materializing local WebP under", UPLOADS_ROOT);
    const imgStats = await materializeImages(conn);
    console.log("Image materialize:", imgStats);
    if (imgStats.failures.length) {
      console.log("Download failures (fell back):", imgStats.failures.length);
    }

    await printVerify(conn);
    console.log(`✅ Lifestyle catalog ready on ${cfg.database} (${PRODUCTS.length} products in seed)`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
