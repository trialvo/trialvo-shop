const { v4: uuidv4 } = require('uuid');
const catalogImages = require('./catalogImages');

/**
 * Combo Basket — gift/combo ecommerce (distinct stack: Express API + Vite admin + Next shop).
 */
const SHOP_URL =
  process.env.COMBO_DEMO_SHOP_URL ||
  'http://localhost:5103';
const ADMIN_URL =
  process.env.COMBO_DEMO_ADMIN_URL ||
  'http://localhost:5177';
const API_URL =
  process.env.COMBO_DEMO_API_URL ||
  'http://localhost:9103';
const DEMO_DB =
  process.env.COMBO_DEMO_DB_NAME ||
  'combobasket_demo';

module.exports = {
  table: 'products',
  alwaysRun: true,
  async run(client) {
    const slug = 'combo-basket-ecommerce';
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
      category: 'gift',
      price_bdt: 20000,
      price_usd: 200,
      thumbnail: catalogImages.combobasket.thumbnail,
      images: JSON.stringify({
        admin: catalogImages.combobasket.admin,
        shop: catalogImages.combobasket.shop,
      }),
      demo,
      name: JSON.stringify({
        bn: 'কম্বো বাস্কেট ই-কমার্স',
        en: 'Combo Basket E-Commerce',
      }),
      short_description: JSON.stringify({
        bn: 'গিফট ও কম্বো দোকানের জন্য তৈরি — নিজে কম্বো বানান, রেডিমেড প্যাকেজ কিনুন, ক্যাশ অন ডেলিভারি ও বাংলা দোকান একসাথে।',
        en: 'Built for gift and combo shops — customers build their own combos, buy ready packages, pay cash on delivery, and shop in Bangla.',
      }),
      features: JSON.stringify({
        bn: [
          'নিজে কম্বো বানান (কম্বো বিল্ডার)',
          'রেডিমেড গিফট / কম্বো প্যাকেজ',
          'তিনভাবে কেনা: সিঙ্গেল, নিজের কম্বো, রেডি প্যাকেজ',
          'দুইটি আলাদা কার্ট — সাধারণ ও কম্বো',
          'গিফট চেকআউট — প্রেরক, প্রাপক ও নোট',
          'ক্যাশ অন ডেলিভারি সহ বিকাশ, নগদ ও কার্ড',
          'বাংলায় দোকান ও অ্যাডমিন প্যানেল',
          'অর্ডারে ফোন নম্বর যাচাই',
          'প্রতি মোডে আলাদা ছাড় ও ফ্রি ডেলিভারি নিয়ম',
          'কুপন কোড (সব / সিঙ্গেল / কম্বো অনুযায়ী)',
          'ডেলিভারি জোন — চার্জ ও আনুমানিক সময় সহ',
          'উইশলিস্ট ও প্রোডাক্ট সার্চ',
          'প্রোডাক্ট রিভিউ ও রেটিং (অ্যাডমিন থেকে মুছে ফেলা যায়)',
          'অ্যাকাউন্ট: অর্ডার, ঠিকানা, সেটিংস',
          'একটি প্রোডাক্টের আলাদা কেনার পেজ (ল্যান্ডিং)',
          'হোমপেজ স্লাইডার (ড্র্যাগ–রিঅর্ডার) ও FAQ',
          'ওয়েবসাইট সেটিংস — WhatsApp, সোশ্যাল, অ্যাবাউট ও হোম সেকশন অন/অফ',
          'যোগাযোগ বার্তা ইনবক্স',
          'নিউজলেটার সাবস্ক্রাইবার তালিকা (CSV এক্সপোর্ট)',
          'বিক্রি ও অর্ডার রিপোর্ট — অর্ডার CSV এক্সপোর্ট',
          'গেস্ট অর্ডার আলাদা কিউ',
          'অ্যাডমিন থেকে কম্বো প্যাকেজ তৈরি, দাম ও স্টক সেট',
          'ক্যাটাগরি (বাংলা নাম, আইকন, ড্র্যাগ–রিঅর্ডার)',
          'প্রোডাক্টে ক্রয়মূল্য ও লাভ দেখা (শুধু অ্যাডমিন)',
          'ছবি ক্রপ করে আপলোড (প্রোডাক্ট ও কম্বো)',
          'স্টাফ কার্যকলাপের অডিট লগ',
        ],
        en: [
          'Build your own combo (Combo Builder)',
          'Ready-made gift / combo packages',
          'Three ways to buy: single, custom combo, ready package',
          'Two separate carts — regular and combo',
          'Gift checkout — sender, recipient and note',
          'Cash on delivery plus bKash, Nagad and card',
          'Bangla shop and admin panel',
          'Phone number checks on orders',
          'Separate discount and free-delivery rules per buy mode',
          'Coupon codes (all / single / combo)',
          'Delivery zones with charge and estimated time',
          'Wishlist and product search',
          'Product reviews and ratings (remove from admin)',
          'Account: orders, addresses, settings',
          'One-product buy / landing page',
          'Homepage slider (drag-reorder) and FAQ',
          'Website settings — WhatsApp, social, About and home section on/off',
          'Contact message inbox',
          'Newsletter subscriber list (CSV export)',
          'Sales and order reports — export orders as CSV',
          'Separate queue for guest orders',
          'Create combo packages and set price and stock in admin',
          'Categories (Bangla names, icons, drag-reorder)',
          'See purchase cost and profit on products (admin only)',
          'Crop images before upload (products and combos)',
          'Staff activity audit log',
        ],
      }),
      facilities: JSON.stringify({
        bn: [
          '১৪ দিন ফ্রি ট্রায়াল — লাইভ ডেমো দোকান দেখে নিন',
          'Trialvo তে হোস্টেড ট্রায়াল (Option 1)',
          'cPanel বা নিজের সার্ভারে চালানো যায় (Option 2)',
          'গিফট ও কম্বো ব্যবসার ফ্লো আগে থেকে তৈরি',
          'বাংলা দোকান — স্থানীয় গ্রাহকের জন্য সহজ',
          'সোর্স কোড সহ — আজীবন আপডেট',
          'দ্রুত ডেমো চালু — কয়েক মিনিটে দেখা যায়',
        ],
        en: [
          '14-day free trial — try the live demo store',
          'Hosted trial on Trialvo (Option 1)',
          'Run on cPanel or your own server (Option 2)',
          'Gift and combo business flow ready out of the box',
          'Bangla storefront — easy for local customers',
          'Full source code with lifetime updates',
          'Quick demo start — see it running in minutes',
        ],
      }),
      faq: JSON.stringify([]),
      seo: JSON.stringify({
        title: { bn: 'কম্বো বাস্কেট ই-কমার্স', en: 'Combo Basket E-Commerce — Trialvo' },
        description: {
          bn: 'গিফট ও কম্বো দোকান — কম্বো বিল্ডার, রেডি প্যাকেজ, ক্যাশ অন ডেলিভারি ও বাংলা দোকান সহ।',
          en: 'Gift and combo shop — combo builder, ready packages, cash on delivery and Bangla storefront included.',
        },
        keywords: {
          bn: ['কম্বো', 'গিফট', 'অনলাইন দোকান'],
          en: ['combo', 'gift', 'bundle', 'online store'],
        },
      }),
      deploy_config: JSON.stringify({
        image_api: 'combobasket-api:trial',
        image_shop: 'combobasket-shop:trial',
        image_admin: 'combobasket-admin:trial',
        default_trial_days: 14,
        supports_option1: true,
        supports_option2: true,
        shared_demo: true,
        installer_mode: 'node_only',
        demo_admin_schema: 'combo_basket',
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
