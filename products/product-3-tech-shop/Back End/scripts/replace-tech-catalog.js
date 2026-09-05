/**
 * Replace fashion catalog rows with authentic tech/gadget products.
 *
 * SAFE SCOPE: only mutates catalog + homepage banners + mega sale in the TARGET database.
 * Does NOT edit myecomv2.sql dumps for lifestyle/fashion.
 *
 * After seeding remote Unsplash URLs, materializeImages() downloads each unique
 * URL once, converts to compact local WebP, and rewrites DB paths so the shop
 * never depends on Unsplash at runtime. Cached files under uploads/ let the
 * script re-run offline.
 *
 * Usage:
 *   node replace-tech-catalog.js
 *   DB_NAME=techshop_demo DB_HOST=127.0.0.1 DB_PORT=3430 DB_USER=root DB_PASSWORD=localdev2026 node replace-tech-catalog.js
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
  database: process.env.DB_NAME || "techshop_demo",
};

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");
const IMAGE_CACHE_DIR = path.join(UPLOADS_ROOT, ".tech-seed-cache");
const WEBP_QUALITY = 78;
const PRODUCT_MAX = 800;
const BANNER_MAX_W = 1600;
const BANNER_MAX_H = 900;

const U = "https://images.unsplash.com";
const img = (id, w = 900, h = 900) =>
  `${U}/${id}?w=${w}&h=${h}&fit=crop&q=85`;

/** Verified Unsplash tech shots (unique photo ids where possible). */
const IMAGES = {
  phone1: img("photo-1511707171634-5f897ff02aa9"),
  phone2: img("photo-1510557880182-3d4d3cba35a5"),
  phone3: img("photo-1592750475338-74b7b21085ab"),
  phone4: img("photo-1592899677977-9c10ca588bbd"),
  phone5: img("photo-1580910051074-3eb694886505"),
  phone6: img("photo-1610945265064-0e34e5519bbf"),
  phone7: img("photo-1556656793-08538906a9f8"),
  phone8: img("photo-1565849904461-04a58ad377e0"),
  phone9: img("photo-1574944985070-8f3ebc6b79d2"),
  phone10: img("photo-1610945415295-d9bbf067e59c"),
  phone11: img("photo-1523206489230-c012c64b2b48"),
  phone12: img("photo-1512499617640-c74ae3a79d37"),
  phone13: img("photo-1585060544812-6b45742d762f"),
  phone14: img("photo-1588508065123-287b28e013da"),
  laptop1: img("photo-1496181133206-80ce9b88a853"),
  laptop2: img("photo-1525547719571-a2d4ac8945e2"),
  laptop3: img("photo-1517336714731-489689fd1ca8"),
  laptop4: img("photo-1486312338219-ce68d2c6f44d"),
  laptop5: img("photo-1541807084-5c52b6b3adef"),
  laptop6: img("photo-1611186871348-b1ce696e52c9"),
  laptop7: img("photo-1498050108023-c5249f4df085"),
  laptop8: img("photo-1588872657578-7efd1f1555ed"),
  laptop9: img("photo-1593642634315-48f5414c3ad9"),
  laptop10: img("photo-1593642634367-d91a135587b5"),
  laptop11: img("photo-1484788984921-03950022c9ef"),
  tablet1: img("photo-1544244015-0df4b3ffc6b0"),
  tablet2: img("photo-1561154464-82e9adf32764"),
  tablet3: img("photo-1498049794561-7780e7231661"),
  buds1: img("photo-1590658268037-6bf12165a8df"),
  buds2: img("photo-1606220945770-b5b6c2c55bf1"),
  buds3: img("photo-1590650046871-92c887180603"),
  buds4: img("photo-1606220945770-b5b6c2c55bf1"),
  buds5: img("photo-1590650046871-92c887180603"),
  head1: img("photo-1505740420928-5e560c06d30e"),
  head2: img("photo-1484704849700-f032a568e944"),
  head3: img("photo-1546435770-a3e426bf472b"),
  head4: img("photo-1487215078519-e21cc028cb29"),
  head5: img("photo-1505740106531-4243f3831c78"),
  watch1: img("photo-1434493789847-2f02dc6ca35d"),
  watch2: img("photo-1579586337278-3befd40fd17a"),
  watch3: img("photo-1523275335684-37898b6baf30"),
  watch4: img("photo-1508685096489-7aacd43bd3b1"),
  watch5: img("photo-1461141346587-763ab02bced9"),
  band1: img("photo-1575311373937-040b8e1fd5b6"),
  charge1: img("photo-1625948515291-69613efd103f"),
  charge2: img("photo-1572569511254-d8f925fe2cbb"),
  charge3: img("photo-1555617981-dac3880eac6e"),
  charge4: img("photo-1555617981-dac3880eac6e"),
  power1: img("photo-1609091839311-d5365f9ff1c5"),
  power2: img("photo-1510017803434-a899398421b3"),
  cable1: img("photo-1625948515291-69613efd103f"),
  speaker1: img("photo-1608043152269-423dbba4e7e1"),
  speaker2: img("photo-1600294037681-c80b4cb5b434"),
  speaker3: img("photo-1545454675-3531b543be5d"),
  speaker4: img("photo-1543512214-318c7553f230"),
  mouse1: img("photo-1527864550417-7fd91fc51a46"),
  mouse2: img("photo-1527814050087-3793815479db"),
  mouse3: img("photo-1629429407756-446d66f5b24e"),
  keyboard1: img("photo-1587829741301-dc798b83add3"),
  keyboard2: img("photo-1511467687858-23d96c32e4ae"),
  keyboard3: img("photo-1563297007-0686b7003af7"),
  keyboard4: img("photo-1552820728-8b83bb6b773f"),
  cam1: img("photo-1516035069371-29a1b244cc32"),
  cam2: img("photo-1510127034890-ba27508e9f1c"),
  cam3: img("photo-1606983340126-99ab4feaa64a"),
  cam4: img("photo-1495707902641-75cac588d2e9"),
  cam5: img("photo-1510127034890-ba27508e9f1c"),
  cam6: img("photo-1495707902641-75cac588d2e9"),
  action1: img("photo-1574717024653-61fd2cf4d44d"),
  action2: img("photo-1616423640778-28d1b53229bd"),
  action3: img("photo-1574717024653-61fd2cf4d44d"),
  game1: img("photo-1606144042614-b2417e99c4e3"),
  game2: img("photo-1527814050087-3793815479db"),
  game3: img("photo-1600080972464-8e5f35f63d08"),
  game4: img("photo-1552820728-8b83bb6b773f"),
  game5: img("photo-1542751371-adc38448a05e"),
  ssd1: img("photo-1597872200969-2b65d56bd16b"),
  ssd2: img("photo-1531492746076-161ca9bcad58"),
  router1: img("photo-1518770660439-4636190af475"),
  router2: img("photo-1558494949-ef010cbdcc31"),
  router3: img("photo-1550009158-9ebf69173e03"),
  router4: img("photo-1518770660439-4636190af475"),
  stand1: img("photo-1593640408182-31c70c8268f5"),
  case1: img("photo-1601784551446-20c9e07cdbdb"),
  case2: img("photo-1615655406736-b37c4fabf923"),
  desk1: img("photo-1519389950473-47ba0277781c"),
  gadgets1: img("photo-1498049794561-7780e7231661"),
  monitor1: img("photo-1527443224154-c4a3942d3acf"),
  smarthome1: img("photo-1558002038-1055907df827"),
  smarthome2: img("photo-1585771724684-38269d6639fd"),
  smarthome3: img("photo-1558618666-fcd25c85cd64"),
  vacuum1: img("photo-1558317374-067fb5f30001"),
  vacuum2: img("photo-1558002038-1055907df827"),
  webcam1: img("photo-1527443224154-c4a3942d3acf"),
  heroPhones: img("photo-1550745165-9bc0b252726f", 1600, 900),
  heroLaptops: img("photo-1531297484001-80022131f5a1", 1600, 900),
  heroAudio: img("photo-1505740420928-5e560c06d30e", 1600, 900),
  heroGaming: img("photo-1606144042614-b2417e99c4e3", 1200, 900),
  heroAccess: img("photo-1550009158-9ebf69173e03", 1200, 900),
  heroSmart: img("photo-1558002038-1055907df827", 1600, 900),
  heroCameras: img("photo-1516035069371-29a1b244cc32", 1600, 900),
  heroNetwork: img("photo-1518770660439-4636190af475", 1600, 900),
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

  await q(
    conn,
    `INSERT INTO attributes (id, name, name_bd, priority, status) VALUES (1, 'Storage', 'স্টোরেজ', 1, 1)`
  );
  const variants = [
    [1, 1, "Standard", "স্ট্যান্ডার্ড", 1],
    [2, 1, "128GB", "১২৮জিবি", 2],
    [3, 1, "256GB", "২৫৬জিবি", 3],
    [4, 1, "512GB", "৫১২জিবি", 4],
    [5, 1, "1TB", "১টিবি", 5],
  ];
  for (const [id, attrId, name, nameBd, serial] of variants) {
    await q(
      conn,
      `INSERT INTO variants (id, attribute_id, name, serial, name_bd, status) VALUES (?,?,?,?,?,1)`,
      [id, attrId, name, serial, nameBd]
    );
  }

  // Keep IDs 1–10 stable so existing references stay valid; append new brands.
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
    [11, "Asus"],
    [12, "HP"],
    [13, "Google"],
    [14, "Nothing"],
    [15, "Bose"],
    [16, "Razer"],
    [17, "TP-Link"],
    [18, "Canon"],
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
     VALUES (1, 'Electronics', 'ইলেকট্রনিক্স', ?, 1, 1, 3)`,
    [IMAGES.desk1]
  );

  // IDs 1–6 stay put; 7–9 are new shop sections.
  const subs = [
    [1, 1, "Smartphones", "স্মার্টফোন", IMAGES.phone1, 1],
    [2, 1, "Laptops & Tablets", "ল্যাপটপ ও ট্যাবলেট", IMAGES.laptop1, 1],
    [3, 1, "Audio", "অডিও", IMAGES.head1, 1],
    [4, 1, "Wearables", "ওয়্যারেবল", IMAGES.watch1, 1],
    [5, 1, "Accessories", "এক্সেসরিজ", IMAGES.charge1, 1],
    [6, 1, "Gaming", "গেমিং", IMAGES.game1, 1],
    [7, 1, "Smart Home", "স্মার্ট হোম", IMAGES.smarthome1, 1],
    [8, 1, "Cameras", "ক্যামেরা", IMAGES.cam1, 1],
    [9, 1, "Networking", "নেটওয়ার্কিং", IMAGES.router1, 1],
  ];
  for (const [id, mainId, name, nameBd, image, featured] of subs) {
    await q(
      conn,
      `INSERT INTO sub_categories (id, main_category_id, name, name_bd, img_path, status, featured, priority)
       VALUES (?,?,?,?,?,1,?,2)`,
      [id, mainId, name, nameBd, image, featured]
    );
  }

  // IDs 1–11 preserved; 12–24 expand browse filters across the new subs.
  const children = [
    [1, 1, "Flagship Phones", "ফ্ল্যাগশিপ ফোন", IMAGES.phone2],
    [2, 1, "Mid-range Phones", "মিড-রেঞ্জ ফোন", IMAGES.phone3],
    [3, 2, "Ultrabooks", "আল্ট্রাবুক", IMAGES.laptop1],
    [4, 2, "Tablets", "ট্যাবলেট", IMAGES.tablet1],
    [5, 3, "Earbuds", "ইয়ারবাড", IMAGES.buds1],
    [6, 3, "Headphones", "হেডফোন", IMAGES.head1],
    [7, 3, "Speakers", "স্পিকার", IMAGES.speaker1],
    [8, 4, "Smartwatches", "স্মার্টওয়াচ", IMAGES.watch1],
    [9, 5, "Chargers & Cables", "চার্জার ও কেবল", IMAGES.charge1],
    [10, 5, "Computer Peripherals", "কম্পিউটার পেরিফেরাল", IMAGES.mouse1],
    [11, 6, "Consoles & Controllers", "কনসোল ও কন্ট্রোলার", IMAGES.game1],
    [12, 1, "Budget Phones", "বাজেট ফোন", IMAGES.phone4],
    [13, 2, "Gaming Laptops", "গেমিং ল্যাপটপ", IMAGES.laptop9],
    [14, 5, "Mechanical Keyboards", "মেকানিক্যাল কীবোর্ড", IMAGES.keyboard2],
    [15, 5, "Power Banks", "পাওয়ার ব্যাংক", IMAGES.power1],
    [16, 9, "Wi-Fi Routers", "ওয়াই-ফাই রাউটার", IMAGES.router1],
    [17, 8, "Action Cameras", "অ্যাকশন ক্যামেরা", IMAGES.action1],
    [18, 8, "DSLR / Mirrorless", "ডিএসএলআর / মিররলেস", IMAGES.cam2],
    [19, 7, "Smart Lights", "স্মার্ট লাইট", IMAGES.smarthome2],
    [20, 7, "Robot Vacuums", "রোবট ভ্যাকুয়াম", IMAGES.vacuum1],
    [21, 6, "Gaming Mice", "গেমিং মাউস", IMAGES.mouse2],
    [22, 7, "Security Cameras", "সিকিউরিটি ক্যামেরা", IMAGES.cam1],
    [23, 4, "Fitness Bands", "ফিটনেস ব্যান্ড", IMAGES.band1],
    [24, 5, "Phone Cases", "ফোন কেস", IMAGES.case1],
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
 *  skus: Array<{colorId:number, variantId:number, buy:number, sell:number, discount?:number, stock?:number, weight?:number}>
 * }} TechProduct
 */

/** @type {TechProduct[]} */
const PRODUCTS = [
  // --- Flagship phones (child 1) ---
  {
    name: "Galaxy S24 Ultra 256GB",
    nameBd: "গ্যালাক্সি S24 আল্ট্রা ২৫৬জিবি",
    brandId: 2, subId: 1, childId: 1, image: IMAGES.phone1, image2: IMAGES.phone10,
    short: "Flagship Android phone with bright display and long battery life.",
    shortBd: "উজ্জ্বল ডিসপ্লে ও দীর্ঘ ব্যাটারি লাইফসহ ফ্ল্যাগশিপ অ্যান্ড্রয়েড ফোন।",
    featured: 1, bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 18 },
      { colorId: 4, variantId: 3, buy: 98000, sell: 124999, discount: 5000, stock: 12 },
      { colorId: 5, variantId: 4, buy: 108000, sell: 134999, discount: 4000, stock: 8 },
    ],
  },
  {
    name: "iPhone 15 128GB",
    nameBd: "আইফোন ১৫ ১২৮জিবি",
    brandId: 1, subId: 1, childId: 1, image: IMAGES.phone2, image2: IMAGES.phone11,
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
    name: "Pixel 8 Pro 256GB",
    nameBd: "পিক্সেল ৮ প্রো ২৫৬জিবি",
    brandId: 13, subId: 1, childId: 1, image: IMAGES.phone8, image2: IMAGES.phone4,
    short: "Google Tensor camera phone with clean Android and AI tools.",
    shortBd: "পরিচ্ছন্ন অ্যান্ড্রয়েড ও এআই টুলসহ গুগল টেনসর ক্যামেরা ফোন।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 72000, sell: 94999, discount: 4000, stock: 14 },
      { colorId: 5, variantId: 3, buy: 72000, sell: 94999, discount: 4000, stock: 9 },
    ],
  },
  {
    name: "Nothing Phone (2) 256GB",
    nameBd: "নাথিং ফোন (২) ২৫৬জিবি",
    brandId: 14, subId: 1, childId: 1, image: IMAGES.phone5, image2: IMAGES.phone6,
    short: "Glyph interface flagship with transparent design and clean software.",
    shortBd: "ট্রান্সপারেন্ট ডিজাইন ও পরিচ্ছন্ন সফটওয়্যারসহ গ্লিফ ফ্ল্যাগশিপ।",
    bestDeal: 1,
    skus: [
      { colorId: 2, variantId: 3, buy: 42000, sell: 54999, discount: 3000, stock: 16 },
      { colorId: 1, variantId: 3, buy: 42000, sell: 54999, discount: 3000, stock: 11 },
    ],
  },
  {
    name: "iPhone 16 Pro 256GB",
    nameBd: "আইফোন ১৬ প্রো ২৫৬জিবি",
    brandId: 1, subId: 1, childId: 1, image: IMAGES.phone12, image2: IMAGES.phone13,
    short: "Latest Pro iPhone with camera control and titanium finish.",
    shortBd: "ক্যামেরা কন্ট্রোল ও টাইটানিয়াম ফিনিশসহ লেটেস্ট প্রো আইফোন।",
    featured: 1,
    skus: [
      { colorId: 3, variantId: 3, buy: 118000, sell: 149999, discount: 5000, stock: 10 },
      { colorId: 1, variantId: 4, buy: 132000, sell: 169999, discount: 4000, stock: 6 },
    ],
  },
  {
    name: "Galaxy S24 128GB",
    nameBd: "গ্যালাক্সি S24 ১২৮জিবি",
    brandId: 2, subId: 1, childId: 1, image: IMAGES.phone10, image2: IMAGES.phone9,
    short: "Compact Galaxy flagship with Galaxy AI features.",
    shortBd: "গ্যালাক্সি এআই ফিচারসহ কমপ্যাক্ট ফ্ল্যাগশিপ।",
    skus: [
      { colorId: 4, variantId: 2, buy: 62000, sell: 79999, discount: 3000, stock: 18 },
      { colorId: 7, variantId: 3, buy: 68000, sell: 86999, discount: 2500, stock: 10 },
    ],
  },
  // --- Mid-range phones (child 2) ---
  {
    name: "Redmi Note 13 Pro",
    nameBd: "রেডমি নোট ১৩ প্রো",
    brandId: 4, subId: 1, childId: 2, image: IMAGES.phone3, image2: IMAGES.phone9,
    short: "Value flagship killer with AMOLED display and fast charging.",
    shortBd: "AMOLED ডিসপ্লে ও ফাস্ট চার্জিংসহ সাশ্রয়ী পারফরম্যান্স ফোন।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 22000, sell: 29999, discount: 2000, stock: 40 },
      { colorId: 6, variantId: 3, buy: 22000, sell: 29999, discount: 2000, stock: 28 },
    ],
  },
  {
    name: "OnePlus Nord CE 4",
    nameBd: "ওয়ানপ্লাস নর্ড CE ৪",
    brandId: 9, subId: 1, childId: 2, image: IMAGES.phone6, image2: IMAGES.phone1,
    short: "Smooth OxygenOS experience with rapid charging.",
    shortBd: "দ্রুত চার্জিংসহ স্মুথ OxygenOS অভিজ্ঞতা।",
    skus: [
      { colorId: 5, variantId: 3, buy: 24000, sell: 32999, discount: 1500, stock: 22 },
      { colorId: 4, variantId: 3, buy: 24000, sell: 32999, discount: 1500, stock: 16 },
    ],
  },
  {
    name: "Galaxy A55 5G 128GB",
    nameBd: "গ্যালাক্সি A55 ৫জি ১২৮জিবি",
    brandId: 2, subId: 1, childId: 2, image: IMAGES.phone9, image2: IMAGES.phone14,
    short: "Premium mid-ranger with IP67 body and vivid AMOLED.",
    shortBd: "IP67 বডি ও উজ্জ্বল AMOLEDসহ প্রিমিয়াম মিড-রেঞ্জার।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 5, variantId: 2, buy: 28000, sell: 36999, discount: 2000, stock: 24 },
      { colorId: 7, variantId: 3, buy: 31000, sell: 40999, discount: 1500, stock: 14 },
    ],
  },
  {
    name: "OnePlus 12R 256GB",
    nameBd: "ওয়ানপ্লাস ১২R ২৫৬জিবি",
    brandId: 9, subId: 1, childId: 2, image: IMAGES.phone14, image2: IMAGES.phone5,
    short: "Near-flagship speed with 100W charging and Fluid AMOLED.",
    shortBd: "১০০W চার্জিং ও Fluid AMOLEDসহ নিয়ার-ফ্ল্যাগশিপ স্পিড।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 3, buy: 38000, sell: 49999, discount: 3000, stock: 15 },
      { colorId: 6, variantId: 3, buy: 38000, sell: 49999, discount: 3000, stock: 10 },
    ],
  },
  {
    name: "Pixel 8a 128GB",
    nameBd: "পিক্সেল ৮a ১২৮জিবি",
    brandId: 13, subId: 1, childId: 2, image: IMAGES.phone8, image2: IMAGES.phone7,
    short: "Tensor camera smarts at a mid-range price.",
    shortBd: "মিড-রেঞ্জ দামে টেনসর ক্যামেরার স্মার্টনেস।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 2, buy: 32000, sell: 42999, discount: 2500, stock: 18 },
      { colorId: 5, variantId: 2, buy: 32000, sell: 42999, discount: 2500, stock: 12 },
    ],
  },
  // --- Budget phones (child 12) ---
  {
    name: "Redmi 13C 128GB",
    nameBd: "রেডমি ১৩C ১২৮জিবি",
    brandId: 4, subId: 1, childId: 12, image: IMAGES.phone4, image2: IMAGES.phone3,
    short: "Everyday Android phone with a big battery for the price.",
    shortBd: "দামের তুলনায় বড় ব্যাটারির দৈনন্দিন অ্যান্ড্রয়েড ফোন।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 2, buy: 8500, sell: 12999, discount: 1000, stock: 50 },
      { colorId: 6, variantId: 2, buy: 8500, sell: 12999, discount: 1000, stock: 36 },
    ],
  },
  {
    name: "Galaxy A15 128GB",
    nameBd: "গ্যালাক্সি A15 ১২৮জিবি",
    brandId: 2, subId: 1, childId: 12, image: IMAGES.phone9, image2: IMAGES.phone4,
    short: "Reliable Samsung budget phone with Super AMOLED.",
    shortBd: "Super AMOLEDসহ নির্ভরযোগ্য স্যামসাং বাজেট ফোন।",
    freeDelivery: 1,
    skus: [
      { colorId: 5, variantId: 2, buy: 11000, sell: 15999, discount: 1000, stock: 34 },
      { colorId: 1, variantId: 2, buy: 11000, sell: 15999, discount: 1000, stock: 22 },
    ],
  },
  {
    name: "Nothing CMF Phone 1",
    nameBd: "নাথিং CMF ফোন ১",
    brandId: 14, subId: 1, childId: 12, image: IMAGES.phone5, image2: IMAGES.phone6,
    short: "Swappable back, clean Nothing OS, surprising cameras.",
    shortBd: "বদলানো যায় এমন ব্যাক, পরিচ্ছন্ন Nothing OS ও ভালো ক্যামেরা।",
    featured: 1,
    skus: [
      { colorId: 6, variantId: 2, buy: 14000, sell: 19999, discount: 1500, stock: 20 },
      { colorId: 3, variantId: 2, buy: 14000, sell: 19999, discount: 1500, stock: 14 },
    ],
  },
  // --- Ultrabooks (child 3) ---
  {
    name: "MacBook Air M2 256GB",
    nameBd: "ম্যাকবুক এয়ার M2 ২৫৬জিবি",
    brandId: 1, subId: 2, childId: 3, image: IMAGES.laptop1, image2: IMAGES.laptop6,
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
    brandId: 8, subId: 2, childId: 3, image: IMAGES.laptop2, image2: IMAGES.laptop8,
    short: "Everyday Windows laptop with solid battery and SSD storage.",
    shortBd: "ভালো ব্যাটারি ও SSD স্টোরেজসহ দৈনন্দিন উইন্ডোজ ল্যাপটপ।",
    bestDeal: 1,
    skus: [
      { colorId: 4, variantId: 3, buy: 52000, sell: 68999, discount: 4000, stock: 15, weight: 1.6 },
      { colorId: 1, variantId: 4, buy: 58000, sell: 74999, discount: 3000, stock: 8, weight: 1.6 },
    ],
  },
  {
    name: "HP Pavilion 15",
    nameBd: "এইচপি প্যাভিলিয়ন ১৫",
    brandId: 12, subId: 2, childId: 3, image: IMAGES.laptop4, image2: IMAGES.laptop7,
    short: "15-inch everyday laptop for office and campus work.",
    shortBd: "অফিস ও ক্যাম্পাস কাজের ১৫ ইঞ্চি দৈনন্দিন ল্যাপটপ।",
    freeDelivery: 1,
    skus: [
      { colorId: 3, variantId: 4, buy: 48000, sell: 62999, discount: 3000, stock: 12, weight: 1.75 },
      { colorId: 1, variantId: 4, buy: 48000, sell: 62999, discount: 3000, stock: 8, weight: 1.75 },
    ],
  },
  {
    name: "Asus Zenbook 14 OLED",
    nameBd: "আসুস জেনবুক ১৪ OLED",
    brandId: 11, subId: 2, childId: 3, image: IMAGES.laptop5, image2: IMAGES.laptop11,
    short: "Lightweight OLED ultrabook for creators and commuters.",
    shortBd: "ক্রিয়েটর ও যাতায়াতের জন্য হালকা OLED আল্ট্রাবুক।",
    featured: 1,
    skus: [
      { colorId: 3, variantId: 4, buy: 78000, sell: 99999, discount: 4000, stock: 8, weight: 1.2 },
      { colorId: 4, variantId: 5, buy: 88000, sell: 114999, discount: 3000, stock: 5, weight: 1.2 },
    ],
  },
  {
    name: "MacBook Pro 14 M3 512GB",
    nameBd: "ম্যাকবুক প্রো ১৪ M3 ৫১২জিবি",
    brandId: 1, subId: 2, childId: 3, image: IMAGES.laptop3, image2: IMAGES.laptop6,
    short: "Pro display and speakers for editing, code, and music.",
    shortBd: "এডিটিং, কোড ও মিউজিকের জন্য প্রো ডিসপ্লে ও স্পিকার।",
    featured: 1,
    skus: [
      { colorId: 4, variantId: 4, buy: 148000, sell: 189999, discount: 6000, stock: 6, weight: 1.55 },
      { colorId: 3, variantId: 5, buy: 168000, sell: 214999, discount: 5000, stock: 4, weight: 1.55 },
    ],
  },
  {
    name: "HP Envy x360 14",
    nameBd: "এইচপি এনভি x360 ১৪",
    brandId: 12, subId: 2, childId: 3, image: IMAGES.laptop8, image2: IMAGES.laptop4,
    short: "2-in-1 convertible laptop with touch screen and pen support.",
    shortBd: "টাচ স্ক্রিন ও পেন সাপোর্টসহ ২-ইন-১ কনভার্টিবল ল্যাপটপ।",
    skus: [
      { colorId: 3, variantId: 4, buy: 68000, sell: 87999, discount: 3500, stock: 9, weight: 1.4 },
    ],
  },
  // --- Tablets (child 4) ---
  {
    name: "Samsung Galaxy Tab S9 FE",
    nameBd: "স্যামসাং গ্যালাক্সি ট্যাব S9 FE",
    brandId: 2, subId: 2, childId: 4, image: IMAGES.tablet1, image2: IMAGES.tablet2,
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
    brandId: 1, subId: 2, childId: 4, image: IMAGES.tablet2, image2: IMAGES.tablet1,
    short: "Colorful all-screen iPad for streaming, drawing, and study.",
    shortBd: "স্ট্রিমিং, ড্রয়িং ও পড়াশোনার জন্য অল-স্ক্রিন আইপ্যাড।",
    featured: 1,
    skus: [
      { colorId: 5, variantId: 1, buy: 36000, sell: 48999, discount: 2000, stock: 11 },
      { colorId: 3, variantId: 1, buy: 36000, sell: 48999, discount: 2000, stock: 9 },
    ],
  },
  {
    name: "Galaxy Tab A9 64GB",
    nameBd: "গ্যালাক্সি ট্যাব A9 ৬৪জিবি",
    brandId: 2, subId: 2, childId: 4, image: IMAGES.tablet3, image2: IMAGES.tablet1,
    short: "Compact family tablet for video, reading, and kids apps.",
    shortBd: "ভিডিও, পড়া ও কিডস অ্যাপের কমপ্যাক্ট ফ্যামিলি ট্যাবলেট।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 4, variantId: 1, buy: 14000, sell: 19999, discount: 1500, stock: 22 },
      { colorId: 3, variantId: 2, buy: 17000, sell: 23999, discount: 1000, stock: 12 },
    ],
  },
  {
    name: "iPad Air M2 128GB",
    nameBd: "আইপ্যাড এয়ার M2 ১২৮জিবি",
    brandId: 1, subId: 2, childId: 4, image: IMAGES.tablet2, image2: IMAGES.tablet3,
    short: "Thin M2 iPad for art, notes, and portable work.",
    shortBd: "আর্ট, নোট ও পোর্টেবল কাজের জন্য পাতলা M2 আইপ্যাড।",
    featured: 1,
    skus: [
      { colorId: 5, variantId: 2, buy: 62000, sell: 79999, discount: 3000, stock: 8 },
      { colorId: 4, variantId: 3, buy: 72000, sell: 91999, discount: 2500, stock: 5 },
    ],
  },
  {
    name: "Xiaomi Pad 6 256GB",
    nameBd: "শাওমি প্যাড ৬ ২৫৬জিবি",
    brandId: 4, subId: 2, childId: 4, image: IMAGES.tablet3, image2: IMAGES.tablet1,
    short: "High-refresh Android tablet that punches above its price.",
    shortBd: "দামের তুলনায় হাই-রিফ্রেশ অ্যান্ড্রয়েড ট্যাবলেট।",
    bestDeal: 1,
    skus: [
      { colorId: 4, variantId: 3, buy: 24000, sell: 32999, discount: 2000, stock: 16 },
    ],
  },
  // --- Gaming laptops (child 13) ---
  {
    name: "Asus TUF Gaming A15",
    nameBd: "আসুস TUF গেমিং A15",
    brandId: 11, subId: 2, childId: 13, image: IMAGES.laptop9, image2: IMAGES.laptop10,
    short: "Durable RTX gaming laptop for esports and classwork.",
    shortBd: "ইস্পোর্টস ও ক্লাসওয়ার্কের জন্য টেকসই RTX গেমিং ল্যাপটপ।",
    featured: 1, bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 4, buy: 88000, sell: 114999, discount: 5000, stock: 7, weight: 2.2 },
      { colorId: 1, variantId: 5, buy: 98000, sell: 129999, discount: 4000, stock: 4, weight: 2.2 },
    ],
  },
  {
    name: "Lenovo Legion 5 15",
    nameBd: "লেনোভো লিজিয়ন ৫ ১৫",
    brandId: 8, subId: 2, childId: 13, image: IMAGES.laptop10, image2: IMAGES.game5,
    short: "High-refresh Legion keyboard and strong cooling for AAA titles.",
    shortBd: "AAA গেমের জন্য হাই-রিফ্রেশ কীবোর্ড ও শক্তিশালী কুলিং।",
    skus: [
      { colorId: 1, variantId: 4, buy: 98000, sell: 129999, discount: 6000, stock: 6, weight: 2.4 },
    ],
  },
  {
    name: "HP Victus 16",
    nameBd: "এইচপি ভিক্টাস ১৬",
    brandId: 12, subId: 2, childId: 13, image: IMAGES.laptop7, image2: IMAGES.laptop9,
    short: "Big-screen gaming laptop with dedicated graphics.",
    shortBd: "ডেডিকেটেড গ্রাফিক্সসহ বড় স্ক্রিনের গেমিং ল্যাপটপ।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 4, buy: 78000, sell: 99999, discount: 4000, stock: 8, weight: 2.3 },
    ],
  },
  // --- Earbuds (child 5) ---
  {
    name: "Galaxy Buds2 Pro",
    nameBd: "গ্যালাক্সি বাডস২ প্রো",
    brandId: 2, subId: 3, childId: 5, image: IMAGES.buds1, image2: IMAGES.buds5,
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
    brandId: 1, subId: 3, childId: 5, image: IMAGES.buds2, image2: IMAGES.buds4,
    short: "Adaptive audio, ANC, and MagSafe charging case.",
    shortBd: "অ্যাডাপটিভ অডিও, ANC ও MagSafe চার্জিং কেস।",
    featured: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 18000, sell: 26999, discount: 2000, stock: 25 },
    ],
  },
  {
    name: "Nothing Ear (a)",
    nameBd: "নাথিং ইয়ার (a)",
    brandId: 14, subId: 3, childId: 5, image: IMAGES.buds3, image2: IMAGES.buds1,
    short: "Transparent stem earbuds with ChatGPT integration.",
    shortBd: "ChatGPT ইন্টিগ্রেশনসহ ট্রান্সপারেন্ট স্টেম ইয়ারবাড।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 28 },
      { colorId: 1, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 16 },
    ],
  },
  {
    name: "Sony WF-1000XM5",
    nameBd: "সনি WF-1000XM5",
    brandId: 3, subId: 3, childId: 5, image: IMAGES.buds5, image2: IMAGES.buds3,
    short: "Flagship true wireless with class-leading ANC.",
    shortBd: "ক্লাস-লিডিং ANCসহ ফ্ল্যাগশিপ ট্রু ওয়্যারলেস।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 18000, sell: 25999, discount: 2000, stock: 18 },
      { colorId: 3, variantId: 1, buy: 18000, sell: 25999, discount: 2000, stock: 10 },
    ],
  },
  {
    name: "Galaxy Buds FE",
    nameBd: "গ্যালাক্সি বাডস FE",
    brandId: 2, subId: 3, childId: 5, image: IMAGES.buds1, image2: IMAGES.buds4,
    short: "Affordable Samsung buds with solid ANC for daily commute.",
    shortBd: "দৈনন্দিন যাতায়াতের জন্য সাশ্রয়ী স্যামসাং বাডস।",
    freeDelivery: 1,
    skus: [
      { colorId: 4, variantId: 1, buy: 5500, sell: 7999, discount: 700, stock: 32 },
    ],
  },
  // --- Headphones (child 6) ---
  {
    name: "Sony WH-1000XM5 Headphones",
    nameBd: "সনি WH-1000XM5 হেডফোন",
    brandId: 3, subId: 3, childId: 6, image: IMAGES.head1, image2: IMAGES.head3,
    short: "Industry-leading noise cancelling with premium sound.",
    shortBd: "প্রিমিয়াম সাউন্ডসহ ইন্ডাস্ট্রি-লিডিং নয়েজ ক্যানসেলিং।",
    featured: 1, bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 28000, sell: 39999, discount: 3000, stock: 20 },
      { colorId: 3, variantId: 1, buy: 28000, sell: 39999, discount: 3000, stock: 12 },
    ],
  },
  {
    name: "JBL Tune 760NC",
    nameBd: "JBL টিউন ৭৬০NC",
    brandId: 6, subId: 3, childId: 6, image: IMAGES.head2, image2: IMAGES.head5,
    short: "Wireless over-ear headphones with active noise cancelling.",
    shortBd: "অ্যাকটিভ নয়েজ ক্যানসেলিংসহ ওয়্যারলেস ওভার-ইয়ার হেডফোন।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 6500, sell: 9999, discount: 1000, stock: 35 },
      { colorId: 5, variantId: 1, buy: 6500, sell: 9999, discount: 1000, stock: 22 },
    ],
  },
  {
    name: "Anker Soundcore Life Q30",
    nameBd: "অ্যাংকার সাউন্ডকোর লাইফ Q30",
    brandId: 5, subId: 3, childId: 6, image: IMAGES.head2, image2: IMAGES.head4,
    short: "Hybrid ANC headphones with long playback time.",
    shortBd: "দীর্ঘ প্লেব্যাক টাইমসহ হাইব্রিড ANC হেডফোন।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 30 },
      { colorId: 5, variantId: 1, buy: 5500, sell: 8499, discount: 800, stock: 18 },
    ],
  },
  {
    name: "Bose QuietComfort 45",
    nameBd: "বোস QuietComfort ৪৫",
    brandId: 15, subId: 3, childId: 6, image: IMAGES.head3, image2: IMAGES.head1,
    short: "All-day comfort and famous Bose noise cancelling.",
    shortBd: "সারাদিনের আরাম ও বিখ্যাত বোস নয়েজ ক্যানসেলিং।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 22000, sell: 31999, discount: 2500, stock: 14 },
      { colorId: 2, variantId: 1, buy: 22000, sell: 31999, discount: 2500, stock: 8 },
    ],
  },
  {
    name: "Bose QuietComfort Ultra",
    nameBd: "বোস QuietComfort আল্ট্রা",
    brandId: 15, subId: 3, childId: 6, image: IMAGES.head4, image2: IMAGES.head3,
    short: "Immersive audio headphones with spatial sound modes.",
    shortBd: "স্পেশিয়াল সাউন্ড মোডসহ ইমার্সিভ অডিও হেডফোন।",
    skus: [
      { colorId: 1, variantId: 1, buy: 32000, sell: 44999, discount: 3000, stock: 9 },
    ],
  },
  // --- Speakers (child 7) ---
  {
    name: "JBL Flip 6 Portable Speaker",
    nameBd: "JBL ফ্লিপ ৬ পোর্টেবল স্পিকার",
    brandId: 6, subId: 3, childId: 7, image: IMAGES.speaker1, image2: IMAGES.speaker3,
    short: "Waterproof Bluetooth speaker with bold JBL sound.",
    shortBd: "বোল্ড JBL সাউন্ডসহ ওয়াটারপ্রুফ ব্লুটুথ স্পিকার।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 26 },
      { colorId: 7, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 14 },
      { colorId: 5, variantId: 1, buy: 8500, sell: 12999, discount: 1500, stock: 12 },
    ],
  },
  {
    name: "Sony SRS-XB100",
    nameBd: "সনি SRS-XB100",
    brandId: 3, subId: 3, childId: 7, image: IMAGES.speaker2, image2: IMAGES.speaker1,
    short: "Ultra-portable durable speaker for outdoor use.",
    shortBd: "আউটডোর ব্যবহারের জন্য হালকা ও টেকসই স্পিকার।",
    skus: [
      { colorId: 1, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 40 },
      { colorId: 5, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 24 },
    ],
  },
  {
    name: "JBL Charge 5",
    nameBd: "JBL চার্জ ৫",
    brandId: 6, subId: 3, childId: 7, image: IMAGES.speaker3, image2: IMAGES.speaker2,
    short: "Powerbank speaker that plays loud for a full party day.",
    shortBd: "পাওয়ারব্যাংক স্পিকার যা পুরো পার্টি দিন জোরে বাজে।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 11000, sell: 16499, discount: 1500, stock: 18 },
      { colorId: 5, variantId: 1, buy: 11000, sell: 16499, discount: 1500, stock: 10 },
    ],
  },
  {
    name: "Bose SoundLink Flex",
    nameBd: "বোস সাউন্ডলিংক ফ্লেক্স",
    brandId: 15, subId: 3, childId: 7, image: IMAGES.speaker4, image2: IMAGES.speaker3,
    short: "Rugged Bose speaker with surprisingly wide soundstage.",
    shortBd: "আশ্চর্যজনক ওয়াইড সাউন্ডস্টেজসহ রাগেড বোস স্পিকার।",
    skus: [
      { colorId: 1, variantId: 1, buy: 12000, sell: 17999, discount: 1500, stock: 14 },
      { colorId: 2, variantId: 1, buy: 12000, sell: 17999, discount: 1500, stock: 8 },
    ],
  },
  // --- Smartwatches (child 8) ---
  {
    name: "Apple Watch SE (2nd Gen)",
    nameBd: "অ্যাপল ওয়াচ SE (২য় জেনারেশন)",
    brandId: 1, subId: 4, childId: 8, image: IMAGES.watch1, image2: IMAGES.watch3,
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
    brandId: 2, subId: 4, childId: 8, image: IMAGES.watch2, image2: IMAGES.watch5,
    short: "Advanced health sensors with sleek circular design.",
    shortBd: "স্লিক সার্কুলার ডিজাইনসহ অ্যাডভান্সড হেলথ সেন্সর।",
    skus: [
      { colorId: 4, variantId: 1, buy: 20000, sell: 27999, discount: 2000, stock: 18 },
      { colorId: 3, variantId: 1, buy: 20000, sell: 27999, discount: 2000, stock: 10 },
    ],
  },
  {
    name: "Pixel Watch 2",
    nameBd: "পিক্সেল ওয়াচ ২",
    brandId: 13, subId: 4, childId: 8, image: IMAGES.watch3, image2: IMAGES.watch4,
    short: "Fitbit coaching on a round Wear OS watch.",
    shortBd: "রাউন্ড Wear OS ওয়াচে ফিটবিট কোচিং।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 24000, sell: 32999, discount: 2500, stock: 12 },
      { colorId: 3, variantId: 1, buy: 24000, sell: 32999, discount: 2500, stock: 8 },
    ],
  },
  {
    name: "Xiaomi Watch 2",
    nameBd: "শাওমি ওয়াচ ২",
    brandId: 4, subId: 4, childId: 8, image: IMAGES.watch4, image2: IMAGES.watch2,
    short: "Wear OS smartwatch with dual-band GPS at a fair price.",
    shortBd: "সাশ্রয়ী দামে ডুয়াল-ব্যান্ড GPSসহ Wear OS স্মার্টওয়াচ।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 12000, sell: 16999, discount: 1500, stock: 20 },
    ],
  },
  {
    name: "Apple Watch Series 9",
    nameBd: "অ্যাপল ওয়াচ সিরিজ ৯",
    brandId: 1, subId: 4, childId: 8, image: IMAGES.watch5, image2: IMAGES.watch1,
    short: "Double tap, brighter display, and full Apple health suite.",
    shortBd: "ডাবল ট্যাপ, উজ্জ্বল ডিসপ্লে ও সম্পূর্ণ অ্যাপল হেলথ স্যুট।",
    skus: [
      { colorId: 1, variantId: 1, buy: 38000, sell: 49999, discount: 3000, stock: 10 },
      { colorId: 3, variantId: 1, buy: 38000, sell: 49999, discount: 3000, stock: 7 },
    ],
  },
  // --- Fitness bands (child 23) ---
  {
    name: "Xiaomi Smart Band 8",
    nameBd: "শাওমি স্মার্ট ব্যান্ড ৮",
    brandId: 4, subId: 4, childId: 23, image: IMAGES.band1, image2: IMAGES.watch4,
    short: "Slim fitness band with sleep scores and long battery.",
    shortBd: "স্লিপ স্কোর ও দীর্ঘ ব্যাটারির স্লিম ফিটনেস ব্যান্ড।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 60 },
      { colorId: 7, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 28 },
    ],
  },
  {
    name: "Galaxy Fit 3",
    nameBd: "গ্যালাক্সি ফিট ৩",
    brandId: 2, subId: 4, childId: 23, image: IMAGES.band1, image2: IMAGES.watch2,
    short: "Large AMOLED fitness band that syncs with Samsung Health.",
    shortBd: "স্যামসাং হেলথের সাথে সিঙ্ক হয় এমন বড় AMOLED ফিটনেস ব্যান্ড।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 40 },
      { colorId: 3, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 22 },
    ],
  },
  // --- Chargers (child 9) ---
  {
    name: "Baseus 65W GaN Charger",
    nameBd: "বেসিয়াস ৬৫W GaN চার্জার",
    brandId: 10, subId: 5, childId: 9, image: IMAGES.charge2, image2: IMAGES.charge3,
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
    brandId: 5, subId: 5, childId: 9, image: IMAGES.cable1, image2: IMAGES.charge4,
    short: "Durable braided cable for fast sync and charging.",
    shortBd: "ফাস্ট চার্জ ও সিঙ্কের জন্য টেকসই ব্রেইডেড কেবল।",
    skus: [
      { colorId: 1, variantId: 1, buy: 700, sell: 1299, discount: 100, stock: 80 },
      { colorId: 2, variantId: 1, buy: 700, sell: 1299, discount: 100, stock: 60 },
    ],
  },
  {
    name: "Anker 735 GaNPrime 65W",
    nameBd: "অ্যাংকার ৭৩৫ GaNPrime ৬৫W",
    brandId: 5, subId: 5, childId: 9, image: IMAGES.charge3, image2: IMAGES.charge1,
    short: "Fold-flat 65W charger that fills a laptop and two phones.",
    shortBd: "একটা ল্যাপটপ ও দুইটা ফোন চার্জ করে এমন ভাঁজ করা ৬৫W চার্জার।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 4200, sell: 6499, discount: 500, stock: 26 },
    ],
  },
  // --- Power banks (child 15) ---
  {
    name: "Anker 737 Power Bank (PowerCore 24K)",
    nameBd: "অ্যাংকার ৭৩৭ পাওয়ার ব্যাংক (২৪কে)",
    brandId: 5, subId: 5, childId: 15, image: IMAGES.power1, image2: IMAGES.charge1,
    short: "High-capacity fast-charge power bank for phones and laptops.",
    shortBd: "ফোন ও ল্যাপটপের জন্য হাই-ক্যাপাসিটি ফাস্ট-চার্জ পাওয়ার ব্যাংক।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1000, stock: 32 },
    ],
  },
  {
    name: "Xiaomi 20000mAh Power Bank 50W",
    nameBd: "শাওমি ২০০০০mAh পাওয়ার ব্যাংক ৫০W",
    brandId: 4, subId: 5, childId: 15, image: IMAGES.power2, image2: IMAGES.power1,
    short: "Two-day travel battery with 50W USB-C input and output.",
    shortBd: "৫০W USB-C ইন/আউটসহ দুই দিনের ট্রাভেল ব্যাটারি।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 3200, sell: 4999, discount: 400, stock: 40 },
    ],
  },
  {
    name: "Anker 313 Power Bank 10K",
    nameBd: "অ্যাংকার ৩১৩ পাওয়ার ব্যাংক ১০কে",
    brandId: 5, subId: 5, childId: 15, image: IMAGES.power1, image2: IMAGES.charge2,
    short: "Pocket 10000mAh bank for a full phone recharge on the go.",
    shortBd: "পকেটে রাখা যায় এমন ১০০০০mAh পাওয়ার ব্যাংক।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 1800, sell: 2799, discount: 200, stock: 55 },
      { colorId: 2, variantId: 1, buy: 1800, sell: 2799, discount: 200, stock: 30 },
    ],
  },
  // --- Peripherals (child 10) ---
  {
    name: "Logitech MX Master 3S Mouse",
    nameBd: "লজটেক MX মাস্টার ৩S মাউস",
    brandId: 7, subId: 5, childId: 10, image: IMAGES.mouse1, image2: IMAGES.mouse3,
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
    brandId: 7, subId: 5, childId: 10, image: IMAGES.keyboard1, image2: IMAGES.desk1,
    short: "Low-profile illuminated keyboard for desk setups.",
    shortBd: "ডেস্ক সেটআপের জন্য লো-প্রোফাইল ইলুমিনেটেড কীবোর্ড।",
    skus: [
      { colorId: 4, variantId: 1, buy: 8500, sell: 12499, discount: 1000, stock: 15 },
    ],
  },
  {
    name: "Samsung T7 Shield 1TB SSD",
    nameBd: "স্যামসাং T7 শিল্ড ১TB SSD",
    brandId: 2, subId: 5, childId: 10, image: IMAGES.ssd1, image2: IMAGES.ssd2,
    short: "Rugged portable SSD for fast file backup and transfer.",
    shortBd: "দ্রুত ফাইল ব্যাকআপ ও ট্রান্সফারের জন্য রাগেড পোর্টেবল SSD।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 9000, sell: 13499, discount: 1000, stock: 20 },
      { colorId: 5, variantId: 1, buy: 9000, sell: 13499, discount: 1000, stock: 12 },
    ],
  },
  {
    name: "Aluminum Laptop Stand",
    nameBd: "অ্যালুমিনিয়াম ল্যাপটপ স্ট্যান্ড",
    brandId: 10, subId: 5, childId: 10, image: IMAGES.stand1, image2: IMAGES.desk1,
    short: "Ergonomic desk stand that improves airflow and posture.",
    shortBd: "এয়ারফ্লো ও পোশ্চার উন্নত করে এমন এরগনমিক ডেস্ক স্ট্যান্ড।",
    skus: [
      { colorId: 3, variantId: 1, buy: 1200, sell: 2199, discount: 200, stock: 45 },
      { colorId: 4, variantId: 1, buy: 1200, sell: 2199, discount: 200, stock: 30 },
    ],
  },
  {
    name: "Logitech C920s HD Webcam",
    nameBd: "লজটেক C920s HD ওয়েবক্যাম",
    brandId: 7, subId: 5, childId: 10, image: IMAGES.webcam1, image2: IMAGES.cam1,
    short: "1080p webcam with privacy shutter for meetings and class.",
    shortBd: "মিটিং ও ক্লাসের জন্য প্রাইভেসি শাটারসহ ১০৮০p ওয়েবক্যাম।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 24 },
    ],
  },
  // --- Mechanical keyboards (child 14) ---
  {
    name: "Razer BlackWidow V4",
    nameBd: "রেজার ব্ল্যাকউইডো V4",
    brandId: 16, subId: 5, childId: 14, image: IMAGES.keyboard2, image2: IMAGES.keyboard3,
    short: "Clicky mechanical keyboard with per-key RGB for gaming desks.",
    shortBd: "গেমিং ডেস্কের জন্য পার-কি RGBসহ ক্লিকি মেকানিক্যাল কীবোর্ড।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 11000, sell: 16499, discount: 1500, stock: 14 },
    ],
  },
  {
    name: "Logitech G Pro X TKL",
    nameBd: "লজটেক G প্রো X TKL",
    brandId: 7, subId: 5, childId: 14, image: IMAGES.keyboard3, image2: IMAGES.keyboard4,
    short: "Tournament tenkeyless board with swappable switches.",
    shortBd: "বদলানো যায় এমন সুইচসহ টুর্নামেন্ট টেনকিলেস বোর্ড।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 9500, sell: 13999, discount: 1200, stock: 16 },
      { colorId: 2, variantId: 1, buy: 9500, sell: 13999, discount: 1200, stock: 8 },
    ],
  },
  {
    name: "Asus ROG Azoth",
    nameBd: "আসুস ROG আজোথ",
    brandId: 11, subId: 5, childId: 14, image: IMAGES.keyboard4, image2: IMAGES.keyboard2,
    short: "Premium gasket-mount wireless board with OLED knob.",
    shortBd: "OLED নবসহ প্রিমিয়াম গ্যাসকেট-মাউন্ট ওয়্যারলেস বোর্ড।",
    skus: [
      { colorId: 1, variantId: 1, buy: 18000, sell: 24999, discount: 2000, stock: 7 },
    ],
  },
  // --- Phone cases (child 24) ---
  {
    name: "Spigen Tough Armor Phone Case",
    nameBd: "স্পিজেন টাফ আর্মার ফোন কেস",
    brandId: 10, subId: 5, childId: 24, image: IMAGES.case1, image2: IMAGES.case2,
    short: "Military-grade drop protection case for popular phones.",
    shortBd: "জনপ্রিয় ফোনের জন্য মিলিটারি-গ্রেড ড্রপ প্রোটেকশন কেস।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 900, sell: 1699, discount: 200, stock: 70 },
      { colorId: 5, variantId: 1, buy: 900, sell: 1699, discount: 200, stock: 40 },
    ],
  },
  {
    name: "Baseus Clear Soft Case",
    nameBd: "বেসিয়াস ক্লিয়ার সফট কেস",
    brandId: 10, subId: 5, childId: 24, image: IMAGES.case2, image2: IMAGES.case1,
    short: "Slim transparent case that shows the original phone color.",
    shortBd: "ফোনের আসল রং দেখায় এমন পাতলা ট্রান্সপারেন্ট কেস।",
    freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 400, sell: 799, discount: 100, stock: 90 },
    ],
  },
  // --- Consoles (child 11) ---
  {
    name: "PlayStation DualSense Controller",
    nameBd: "প্লেস্টেশন DualSense কন্ট্রোলার",
    brandId: 3, subId: 6, childId: 11, image: IMAGES.game1, image2: IMAGES.game2,
    short: "Haptic feedback wireless controller for PS5 and PC.",
    shortBd: "PS5 ও PC-এর জন্য হ্যাপটিক ফিডব্যাক ওয়্যারলেস কন্ট্রোলার।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 28 },
      { colorId: 1, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 20 },
      { colorId: 7, variantId: 1, buy: 4500, sell: 6999, discount: 500, stock: 10 },
    ],
  },
  {
    name: "DualSense Charging Station",
    nameBd: "DualSense চার্জিং স্টেশন",
    brandId: 3, subId: 6, childId: 11, image: IMAGES.game2, image2: IMAGES.game1,
    short: "Official dual-pad dock that charges two controllers overnight.",
    shortBd: "দুইটা কন্ট্রোলার রাতে চার্জ করে এমন অফিসিয়াল ডক।",
    skus: [
      { colorId: 1, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 22 },
    ],
  },
  {
    name: "Razer Wolverine V2 Controller",
    nameBd: "রেজার উলভারিন V2 কন্ট্রোলার",
    brandId: 16, subId: 6, childId: 11, image: IMAGES.game3, image2: IMAGES.game4,
    short: "Wired pro controller with extra bumpers for console shooters.",
    shortBd: "অতিরিক্ত বাম্পারসহ কনসোল শুটারের জন্য ওয়্যার্ড প্রো কন্ট্রোলার।",
    skus: [
      { colorId: 1, variantId: 1, buy: 5500, sell: 8499, discount: 700, stock: 14 },
    ],
  },
  // --- Gaming mice (child 21) ---
  {
    name: "Razer DeathAdder V3",
    nameBd: "রেজার ডেথঅ্যাডার V3",
    brandId: 16, subId: 6, childId: 21, image: IMAGES.mouse2, image2: IMAGES.mouse1,
    short: "Lightweight esports mouse with Focus Pro optical sensor.",
    shortBd: "Focus Pro অপটিক্যাল সেন্সরসহ হালকা ইস্পোর্টস মাউস।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 6500, sell: 9999, discount: 800, stock: 20 },
      { colorId: 2, variantId: 1, buy: 6500, sell: 9999, discount: 800, stock: 10 },
    ],
  },
  {
    name: "Logitech G Pro X Superlight",
    nameBd: "লজটেক G প্রো X সুপারলাইট",
    brandId: 7, subId: 6, childId: 21, image: IMAGES.mouse3, image2: IMAGES.mouse2,
    short: "Sub-60g wireless mouse used by many pro players.",
    shortBd: "অনেক প্রো প্লেয়ার ব্যবহার করে এমন সাব-৬০গ্রাম ওয়্যারলেস মাউস।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1000, stock: 16 },
      { colorId: 2, variantId: 1, buy: 8500, sell: 12999, discount: 1000, stock: 9 },
    ],
  },
  // --- Smart lights (child 19) ---
  {
    name: "Xiaomi Smart Bulb Essential",
    nameBd: "শাওমি স্মার্ট বাল্ব এসেনশিয়াল",
    brandId: 4, subId: 7, childId: 19, image: IMAGES.smarthome2, image2: IMAGES.smarthome3,
    short: "App-controlled warm-to-cool bulb for bedrooms and desks.",
    shortBd: "বেডরুম ও ডেস্কের জন্য অ্যাপ-কন্ট্রোল্ড উষ্ণ-ঠান্ডা বাল্ব।",
    freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 900, sell: 1499, discount: 150, stock: 80 },
    ],
  },
  {
    name: "TP-Link Tapo L530E Smart Bulb",
    nameBd: "টিপি-লিংক Tapo L530E স্মার্ট বাল্ব",
    brandId: 17, subId: 7, childId: 19, image: IMAGES.smarthome3, image2: IMAGES.smarthome2,
    short: "Full-color Wi-Fi bulb with schedules and voice assistants.",
    shortBd: "শিডিউল ও ভয়েস অ্যাসিস্ট্যান্টসহ ফুল-কালার ওয়াই-ফাই বাল্ব।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 1100, sell: 1799, discount: 200, stock: 70 },
    ],
  },
  {
    name: "Xiaomi LED Light Strip",
    nameBd: "শাওমি LED লাইট স্ট্রিপ",
    brandId: 4, subId: 7, childId: 19, image: IMAGES.smarthome3, image2: IMAGES.smarthome1,
    short: "RGB strip for TV backs and shelves, controlled from the app.",
    shortBd: "টিভি ব্যাক ও শেলফের জন্য অ্যাপ-কন্ট্রোল্ড RGB স্ট্রিপ।",
    skus: [
      { colorId: 1, variantId: 1, buy: 1800, sell: 2799, discount: 250, stock: 36 },
    ],
  },
  // --- Robot vacuums (child 20) ---
  {
    name: "Xiaomi Robot Vacuum S10",
    nameBd: "শাওমি রোবট ভ্যাকুয়াম S10",
    brandId: 4, subId: 7, childId: 20, image: IMAGES.vacuum1, image2: IMAGES.vacuum2,
    short: "LIDAR mapping robot vacuum with mopping for tiled floors.",
    shortBd: "টাইল ফ্লোরের জন্য মপিংসহ LIDAR ম্যাপিং রোবট ভ্যাকুয়াম।",
    featured: 1, bestDeal: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 22000, sell: 29999, discount: 2500, stock: 10, weight: 3.5 },
    ],
  },
  {
    name: "Xiaomi Robot Vacuum E10",
    nameBd: "শাওমি রোবট ভ্যাকুয়াম E10",
    brandId: 4, subId: 7, childId: 20, image: IMAGES.vacuum2, image2: IMAGES.vacuum1,
    short: "Compact robot vacuum for apartments and daily dust pickup.",
    shortBd: "ফ্ল্যাট ও দৈনন্দিন ধুলো তোলার কমপ্যাক্ট রোবট ভ্যাকুয়াম।",
    freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 12000, sell: 16999, discount: 1500, stock: 14, weight: 2.8 },
    ],
  },
  // --- Security cameras (child 22) ---
  {
    name: "Xiaomi Smart Camera C300",
    nameBd: "শাওমি স্মার্ট ক্যামেরা C300",
    brandId: 4, subId: 7, childId: 22, image: IMAGES.cam1, image2: IMAGES.smarthome1,
    short: "2K home security camera with night vision and app alerts.",
    shortBd: "নাইট ভিশন ও অ্যাপ অ্যালার্টসহ ২K হোম সিকিউরিটি ক্যামেরা।",
    skus: [
      { colorId: 2, variantId: 1, buy: 2800, sell: 4499, discount: 400, stock: 36 },
    ],
  },
  {
    name: "TP-Link Tapo C200",
    nameBd: "টিপি-লিংক Tapo C200",
    brandId: 17, subId: 7, childId: 22, image: IMAGES.smarthome1, image2: IMAGES.cam1,
    short: "Pan-tilt indoor camera with two-way audio and motion track.",
    shortBd: "টু-ওয়ে অডিও ও মোশন ট্র্যাকসহ প্যান-টিল্ট ইনডোর ক্যামেরা।",
    bestDeal: 1, freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 2200, sell: 3499, discount: 300, stock: 42 },
    ],
  },
  // --- Action cameras (child 17) ---
  {
    name: "Xiaomi Action Camera 4K",
    nameBd: "শাওমি অ্যাকশন ক্যামেরা ৪K",
    brandId: 4, subId: 8, childId: 17, image: IMAGES.action1, image2: IMAGES.action2,
    short: "Waterproof action cam for travel, bikes, and sports.",
    shortBd: "ট্রাভেল, বাইক ও স্পোর্টসের জন্য ওয়াটারপ্রুফ অ্যাকশন ক্যাম।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 8500, sell: 12999, discount: 1200, stock: 18 },
    ],
  },
  {
    name: "Sony ZV-1 II Vlog Camera",
    nameBd: "সনি ZV-1 II ভ্লগ ক্যামেরা",
    brandId: 3, subId: 8, childId: 17, image: IMAGES.action3, image2: IMAGES.cam5,
    short: "Compact vlog camera with product-showcase focus and mic input.",
    shortBd: "প্রোডাক্ট শোকেস ফোকাস ও মাইক ইনপুটসহ কমপ্যাক্ট ভ্লগ ক্যামেরা।",
    skus: [
      { colorId: 1, variantId: 1, buy: 62000, sell: 79999, discount: 4000, stock: 6, weight: 0.3 },
    ],
  },
  // --- DSLR / Mirrorless (child 18) ---
  {
    name: "Canon EOS R50 Mirrorless",
    nameBd: "ক্যানন EOS R50 মিররলেস",
    brandId: 18, subId: 8, childId: 18, image: IMAGES.cam2, image2: IMAGES.cam3,
    short: "Entry RF-mount camera for photos, reels, and travel.",
    shortBd: "ছবি, রিলস ও ট্রাভেলের জন্য এন্ট্রি RF-মাউন্ট ক্যামেরা।",
    featured: 1, bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 58000, sell: 74999, discount: 4000, stock: 8, weight: 0.38 },
      { colorId: 2, variantId: 1, buy: 58000, sell: 74999, discount: 4000, stock: 5, weight: 0.38 },
    ],
  },
  {
    name: "Sony Alpha ZV-E10",
    nameBd: "সনি আলফা ZV-E10",
    brandId: 3, subId: 8, childId: 18, image: IMAGES.cam4, image2: IMAGES.cam6,
    short: "APS-C vlog body with flip screen and interchangeable lenses.",
    shortBd: "ফ্লিপ স্ক্রিন ও ইন্টারচেঞ্জেবল লেন্সসহ APS-C ভ্লগ বডি।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 62000, sell: 79999, discount: 3500, stock: 7, weight: 0.34 },
    ],
  },
  {
    name: "Canon EOS 2000D Kit",
    nameBd: "ক্যানন EOS 2000D কিট",
    brandId: 18, subId: 8, childId: 18, image: IMAGES.cam5, image2: IMAGES.cam2,
    short: "Beginner DSLR kit with 18-55mm lens for campus photography.",
    shortBd: "ক্যাম্পাস ফটোগ্রাফির জন্য ১৮-৫৫মিমি লেন্সসহ বিগিনার ডিএসএলআর কিট।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 32000, sell: 42999, discount: 2500, stock: 11, weight: 0.8 },
    ],
  },
  // --- Wi-Fi routers (child 16) ---
  {
    name: "TP-Link AX3000 Wi-Fi 6 Router",
    nameBd: "টিপি-লিংক AX3000 Wi-Fi ৬ রাউটার",
    brandId: 17, subId: 9, childId: 16, image: IMAGES.router1, image2: IMAGES.router4,
    short: "Dual-band Wi-Fi 6 router for faster home networking.",
    shortBd: "দ্রুত হোম নেটওয়ার্কিংয়ের জন্য ডুয়াল-ব্যান্ড Wi-Fi ৬ রাউটার।",
    featured: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 4200, sell: 6499, discount: 500, stock: 24 },
    ],
  },
  {
    name: "Asus RT-AX55 Wi-Fi 6",
    nameBd: "আসুস RT-AX55 Wi-Fi ৬",
    brandId: 11, subId: 9, childId: 16, image: IMAGES.router4, image2: IMAGES.router2,
    short: "AiProtection router with easy mesh for larger flats.",
    shortBd: "বড় ফ্ল্যাটের জন্য ইজি মেশসহ AiProtection রাউটার।",
    bestDeal: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 6500, sell: 9499, discount: 800, stock: 16 },
    ],
  },
  {
    name: "TP-Link Archer C80",
    nameBd: "টিপি-লিংক Archer C80",
    brandId: 17, subId: 9, childId: 16, image: IMAGES.router2, image2: IMAGES.router1,
    short: "AC1900 router that upgrades older home Wi-Fi without fuss.",
    shortBd: "পুরনো হোম ওয়াই-ফাই আপগ্রেড করে এমন AC1900 রাউটার।",
    freeDelivery: 1,
    skus: [
      { colorId: 1, variantId: 1, buy: 2800, sell: 4299, discount: 400, stock: 28 },
    ],
  },
  {
    name: "TP-Link Deco X20 Mesh (2-pack)",
    nameBd: "টিপি-লিংক Deco X20 মেশ (২-প্যাক)",
    brandId: 17, subId: 9, childId: 16, image: IMAGES.router3, image2: IMAGES.router1,
    short: "Whole-home Wi-Fi 6 mesh that covers stairs and dead zones.",
    shortBd: "সিঁড়ি ও ডেড জোন ঢেকে দেয় এমন হোল-হোম Wi-Fi ৬ মেশ।",
    featured: 1, freeDelivery: 1,
    skus: [
      { colorId: 2, variantId: 1, buy: 11000, sell: 16499, discount: 1500, stock: 12 },
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
    // Second gallery angle — prefer a distinct shot so the PDP is not a duplicate.
    await q(
      conn,
      `INSERT INTO product_images (id, product_id, img_path, serial, sku_id) VALUES (?,?,?,?,NULL)`,
      [imageId++, productId, p.image2 || p.image, 2]
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
  // Keep 5 Home Top so existing carousel/side split stays intact.
  // Home Middle: OfferBanners section — extra tiles for new subs 7–9.
  const banners = [
    { title: "Flagship Smartphones", zone: "Home Top", img: IMAGES.heroPhones, path: "/shop?sub=1" },
    { title: "Laptops Built for Speed", zone: "Home Top", img: IMAGES.heroLaptops, path: "/shop?sub=2" },
    { title: "Immersive Wireless Audio", zone: "Home Top", img: IMAGES.heroAudio, path: "/shop?sub=3" },
    { title: "Gaming Controllers", zone: "Home Top", img: IMAGES.heroGaming, path: "/shop?sub=6" },
    { title: "Desk Accessories", zone: "Home Top", img: IMAGES.heroAccess, path: "/shop?sub=5" },
    { title: "Wearables Flash Sale", zone: "Home Middle", img: IMAGES.offerWear, path: "/shop?sub=4" },
    { title: "Power & Desk Essentials", zone: "Home Middle", img: IMAGES.offerDesk, path: "/shop?sub=5" },
    { title: "Smarter Homes", zone: "Home Middle", img: IMAGES.heroSmart, path: "/shop?sub=7" },
    { title: "Cameras & Creators", zone: "Home Middle", img: IMAGES.heroCameras, path: "/shop?sub=8" },
    { title: "Faster Home Wi-Fi", zone: "Home Middle", img: IMAGES.heroNetwork, path: "/shop?sub=9" },
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
          "User-Agent": "TechShopSeed/1.0 (catalog image materializer)",
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
 * Failed downloads reuse the last good tech buffer so rows never stay remote-only.
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
      // Last resort: reuse any already-written tech webp so the row is still local.
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
    const local = `/uploads/faceimage/face_tech_${row.id}.webp`;
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
    const local = `/uploads/products/tech_${slug}_${row.serial}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE product_images SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [mains] = await q(conn, "SELECT id, img_path FROM main_categories");
  for (const row of mains) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/main/tech_main_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE main_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [subs] = await q(conn, "SELECT id, img_path FROM sub_categories");
  for (const row of subs) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/sub/tech_sub_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE sub_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [children] = await q(conn, "SELECT id, img_path FROM child_categories");
  for (const row of children) {
    if (!row.img_path) continue;
    const local = `/uploads/categories/child/tech_child_${row.id}.webp`;
    const pathOut = await convertRow(row.img_path, local, PRODUCT_MAX, PRODUCT_MAX);
    if (pathOut !== row.img_path) {
      await q(conn, "UPDATE child_categories SET img_path=? WHERE id=?", [pathOut, row.id]);
    }
  }

  const [banners] = await q(conn, "SELECT id, img_path FROM banners");
  for (const row of banners) {
    if (!row.img_path) continue;
    const local = `/uploads/banners/tech_hero_${row.id}.webp`;
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
    console.log(`✅ Tech catalog ready on ${cfg.database} (${PRODUCTS.length} products in seed)`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
