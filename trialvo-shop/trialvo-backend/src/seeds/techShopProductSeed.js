const { v4: uuidv4 } = require('uuid');
const catalogImages = require('./catalogImages');

/**
 * Tech shop e-commerce — own demo API/admin/shop + techshop_demo DB.
 */
const SHOP_URL =
  process.env.TECH_DEMO_SHOP_URL ||
  'http://localhost:5102';
const ADMIN_URL =
  process.env.TECH_DEMO_ADMIN_URL ||
  'http://localhost:5176';
const API_URL =
  process.env.TECH_DEMO_API_URL ||
  'http://localhost:9102';
const DEMO_DB =
  process.env.TECH_DEMO_DB_NAME ||
  'techshop_demo';

module.exports = {
  table: 'products',
  alwaysRun: true,
  async run(client) {
    const slug = 'tech-shop-ecommerce';
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
      category: 'tech',
      price_bdt: 48000,
      price_usd: 480,
      thumbnail: catalogImages.tech.thumbnail,
      images: JSON.stringify({
        admin: catalogImages.tech.admin,
        shop: catalogImages.tech.shop,
      }),
      demo,
      name: JSON.stringify({
        bn: 'টেক শপ ই-কমার্স',
        en: 'Tech Shop E-Commerce',
      }),
      short_description: JSON.stringify({
        bn: 'ইলেকট্রনিক্স ও গ্যাজেটের জন্য সম্পূর্ণ অনলাইন দোকান — প্রোডাক্ট তুলনা, উইশলিস্ট, বাংলাদেশি পেমেন্ট ও কুরিয়ার সহ।',
        en: 'A complete online store for electronics and gadgets — product compare, wishlist, Bangladesh payments and courier shipping.',
      }),
      features: JSON.stringify({
        bn: [
          'দুই প্রোডাক্ট পাশাপাশি তুলনা — নিচে ভাসমান কম্পেয়ার বার',
          'বাজেট প্ল্যানার — বাজেটের মধ্যে কেনা পরিকল্পনা',
          'উইশলিস্ট ও অ্যাকাউন্ট ড্যাশবোর্ড',
          'গ্রাহকরা অ্যাকাউন্ট ছাড়াই কিনতে পারেন',
          'অর্ডার আইডি দিয়ে স্ট্যাটাস দেখা যায়',
          'বাংলাদেশি পেমেন্ট: বিকাশ, নগদ, রকেট, SSLCommerz, ShurjoPay ও ক্যাশ অন ডেলিভারি',
          'কুরিয়ার: স্টিডফাস্ট, পাঠাও, রেডএক্স, পেপারফ্লাই — একসাথে বা বাল্ক পাঠানো',
          'ক্যাটাগরি, ব্র্যান্ড, রং ও স্পেক অনুযায়ী ক্যাটালগ',
          'মেগা সেল, বাল্ক, কম্বো ও পুরো কার্টে ছাড়',
          'তালিকা থেকে কুইক ভিউ — পেজ না খুলেই দেখা',
          'Google দিয়ে সহজে লগইন',
          'অ্যাডমিন থেকে দোকানের অর্ডার তৈরি (নিউ সেল / POS)',
          'অর্ডার এডিট, ইনভয়েস প্রিন্ট ও রিফান্ড',
          'গেস্ট অর্ডার আলাদা কিউ',
          'স্টাফদের মধ্যে অর্ডার অটো/ম্যানুয়াল ভাগ',
          'স্টাফ রোল — কে কী দেখতে/করতে পারবে',
          'ইমেইল / SMS দিয়ে ঘোষণা পাঠানো (শিডিউল সহ)',
          'হোমপেজ ব্যানার, ভিডিও ও নীতিমালা পেজ',
          'প্রোডাক্ট রিভিউ মডারেশন',
          'যোগাযোগ ইনবক্স ও সাপোর্ট রিপোর্ট — স্টাফে অ্যাসাইন',
          'বিক্রি, স্টক, জেলা ও ভিজিটর রিপোর্ট (CSV/PDF)',
          'Google Analytics, GTM, Facebook Pixel ও Clarity সেটআপ',
          'SMS, ইমেইল ও পুশ নোটিফিকেশন + পাঠানোর ইতিহাস',
          'বাংলা ও ইংরেজি অ্যাডমিন ভাষা',
          'একটি প্রোডাক্টের আলাদা কেনার পেজ',
          'ফোন নম্বর যাচাই ও কম স্টক অ্যালার্ট',
          'স্টাফ ও গ্রাহক কার্যকলাপের অডিট লগ',
        ],
        en: [
          'Compare two products side by side — floating compare bar',
          'Budget planner — plan buys within a spend limit',
          'Wishlist and customer account dashboard',
          'Customers can buy without creating an account',
          'Check order status with an order ID',
          'Bangladesh payments: bKash, Nagad, Rocket, SSLCommerz, ShurjoPay & cash on delivery',
          'Couriers: Steadfast, Pathao, RedX & Paperfly — send one by one or in bulk',
          'Catalog by category, brand, color and specs',
          'Mega Sale, bulk, combo and whole-cart discounts',
          'Quick view from the list — peek without leaving the page',
          'Easy login with Google',
          'Create walk-in orders from the admin (New Sale / POS)',
          'Edit orders, print invoices and process refunds',
          'Separate queue for guest orders',
          'Auto or manual order sharing among staff',
          'Staff roles — who can see or do what',
          'Send announcements by email or SMS (with schedule)',
          'Homepage banners, video and policy pages',
          'Product review moderation',
          'Contact inbox and support reports — assign to staff',
          'Sales, stock, district and visitor reports (CSV/PDF)',
          'Google Analytics, GTM, Facebook Pixel and Clarity setup',
          'SMS, email and push notifications plus send history',
          'Bangla and English admin language',
          'One-product buy page for focused selling',
          'Phone number checks and low-stock alerts',
          'Staff and customer activity audit logs',
        ],
      }),
      facilities: JSON.stringify({
        bn: [
          '১৪ দিন ফ্রি ট্রায়াল — লাইভ ডেমো দোকান দেখে নিন',
          'Trialvo তে হোস্টেড ট্রায়াল (Option 1)',
          'নিজের সার্ভারে ইনস্টল করে চালানো যায় (Option 2)',
          'গ্যাজেট কেনার জন্য তুলনা ও উইশলিস্ট রেডি',
          'বাংলাদেশি পেমেন্ট ও কুরিয়ার আগে থেকে যুক্ত',
          'সোর্স কোড সহ — আজীবন আপডেট',
          'দ্রুত ডেমো চালু — কয়েক মিনিটে দেখা যায়',
        ],
        en: [
          '14-day free trial — try the live demo store',
          'Hosted trial on Trialvo (Option 1)',
          'Install on your own server (Option 2)',
          'Compare and wishlist ready for gadget shopping',
          'Bangladesh payments and couriers ready to use',
          'Full source code with lifetime updates',
          'Quick demo start — see it running in minutes',
        ],
      }),
      faq: JSON.stringify([]),
      seo: JSON.stringify({
        title: { bn: 'টেক শপ ই-কমার্স', en: 'Tech Shop E-Commerce — Trialvo' },
        description: {
          bn: 'ইলেকট্রনিক্স ও গ্যাজেটের জন্য সম্পূর্ণ অনলাইন দোকান — তুলনা, পেমেন্ট ও কুরিয়ার সহ।',
          en: 'Complete online store for electronics and gadgets — compare, payments and couriers included.',
        },
        keywords: {
          bn: ['টেক শপ', 'গ্যাজেট', 'অনলাইন দোকান'],
          en: ['tech shop', 'gadgets', 'electronics', 'online store'],
        },
      }),
      deploy_config: JSON.stringify({
        image_api: 'techshop-api:trial',
        image_shop: 'techshop-shop:trial',
        image_admin: 'techshop-admin:trial',
        image_agent: 'techshop-license-agent:trial',
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
