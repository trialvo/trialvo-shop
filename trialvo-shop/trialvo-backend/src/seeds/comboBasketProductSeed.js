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
      category: 'gifting',
      price_bdt: 55000,
      price_usd: 550,
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
        bn: 'গিফট ও কম্বো বান্ডেল প্ল্যাটফর্ম — কম্বো বিল্ডার, বান্ডেল, COD ও বাংলা সাপোর্ট।',
        en: 'Gift & combo bundle platform with DIY combo builder, pre-made kits, COD, and Bengali storefront.',
      }),
      features: JSON.stringify({
        bn: [
          'কম্বো বিল্ডার ও বান্ডেল',
          'তিন অর্ডার মোড (সিঙ্গল / কম্বো / বান্ডেল)',
          'বাংলা শপ + অ্যাডমিন',
          'কুরিয়ার ফ্রড চেকার',
        ],
        en: [
          'Combo builder & bundles',
          'Three order modes (single / combo / bundle)',
          'Bengali shop + admin',
          'Courier fraud checker',
        ],
      }),
      facilities: JSON.stringify({
        bn: ['১৪ দিন ফ্রি ট্রায়াল (শেয়ার্ড ডেমো)', 'cPanel / Node সেল্ফ-হোস্ট', 'রিমোট অ্যাক্সেস রিভোক'],
        en: ['14-day free trial (shared demo)', 'cPanel / Node self-hosted', 'Remote access revoke'],
      }),
      faq: JSON.stringify([]),
      seo: JSON.stringify({
        title: { bn: 'কম্বো বাস্কেট ই-কমার্স', en: 'Combo Basket E-Commerce — Trialvo' },
        description: {
          bn: 'কম্বো ও গিফট ই-কমার্স সলিউশন',
          en: 'Combo & gift e-commerce solution',
        },
        keywords: {
          bn: ['কম্বো', 'গিফট', 'ইকমার্স'],
          en: ['combo', 'gift', 'ecommerce', 'bundle'],
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
