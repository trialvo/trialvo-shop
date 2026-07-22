const { v4: uuidv4 } = require('uuid');

// Seed mirrors the legacy hardcoded frontend category list so the storefront
// keeps working after switching to DB-driven categories. Admins can edit/extend
// these afterwards from the panel.
const categories = [
    {
        slug: 'ecommerce',
        name: { bn: 'ইকমার্স', en: 'Ecommerce' },
        icon: 'ShoppingCart',
        description: { bn: 'সাধারণ ইকমার্স সলিউশন', en: 'General ecommerce solutions' },
    },
    {
        slug: 'fashion',
        name: { bn: 'ফ্যাশন', en: 'Fashion' },
        icon: 'Shirt',
        description: { bn: 'পোশাক ও ফ্যাশন স্টোর', en: 'Clothing and fashion stores' },
    },
    {
        slug: 'gift',
        name: { bn: 'গিফট শপ', en: 'Gift Shop' },
        icon: 'Gift',
        description: { bn: 'উপহারের দোকান', en: 'Gift and souvenir shops' },
    },
    {
        slug: 'accessories',
        name: { bn: 'একসেসরিজ', en: 'Accessories' },
        icon: 'Watch',
        description: { bn: 'ঘড়ি, জুয়েলারি, ব্যাগ', en: 'Watches, jewelry, bags' },
    },
    {
        slug: 'tech',
        name: { bn: 'টেক প্রোডাক্ট', en: 'Tech Products' },
        icon: 'Smartphone',
        description: { bn: 'ইলেকট্রনিক্স ও গ্যাজেট', en: 'Electronics and gadgets' },
    },
];

module.exports = {
    table: 'categories',
    async run(client) {
        let sortOrder = 0;
        for (const cat of categories) {
            await client.query(
                `INSERT INTO categories (id, slug, name, description, icon, sort_order, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, 1)
                 ON CONFLICT (slug) DO NOTHING`,
                [
                    uuidv4(), cat.slug, JSON.stringify(cat.name),
                    JSON.stringify(cat.description), cat.icon, sortOrder++,
                ]
            );
        }
    },
};
