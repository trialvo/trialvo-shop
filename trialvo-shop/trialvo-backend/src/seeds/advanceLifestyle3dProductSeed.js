const { v4: uuidv4 } = require('uuid');
const catalogImages = require('./catalogImages');

const SHOP_URL =
  process.env.ADV_LIFESTYLE_3D_DEMO_SHOP_URL ||
  'http://localhost:5104';
const ADMIN_URL =
  process.env.ADV_LIFESTYLE_3D_DEMO_ADMIN_URL ||
  'http://localhost:5178';
const API_URL =
  process.env.ADV_LIFESTYLE_3D_DEMO_API_URL ||
  'http://localhost:9104';
const DEMO_DB =
  process.env.ADV_LIFESTYLE_3D_DEMO_DB_NAME ||
  'advlifestyle3d_demo';

// Experiment catalog entry — same Lifestyle stack, isolated demo ports/DB.
module.exports = {
    table: 'products',
    alwaysRun: true,
    async run(client) {
        const slug = 'advance-lifestyle-3d-ecommerce';
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
            category: 'ecommerce',
            price_bdt: 75000,
            price_usd: 750,
            thumbnail: catalogImages.advlifestyle3d.thumbnail,
            images: JSON.stringify({
                admin: catalogImages.advlifestyle3d.admin,
                shop: catalogImages.advlifestyle3d.shop,
            }),
            demo,
            name: JSON.stringify({
                bn: 'অ্যাডভান্স লাইফস্টাইল 3D',
                en: 'Advance Lifestyle 3D',
            }),
            short_description: JSON.stringify({
                bn: 'লাইফস্টাইল ই-কমার্সের মতো সম্পূর্ণ অনলাইন দোকান — গ্রাহক শপ, মালিক অ্যাডমিন প্যানেল, বাংলাদেশি পেমেন্ট ও কুরিয়ার একসাথে।',
                en: 'Same complete online store as Lifestyle — customer shop, owner admin panel, Bangladesh payments and courier shipping in one package.',
            }),
            features: JSON.stringify({
                bn: [
                    'গ্রাহকরা অ্যাকাউন্ট ছাড়াই কিনতে পারেন',
                    'বাংলাদেশি পেমেন্ট: বিকাশ, নগদ, রকেট, SSLCommerz, ShurjoPay ও ক্যাশ অন ডেলিভারি',
                    'কুরিয়ার: স্টিডফাস্ট, পাঠাও, রেডএক্স, পেপারফ্লাই — একসাথে বা বাল্ক পাঠানো',
                    'মেগা সেল, বাল্ক ও কম্বো ছাড়ের নিয়ম অ্যাডমিন থেকে',
                    'কুপন কোড ও পুরো কার্টে ছাড়',
                    'উইশলিস্ট, রিভিউ ও প্রোডাক্ট তুলনা',
                    'Google দিয়ে সহজে লগইন',
                    'একটি প্রোডাক্টের আলাদা কেনার পেজ থেকে সরাসরি বিক্রি',
                    'অ্যাডমিন থেকে দোকানের অর্ডার তৈরি (নিউ সেল / POS)',
                    'অর্ডার এডিট, ইনভয়েস প্রিন্ট ও রিফান্ড',
                    'গেস্ট অর্ডার আলাদা কিউ',
                    'স্টাফদের মধ্যে অর্ডার অটো/ম্যানুয়াল ভাগ',
                    'প্রোডাক্ট, ক্যাটাগরি, রং–সাইজ, স্টক ও ছবি ম্যানেজমেন্ট',
                    'গ্রাহক তালিকা ও স্টাফ রোল (কে কী দেখতে/করতে পারবে)',
                    'ইমেইল / SMS দিয়ে ঘোষণা পাঠানো (শিডিউল সহ)',
                    'হোমপেজ ব্যানার, ভিডিও ও নীতিমালা পেজ',
                    'যোগাযোগ ইনবক্স ও সাপোর্ট রিপোর্ট — স্টাফে অ্যাসাইন',
                    'বিক্রি, স্টক, জেলা ও ভিজিটর রিপোর্ট (CSV/PDF)',
                    'Google Analytics, GTM, Facebook Pixel ও Clarity সেটআপ',
                    'SMS, ইমেইল ও পুশ নোটিফিকেশন + পাঠানোর ইতিহাস',
                    'নিউজলেটার সাবস্ক্রাইবার তালিকা',
                    'ডেলিভারি চার্জ ও এলাকা সেটআপ',
                    'বাংলা ও ইংরেজি অ্যাডমিন ভাষা',
                    'ফোন নম্বর যাচাই (অর্ডার রিভিউতে)',
                    'কম স্টক অ্যালার্ট ড্যাশবোর্ডে',
                    'স্টাফ ও গ্রাহক কার্যকলাপের অডিট লগ',
                ],
                en: [
                    'Customers can buy without creating an account',
                    'Bangladesh payments: bKash, Nagad, Rocket, SSLCommerz, ShurjoPay & cash on delivery',
                    'Couriers: Steadfast, Pathao, RedX & Paperfly — send one by one or in bulk',
                    'Mega Sale, bulk and combo discount rules from admin',
                    'Coupon codes and whole-cart discounts',
                    'Wishlist, reviews and product compare',
                    'Easy login with Google',
                    'Sell from a one-product buy page',
                    'Create walk-in orders from the admin (New Sale / POS)',
                    'Edit orders, print invoices and process refunds',
                    'Separate queue for guest orders',
                    'Auto or manual order sharing among staff',
                    'Manage products, categories, color–size, stock and photos',
                    'Customer list and staff roles (who can see or do what)',
                    'Send announcements by email or SMS (with schedule)',
                    'Homepage banners, video and policy pages',
                    'Contact inbox and support reports — assign to staff',
                    'Sales, stock, district and visitor reports (CSV/PDF)',
                    'Google Analytics, GTM, Facebook Pixel and Clarity setup',
                    'SMS, email and push notifications plus send history',
                    'Newsletter subscriber list',
                    'Delivery charge and area setup',
                    'Bangla and English admin language',
                    'Phone number checks when reviewing orders',
                    'Low-stock alerts on the dashboard',
                    'Staff and customer activity audit logs',
                ],
            }),
            facilities: JSON.stringify({
                bn: [
                    '১৪ দিন ফ্রি ট্রায়াল — লাইভ ডেমো দোকান দেখে নিন',
                    'Trialvo তে হোস্টেড ট্রায়াল (Option 1)',
                    'নিজের সার্ভারে ইনস্টল করে চালানো যায় (Option 2)',
                    'আলাদা শপ ও অ্যাডমিন ডেমো প্রিভিউ',
                    'বাংলাদেশি পেমেন্ট ও কুরিয়ার আগে থেকে যুক্ত',
                    'সোর্স কোড সহ — আজীবন আপডেট',
                    'দ্রুত ডেমো চালু — কয়েক মিনিটে দেখা যায়',
                ],
                en: [
                    '14-day free trial — try the live demo store',
                    'Hosted trial on Trialvo (Option 1)',
                    'Install on your own server (Option 2)',
                    'Separate shop and admin demos to preview',
                    'Bangladesh payments and couriers ready to use',
                    'Full source code with lifetime updates',
                    'Quick demo start — see it running in minutes',
                ],
            }),
            faq: JSON.stringify([]),
            seo: JSON.stringify({
                title: { bn: 'অ্যাডভান্স লাইফস্টাইল 3D', en: 'Advance Lifestyle 3D — Trialvo' },
                description: {
                    bn: 'লাইফস্টাইল ই-কমার্সের মতো সম্পূর্ণ অনলাইন দোকান — পেমেন্ট, কুরিয়ার, মেগা সেল ও অ্যাডমিন প্যানেল সহ।',
                    en: 'Complete online store based on Lifestyle — payments, couriers, Mega Sale and admin panel included.',
                },
                keywords: {
                    bn: ['অ্যাডভান্স লাইফস্টাইল', 'লাইফস্টাইল', 'অনলাইন দোকান', 'ইকমার্স'],
                    en: ['advance lifestyle 3d', 'lifestyle', 'online store', 'ecommerce', 'bangladesh'],
                },
            }),
            deploy_config: JSON.stringify({
                image_api: 'advlifestyle3d-api:trial',
                image_shop: 'advlifestyle3d-shop:trial',
                image_admin: 'advlifestyle3d-admin:trial',
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
            // Preserve admin-managed media/content on existing rows. Boot-time seeds
            // only refresh operational demo links and deploy_config (shared-demo URLs).
            await client.query(
                `UPDATE products SET
                  demo=$2, deploy_config=$3, is_trialable=1,
                  updated_at=NOW()
                 WHERE slug=$1`,
                [slug, payload.demo, payload.deploy_config]
            );
        } else {
            await client.query(
                `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, demo,
                  name, short_description, features, facilities, faq, seo, is_featured, is_active,
                  deploy_config, is_trialable)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'[]',$13,1,1,$14,1)`,
                [id, slug, payload.category, payload.price_bdt, payload.price_usd, payload.thumbnail,
                    payload.images, payload.demo, payload.name, payload.short_description, payload.features,
                    payload.facilities, payload.seo, payload.deploy_config]
            );
        }
    },
};
