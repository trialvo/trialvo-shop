const { v4: uuidv4 } = require('uuid');

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
      thumbnail: `${SHOP_URL}/favicon.ico`,
      images: JSON.stringify({
        admin: [`${ADMIN_URL}/favicon.ico`],
        shop: [`${SHOP_URL}/favicon.ico`],
      }),
      demo,
      name: JSON.stringify({
        bn: 'ফ্যাশন ই-কমার্স',
        en: 'Fashion E-Commerce',
      }),
      short_description: JSON.stringify({
        bn: 'ফ্যাশন ব্র্যান্ডের জন্য সম্পূর্ণ ই-কমার্স — শপ, অ্যাডমিন ও API। RBAC, পেমেন্ট, কুরিয়ার।',
        en: 'Full fashion e-commerce with shop, admin and API. RBAC, payments, courier integrations.',
      }),
      features: JSON.stringify({
        bn: ['অ্যাডমিন RBAC', 'মাল্টি-কুরিয়ার', 'গেস্ট চেকআউট', 'কুপন ও মেগা সেল'],
        en: ['Admin RBAC', 'Multi-courier', 'Guest checkout', 'Coupons & mega sale'],
      }),
      facilities: JSON.stringify({
        bn: ['১৪ দিন ফ্রি ট্রায়াল (শেয়ার্ড ডেমো)', 'Option 2 সেল্ফ-হোস্টেড', 'রিমোট অ্যাক্সেস রিভোক'],
        en: ['14-day free trial (shared demo)', 'Option 2 self-hosted', 'Remote access revoke'],
      }),
      faq: JSON.stringify([]),
      seo: JSON.stringify({
        title: { bn: 'ফ্যাশন ই-কমার্স', en: 'Fashion E-Commerce — Trialvo' },
        description: { bn: 'ফ্যাশন ই-কমার্স সলিউশন', en: 'Fashion e-commerce solution' },
        keywords: { bn: ['ফ্যাশন', 'ইকমার্স'], en: ['fashion', 'ecommerce'] },
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
