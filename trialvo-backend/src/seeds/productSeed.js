const { v4: uuidv4 } = require('uuid');

const sampleProducts = [
 {
  slug: 'complete-ecommerce-solution',
  category: 'ecommerce',
  price_bdt: 15000,
  price_usd: 150,
  thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
  images: {
   admin: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
   ],
   shop: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop',
   ],
  },
  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  demo: [
   {
    label: { bn: 'এডমিন প্যানেল', en: 'Admin Panel' },
    url: 'https://demo-admin.example.com',
    username: 'admin@demo.com',
    password: 'demo123',
   },
   {
    label: { bn: 'শপ ওয়েবসাইট', en: 'Shop Website' },
    url: 'https://demo-shop.example.com',
    username: 'user@demo.com',
    password: 'user123',
   },
  ],
  name: { bn: 'কমপ্লিট ইকমার্স সলিউশন', en: 'Complete Ecommerce Solution' },
  short_description: {
   bn: 'সম্পূর্ণ ইকমার্স ওয়েবসাইট এডমিন প্যানেল সহ। মাল্টি-ভেন্ডর সাপোর্ট, পেমেন্ট গেটওয়ে, ইনভেন্টরি ম্যানেজমেন্ট।',
   en: 'Complete ecommerce website with admin panel. Multi-vendor support, payment gateway, inventory management.',
  },
  features: {
   bn: ['মাল্টি-ভেন্ডর সাপোর্ট', 'SSL সুরক্ষিত পেমেন্ট', 'ইনভেন্টরি ম্যানেজমেন্ট', 'অর্ডার ট্র্যাকিং', 'কুপন ও ডিসকাউন্ট সিস্টেম', 'রিপোর্ট ও অ্যানালিটিক্স', 'মোবাইল রেসপন্সিভ ডিজাইন', 'SEO অপটিমাইজড'],
   en: ['Multi-vendor Support', 'SSL Secured Payment', 'Inventory Management', 'Order Tracking', 'Coupon & Discount System', 'Reports & Analytics', 'Mobile Responsive Design', 'SEO Optimized'],
  },
  facilities: {
   bn: ['৩ মাস ফ্রি সাপোর্ট', 'ইনস্টলেশন সহায়তা', 'বিস্তারিত ডকুমেন্টেশন', 'ভিডিও টিউটোরিয়াল', 'সোর্স কোড সহ', 'লাইফটাইম আপডেট'],
   en: ['3 Months Free Support', 'Installation Assistance', 'Detailed Documentation', 'Video Tutorials', 'Source Code Included', 'Lifetime Updates'],
  },
  faq: [
   { question: { bn: 'এই ওয়েবসাইট কি কাস্টমাইজ করা যাবে?', en: 'Can this website be customized?' }, answer: { bn: 'হ্যাঁ, সম্পূর্ণ সোর্স কোড দেওয়া হয়।', en: 'Yes, complete source code is provided.' } },
  ],
  seo: {
   title: { bn: 'কমপ্লিট ইকমার্স সলিউশন', en: 'Complete Ecommerce Solution' },
   description: { bn: 'বাংলাদেশের জন্য সেরা রেডিমেড ইকমার্স ওয়েবসাইট।', en: 'Best ready-made ecommerce website for Bangladesh.' },
   keywords: { bn: ['ইকমার্স ওয়েবসাইট', 'রেডিমেড ইকমার্স'], en: ['ecommerce website', 'ready-made ecommerce'] },
  },
  is_featured: 1,
  is_active: 1,
 },
 {
  slug: 'fashion-store-pro',
  category: 'fashion',
  price_bdt: 12000,
  price_usd: 120,
  thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
  images: { admin: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'], shop: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop'] },
  video_url: null,
  demo: [{ label: { bn: 'এডমিন প্যানেল', en: 'Admin Panel' }, url: 'https://fashion-admin.example.com', username: 'admin@demo.com', password: 'demo123' }],
  name: { bn: 'ফ্যাশন স্টোর প্রো', en: 'Fashion Store Pro' },
  short_description: { bn: 'মডার্ন ফ্যাশন স্টোর ওয়েবসাইট।', en: 'Modern fashion store website.' },
  features: { bn: ['সাইজ গাইড সিস্টেম', 'কালার ভ্যারিয়েন্ট', 'উইশলিস্ট'], en: ['Size Guide System', 'Color Variants', 'Wishlist'] },
  facilities: { bn: ['২ মাস ফ্রি সাপোর্ট', 'ডকুমেন্টেশন'], en: ['2 Months Free Support', 'Documentation'] },
  faq: [],
  seo: { title: { bn: 'ফ্যাশন স্টোর প্রো', en: 'Fashion Store Pro' }, description: { bn: 'ফ্যাশন ব্র্যান্ডের জন্য আধুনিক ইকমার্স ওয়েবসাইট।', en: 'Modern ecommerce website for fashion brands.' }, keywords: { bn: ['ফ্যাশন ওয়েবসাইট'], en: ['fashion website'] } },
  is_featured: 1,
  is_active: 1,
 },
 {
  slug: 'gift-shop-starter',
  category: 'gift',
  price_bdt: 10000,
  price_usd: 100,
  thumbnail: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop',
  images: { admin: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'], shop: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=500&fit=crop'] },
  video_url: null,
  demo: [{ label: { bn: 'এডমিন প্যানেল', en: 'Admin Panel' }, url: 'https://gift-admin.example.com', username: 'admin@demo.com', password: 'demo123' }],
  name: { bn: 'গিফট শপ স্টার্টার', en: 'Gift Shop Starter' },
  short_description: { bn: 'গিফট শপের জন্য সুন্দর ওয়েবসাইট।', en: 'Beautiful website for gift shops.' },
  features: { bn: ['গিফট র‍্যাপিং অপশন', 'মেসেজ কার্ড'], en: ['Gift Wrapping Option', 'Message Card'] },
  facilities: { bn: ['২ মাস ফ্রি সাপোর্ট'], en: ['2 Months Free Support'] },
  faq: [],
  seo: { title: { bn: 'গিফট শপ স্টার্টার', en: 'Gift Shop Starter' }, description: { bn: 'গিফট শপের জন্য রেডিমেড ওয়েবসাইট।', en: 'Ready-made website for gift shops.' }, keywords: { bn: ['গিফট শপ'], en: ['gift shop'] } },
  is_featured: 1,
  is_active: 1,
 },
 {
  slug: 'accessories-hub',
  category: 'accessories',
  price_bdt: 11000,
  price_usd: 110,
  thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
  images: { admin: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'], shop: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=500&fit=crop'] },
  video_url: null,
  demo: [{ label: { bn: 'এডমিন প্যানেল', en: 'Admin Panel' }, url: 'https://accessories-admin.example.com', username: 'admin@demo.com', password: 'demo123' }],
  name: { bn: 'একসেসরিজ হাব', en: 'Accessories Hub' },
  short_description: { bn: 'একসেসরিজ বিক্রির জন্য মডার্ন ওয়েবসাইট।', en: 'Modern website for selling accessories.' },
  features: { bn: ['জুম ইমেজ ভিউ', 'ব্র্যান্ড ফিল্টার'], en: ['Zoom Image View', 'Brand Filter'] },
  facilities: { bn: ['২ মাস ফ্রি সাপোর্ট'], en: ['2 Months Free Support'] },
  faq: [],
  seo: { title: { bn: 'একসেসরিজ হাব', en: 'Accessories Hub' }, description: { bn: 'একসেসরিজ বিক্রির জন্য রেডিমেড ওয়েবসাইট।', en: 'Ready-made website for selling accessories.' }, keywords: { bn: ['একসেসরিজ শপ'], en: ['accessories shop'] } },
  is_featured: 0,
  is_active: 1,
 },
 {
  slug: 'tech-gadget-store',
  category: 'tech',
  price_bdt: 14000,
  price_usd: 140,
  thumbnail: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop',
  images: { admin: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'], shop: ['https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=500&fit=crop'] },
  video_url: null,
  demo: [{ label: { bn: 'এডমিন প্যানেল', en: 'Admin Panel' }, url: 'https://tech-admin.example.com', username: 'admin@demo.com', password: 'demo123' }],
  name: { bn: 'টেক গ্যাজেট স্টোর', en: 'Tech Gadget Store' },
  short_description: { bn: 'ইলেকট্রনিক্স ও গ্যাজেট বিক্রির জন্য ওয়েবসাইট।', en: 'Website for selling electronics and gadgets.' },
  features: { bn: ['স্পেসিফিকেশন টেবিল', 'প্রোডাক্ট কম্পেয়ার'], en: ['Specification Table', 'Product Compare'] },
  facilities: { bn: ['৩ মাস ফ্রি সাপোর্ট'], en: ['3 Months Free Support'] },
  faq: [],
  seo: { title: { bn: 'টেক গ্যাজেট স্টোর', en: 'Tech Gadget Store' }, description: { bn: 'ইলেকট্রনিক্স ও গ্যাজেট বিক্রির জন্য রেডিমেড ওয়েবসাইট।', en: 'Ready-made website for electronics and gadgets.' }, keywords: { bn: ['টেক শপ'], en: ['tech shop'] } },
  is_featured: 1,
  is_active: 1,
 },
];

module.exports = {
 table: 'products',
 async run(connection) {
  for (const product of sampleProducts) {
   const id = uuidv4();
   await connection.execute(
    `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, video_url, demo, name, short_description, features, facilities, faq, seo, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
     id,
     product.slug,
     product.category,
     product.price_bdt,
     product.price_usd,
     product.thumbnail,
     JSON.stringify(product.images),
     product.video_url,
     JSON.stringify(product.demo),
     JSON.stringify(product.name),
     JSON.stringify(product.short_description),
     JSON.stringify(product.features),
     JSON.stringify(product.facilities),
     JSON.stringify(product.faq),
     JSON.stringify(product.seo),
     product.is_featured,
     product.is_active,
    ]
   );
  }
  console.log(`    📦 Inserted ${sampleProducts.length} sample products`);
 },
};
