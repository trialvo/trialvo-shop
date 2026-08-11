const { v4: uuidv4 } = require('uuid');
const catalogImages = require('./catalogImages');

/**
 * Fashion e-commerce — own demo API/admin/shop + fashion_demo DB.
 */
const SHOP_URL =
  process.env.FASHION_DEMO_SHOP_URL ||
  'http://localhost:5101';
const ADMIN_URL =
  process.env.FASHION_DEMO_ADMIN_URL ||
  'http://localhost:5175';
const API_URL =
  process.env.FASHION_DEMO_API_URL ||
  'http://localhost:9101';
const DEMO_DB =
  process.env.FASHION_DEMO_DB_NAME ||
  'fashion_demo';

module.exports = {
  table: 'products',
  alwaysRun: true,
  async run(client) {
    const slug = 'fashion-ecommerce';
    const existing = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
    const id = existing.rows[0]?.id || uuidv4();

    const demo = JSON.stringify([
      {
        label: { bn: 'শপ ওয়েবসাইট (পাবলিক)', en: 'Shop website (public)' },
        url: SHOP_URL,
        username: '',
        password: '',
      },
      {
        label: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin panel' },
        url: ADMIN_URL,
        username: '',
        password: '',
      },
    ]);

    const payload = {
      slug,
      category: 'fashion',
      price_bdt: 45000,
      price_usd: 450,
      thumbnail: catalogImages.fashion.thumbnail,
      images: JSON.stringify({
        admin: catalogImages.fashion.admin,
        shop: catalogImages.fashion.shop,
      }),
      demo,
      name: JSON.stringify({
        bn: 'ফ্যাশন ই-কমার্স',
        en: 'Fashion E-Commerce',
      }),
      short_description: JSON.stringify({
        bn: 'ফ্যাশন ব্র্যান্ডের জন্য সম্পূর্ণ অনলাইন দোকান — রং ও সাইজ বেছে কেনা, মেগা সেল, কম্পেয়ার, বাংলাদেশি পেমেন্ট ও কুরিয়ার সহ।',
        en: 'A complete online store for fashion brands — shop by color and size, Mega Sale, product compare, Bangladesh payments and courier shipping.',
      }),
      features: JSON.stringify({
        bn: [
          'রং ও সাইজ বেছে প্রোডাক্ট কিনতে পারবেন',
          'বড় ক্যাটাগরি মেনু — ছবি সহ সহজে ন্যাভিগেট',
          'প্রোডাক্ট তুলনা (কম্পেয়ার) ও বাজেট প্ল্যানার',
          'মেগা সেল — কাউন্টডাউন টাইমার সহ',
          'বাল্ক কেনা ও কম্বো অফার পেজ',
          'তালিকায় থেকেই দ্রুত কার্টে যোগ (কুইক অ্যাড)',
          'গ্রাহকরা অ্যাকাউন্ট ছাড়াই কিনতে পারেন',
          'বাংলাদেশি পেমেন্ট: বিকাশ, নগদ, রকেট, SSLCommerz, ShurjoPay ও ক্যাশ অন ডেলিভারি',
          'কুরিয়ার: স্টিডফাস্ট, পাঠাও, রেডএক্স, পেপারফ্লাই — একসাথে বা বাল্ক পাঠানো',
          'উইশলিস্ট / ফেভারিট সংরক্ষণ',
          'বাংলা ও ইংরেজি দোকান ও অ্যাডমিন',
          'সাইজ চার্ট ও কেয়ার ইনফো প্রোডাক্ট পেজে',
          'Google লগইন ও WhatsApp চ্যাট বাটন',
          'অ্যাডমিন থেকে দোকানের অর্ডার তৈরি (নিউ সেল / POS)',
          'অর্ডার এডিট, ইনভয়েস প্রিন্ট ও রিফান্ড',
          'গেস্ট অর্ডার আলাদা কিউ',
          'স্টাফদের মধ্যে অর্ডার অটো/ম্যানুয়াল ভাগ',
          'রং×সাইজ ভ্যারিয়েন্ট ম্যাট্রিক্স — প্রতি সেলে স্টক ও দাম',
          'কুপন, ফ্রি ডেলিভারি ও পুরো কার্টে ছাড়',
          'ইমেইল / SMS দিয়ে ঘোষণা পাঠানো (শিডিউল সহ)',
          'হোমপেজ ব্যানার, ভিডিও ও নীতিমালা পেজ',
          'যোগাযোগ ইনবক্স ও সাপোর্ট রিপোর্ট — স্টাফে অ্যাসাইন',
          'বিক্রি, স্টক, জেলা ও ভিজিটর রিপোর্ট (CSV/PDF)',
          'Google Analytics, GTM, Facebook Pixel ও Clarity সেটআপ',
          'SMS, ইমেইল ও পুশ নোটিফিকেশন + পাঠানোর ইতিহাস',
          'রিভিউ মডারেশন ও গ্রাহক তালিকা',
          'একটি প্রোডাক্টের আলাদা কেনার পেজ',
          'ফোন নম্বর যাচাই ও কম স্টক অ্যালার্ট',
          'স্টাফ রোল ও অডিট লগ',
        ],
        en: [
          'Shoppers can buy by color and size',
          'Big category menu with images — easy to browse',
          'Product compare and budget planner',
          'Mega Sale with countdown timers',
          'Bulk-buy and combo offer pages',
          'Quick add to cart from the product list',
          'Customers can buy without creating an account',
          'Bangladesh payments: bKash, Nagad, Rocket, SSLCommerz, ShurjoPay & cash on delivery',
          'Couriers: Steadfast, Pathao, RedX & Paperfly — send one by one or in bulk',
          'Wishlist / favorites',
          'Bangla and English shop and admin',
          'Size chart and care info on product pages',
          'Google login and WhatsApp chat button',
          'Create walk-in orders from the admin (New Sale / POS)',
          'Edit orders, print invoices and process refunds',
          'Separate queue for guest orders',
          'Auto or manual order sharing among staff',
          'Color×size variant matrix — stock and price per cell',
          'Coupons, free delivery and whole-cart discounts',
          'Send announcements by email or SMS (with schedule)',
          'Homepage banners, video and policy pages',
          'Contact inbox and support reports — assign to staff',
          'Sales, stock, district and visitor reports (CSV/PDF)',
          'Google Analytics, GTM, Facebook Pixel and Clarity setup',
          'SMS, email and push notifications plus send history',
          'Review moderation and customer list',
          'One-product buy page for focused selling',
          'Phone number checks and low-stock alerts',
          'Staff roles and activity audit logs',
        ],
      }),
      facilities: JSON.stringify({
        bn: [
          '১৪ দিন ফ্রি ট্রায়াল — লাইভ ডেমো দোকান দেখে নিন',
          'Trialvo তে হোস্টেড ট্রায়াল (Option 1)',
          'নিজের সার্ভারে ইনস্টল করে চালানো যায় (Option 2)',
          'ফ্যাশন ব্যবসার জন্য রং–সাইজ ও মেগা মেনু রেডি',
          'বাংলাদেশি পেমেন্ট ও কুরিয়ার আগে থেকে যুক্ত',
          'সোর্স কোড সহ — আজীবন আপডেট',
          'দ্রুত ডেমো চালু — কয়েক মিনিটে দেখা যায়',
        ],
        en: [
          '14-day free trial — try the live demo store',
          'Hosted trial on Trialvo (Option 1)',
          'Install on your own server (Option 2)',
          'Color–size shopping and mega menu ready for fashion',
          'Bangladesh payments and couriers ready to use',
          'Full source code with lifetime updates',
          'Quick demo start — see it running in minutes',
        ],
      }),
      faq: JSON.stringify([]),
      seo: JSON.stringify({
        title: { bn: 'ফ্যাশন ই-কমার্স', en: 'Fashion E-Commerce — Trialvo' },
        description: {
          bn: 'ফ্যাশন ব্র্যান্ডের জন্য সম্পূর্ণ অনলাইন দোকান — রং/সাইজ, মেগা সেল, পেমেন্ট ও কুরিয়ার সহ।',
          en: 'Complete online store for fashion brands — color/size, Mega Sale, payments and couriers included.',
        },
        keywords: {
          bn: ['ফ্যাশন', 'অনলাইন দোকান', 'ইকমার্স'],
          en: ['fashion', 'online store', 'ecommerce', 'clothing'],
        },
      }),
      deploy_config: JSON.stringify({
        image_api: 'fashion-api:trial',
        image_shop: 'fashion-shop:trial',
        image_admin: 'fashion-admin:trial',
        image_agent: 'fashion-license-agent:trial',
        default_trial_days: 14,
        supports_option1: true,
        supports_option2: true,
        shared_demo: true,
        shared_demo_shop_url: SHOP_URL,
        shared_demo_admin_url: ADMIN_URL,
        shared_demo_api_url: API_URL,
        shared_demo_db_name: DEMO_DB,
      }),
    };

    if (existing.rows.length) {
      await client.query(
        `UPDATE products SET
          category=$2, price_bdt=$3, price_usd=$4, thumbnail=$5, images=$6, demo=$7,
          name=$8, short_description=$9, features=$10, facilities=$11,
          seo=$12, deploy_config=$13, is_trialable=1, is_active=1, is_featured=1,
          updated_at=NOW()
         WHERE slug=$1`,
        [
          slug, payload.category, payload.price_bdt, payload.price_usd, payload.thumbnail,
          payload.images, payload.demo, payload.name, payload.short_description, payload.features,
          payload.facilities, payload.seo, payload.deploy_config,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, demo,
          name, short_description, features, facilities, faq, seo, is_featured, is_active,
          deploy_config, is_trialable)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'[]',$13,1,1,$14,1)`,
        [
          id, slug, payload.category, payload.price_bdt, payload.price_usd, payload.thumbnail,
          payload.images, payload.demo, payload.name, payload.short_description, payload.features,
          payload.facilities, payload.seo, payload.deploy_config,
        ]
      );
    }
  },
};
