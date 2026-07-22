const { v4: uuidv4 } = require('uuid');

// Real Lifestyle product listing — upserts so re-seeding is safe.
module.exports = {
    table: 'products',
    alwaysRun: true,
    async run(client) {
        const slug = 'lifestyle-ecommerce';
        const existing = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
        const id = existing.rows[0]?.id || uuidv4();

        const payload = {
            slug,
            category: 'fashion',
            price_bdt: 45000,
            price_usd: 450,
            thumbnail: 'http://localhost:5000/favicon.ico',
            images: JSON.stringify({
                admin: ['http://localhost:5173/favicon.ico'],
                shop: ['http://localhost:5000/favicon.ico'],
            }),
            demo: JSON.stringify([]),
            name: JSON.stringify({
                bn: 'লাইফস্টাইল ই-কমার্স',
                en: 'Lifestyle E-Commerce',
            }),
            short_description: JSON.stringify({
                bn: 'সম্পূর্ণ ফ্যাশন ই-কমার্স — শপ, অ্যাডমিন ও API সহ। RBAC, পেমেন্ট, কুরিয়ার ইন্টিগ্রেশন।',
                en: 'Full fashion e-commerce with shop, admin panel and API. RBAC, payments, courier integrations.',
            }),
            features: JSON.stringify({
                bn: ['অ্যাডমিন RBAC', 'মাল্টি-কুরিয়ার', 'গেস্ট চেকআউট', 'কুপন ও মেগা সেল'],
                en: ['Admin RBAC', 'Multi-courier', 'Guest checkout', 'Coupons & mega sale'],
            }),
            facilities: JSON.stringify({
                bn: ['১৪ দিন ফ্রি ট্রায়াল', 'ডocker ডিপ্লয়', 'রিমোট ফ্রিজ/আনফ্রিজ'],
                en: ['14-day free trial', 'Docker deploy', 'Remote freeze/unfreeze'],
            }),
            faq: JSON.stringify([]),
            seo: JSON.stringify({
                title: { bn: 'লাইফস্টাইল ই-কমার্স', en: 'Lifestyle E-Commerce — Trialvo' },
                description: { bn: 'ফ্যাশন ই-কমার্স সলিউশন', en: 'Fashion e-commerce solution' },
                keywords: { bn: ['ইকমার্স'], en: ['ecommerce', 'fashion'] },
            }),
            deploy_config: JSON.stringify({
                image_api: 'registry.trialvo.com/lifestyle-api:latest',
                image_shop: 'registry.trialvo.com/lifestyle-shop:latest',
                image_admin: 'registry.trialvo.com/lifestyle-admin:latest',
                default_trial_days: 14,
                supports_option1: true,
                supports_option2: true,
            }),
        };

        if (existing.rows.length) {
            await client.query(
                `UPDATE products SET
                  category=$2, price_bdt=$3, price_usd=$4, thumbnail=$5, images=$6::jsonb,
                  name=$7::jsonb, short_description=$8::jsonb, features=$9::jsonb, facilities=$10::jsonb,
                  seo=$11::jsonb, deploy_config=$12::jsonb, is_trialable=1, is_active=1, is_featured=1,
                  updated_at=NOW()
                 WHERE slug=$1`,
                [slug, payload.category, payload.price_bdt, payload.price_usd, payload.thumbnail,
                    payload.images, payload.name, payload.short_description, payload.features,
                    payload.facilities, payload.seo, payload.deploy_config]
            );
        } else {
            await client.query(
                `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, demo,
                  name, short_description, features, facilities, faq, seo, is_featured, is_active,
                  deploy_config, is_trialable)
                 VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'[]'::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,'[]'::jsonb,$12::jsonb,1,1,$13::jsonb,1)`,
                [id, slug, payload.category, payload.price_bdt, payload.price_usd, payload.thumbnail,
                    payload.images, payload.name, payload.short_description, payload.features,
                    payload.facilities, payload.seo, payload.deploy_config]
            );
        }
    },
};
