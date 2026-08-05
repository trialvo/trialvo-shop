/**
 * seed_demo_products.js
 * Clears old products and inserts fresh demo products via the admin API
 * Run: node seed_demo_products.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE = 'http://localhost:5000/api';

const products = [
  {
    slug: 'restaurant-website-pro',
    category: 'restaurant',
    price_bdt: 10,   // Low price for easy payment testing
    price_usd: 1,
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    images: {
      shop: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=500&fit=crop',
      ],
      admin: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
      ],
    },
    video_url: null,
    demo: [
      { url: 'https://restaurant-demo.trialvo.com', label: { bn: 'রেস্তোরাঁ ওয়েবসাইট', en: 'Restaurant Site' }, username: 'demo@restaurant.com', password: 'demo123' },
      { url: 'https://restaurant-admin.trialvo.com', label: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' }, username: 'admin@restaurant.com', password: 'admin123' },
    ],
    name: { bn: 'রেস্তোরাঁ ওয়েবসাইট প্রো', en: 'Restaurant Website Pro' },
    short_description: {
      bn: 'অনলাইন মেনু, টেবিল বুকিং ও ডেলিভারি সিস্টেম সহ সম্পূর্ণ রেস্তোরাঁ ওয়েবসাইট।',
      en: 'Complete restaurant website with online menu, table booking & delivery system.',
    },
    features: {
      bn: ['অনলাইন মেনু ম্যানেজমেন্ট', 'টেবিল রিজার্ভেশন', 'হোম ডেলিভারি সিস্টেম', 'QR কোড মেনু', 'অর্ডার ট্র্যাকিং', 'পেমেন্ট গেটওয়ে', 'রিভিউ সিস্টেম', 'মোবাইল রেসপন্সিভ'],
      en: ['Online Menu Management', 'Table Reservation', 'Home Delivery System', 'QR Code Menu', 'Order Tracking', 'Payment Gateway', 'Review System', 'Mobile Responsive'],
    },
    facilities: {
      bn: ['৩ মাস ফ্রি সাপোর্ট', 'ইন্সটলেশন সহায়তা', 'বিস্তারিত ডকুমেন্টেশন', 'সোর্স কোড অন্তর্ভুক্ত', 'লাইফটাইম আপডেট'],
      en: ['3 Months Free Support', 'Installation Assistance', 'Detailed Documentation', 'Source Code Included', 'Lifetime Updates'],
    },
    faq: [
      { question: { bn: 'কাস্টমাইজ করা যাবে?', en: 'Can it be customized?' }, answer: { bn: 'হ্যাঁ, সম্পূর্ণ সোর্স কোড দেওয়া হবে।', en: 'Yes, full source code is provided.' } },
      { question: { bn: 'কতদিনের মধ্যে ডেলিভারি?', en: 'How long for delivery?' }, answer: { bn: '২-৩ কার্যদিবসের মধ্যে।', en: 'Within 2-3 business days.' } },
    ],
    seo: {
      title: { bn: 'রেস্তোরাঁ ওয়েবসাইট প্রো', en: 'Restaurant Website Pro' },
      description: { bn: 'অনলাইন অর্ডারিং ও ডেলিভারি সিস্টেম সহ রেস্তোরাঁ ওয়েবসাইট।', en: 'Restaurant website with online ordering and delivery system for Bangladesh.' },
      keywords: { bn: ['রেস্তোরাঁ ওয়েবসাইট', 'অনলাইন অর্ডার'], en: ['restaurant website', 'online ordering', 'food delivery'] },
    },
    is_featured: true,
    sort_order: 1,
  },
  {
    slug: 'ecommerce-shop-complete',
    category: 'ecommerce',
    price_bdt: 15,
    price_usd: 1,
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    images: {
      shop: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop',
      ],
      admin: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
      ],
    },
    video_url: null,
    demo: [
      { url: 'https://shop-demo.trialvo.com', label: { bn: 'শপ ওয়েবসাইট', en: 'Shop Website' }, username: 'user@demo.com', password: 'user123' },
      { url: 'https://shop-admin.trialvo.com', label: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' }, username: 'admin@demo.com', password: 'admin123' },
    ],
    name: { bn: 'কমপ্লিট ই-কমার্স শপ', en: 'Complete E-commerce Shop' },
    short_description: {
      bn: 'অ্যাডমিন প্যানেল, পেমেন্ট গেটওয়ে ও ইনভেন্টরি ম্যানেজমেন্ট সহ সম্পূর্ণ ই-কমার্স সমাধান।',
      en: 'Full e-commerce solution with admin panel, payment gateway, and inventory management.',
    },
    features: {
      bn: ['মাল্টি-ভেন্ডর সাপোর্ট', 'পেমেন্ট গেটওয়ে ইন্টিগ্রেশন', 'ইনভেন্টরি ম্যানেজমেন্ট', 'অর্ডার ট্র্যাকিং', 'কুপন ও ডিসকাউন্ট', 'রিপোর্ট ও অ্যানালিটিক্স', 'SEO অপ্টিমাইজড', 'মোবাইল রেসপন্সিভ'],
      en: ['Multi-vendor Support', 'Payment Gateway Integration', 'Inventory Management', 'Order Tracking', 'Coupon & Discount System', 'Reports & Analytics', 'SEO Optimized', 'Mobile Responsive'],
    },
    facilities: {
      bn: ['৩ মাস ফ্রি সাপোর্ট', 'ইন্সটলেশন সহায়তা', 'ভিডিও টিউটোরিয়াল', 'সোর্স কোড অন্তর্ভুক্ত', 'লাইফটাইম আপডেট'],
      en: ['3 Months Free Support', 'Installation Assistance', 'Video Tutorials', 'Source Code Included', 'Lifetime Updates'],
    },
    faq: [
      { question: { bn: 'বিকাশ/নগদ সাপোর্ট আছে?', en: 'Does it support bKash/Nagad?' }, answer: { bn: 'হ্যাঁ, সব বাংলাদেশী পেমেন্ট পদ্ধতি সাপোর্টেড।', en: 'Yes, all Bangladeshi payment methods are supported.' } },
      { question: { bn: 'হোস্টিং কোথায় করব?', en: 'Where to host?' }, answer: { bn: 'যেকোনো সার্ভারে ডিপ্লয় করা যাবে। আমরা সহায়তা করব।', en: 'Can be deployed on any server. We will assist you.' } },
    ],
    seo: {
      title: { bn: 'কমপ্লিট ই-কমার্স শপ', en: 'Complete E-commerce Shop' },
      description: { bn: 'বাংলাদেশের সেরা রেডিমেড ই-কমার্স ওয়েবসাইট সমাধান।', en: 'Best ready-made e-commerce website solution for Bangladesh.' },
      keywords: { bn: ['ই-কমার্স', 'অনলাইন শপ'], en: ['ecommerce', 'online shop', 'bangladeshi ecommerce'] },
    },
    is_featured: true,
    sort_order: 2,
  },
  {
    slug: 'pharmacy-management-system',
    category: 'healthcare',
    price_bdt: 12,
    price_usd: 1,
    thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    images: {
      shop: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=800&h=500&fit=crop',
      ],
      admin: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      ],
    },
    video_url: null,
    demo: [
      { url: 'https://pharmacy-demo.trialvo.com', label: { bn: 'ফার্মেসি সাইট', en: 'Pharmacy Site' }, username: 'demo@pharmacy.com', password: 'demo123' },
    ],
    name: { bn: 'ফার্মেসি ম্যানেজমেন্ট সিস্টেম', en: 'Pharmacy Management System' },
    short_description: {
      bn: 'ওষুধ স্টক ম্যানেজমেন্ট, অনলাইন অর্ডার ও ডাক্তারের প্রেসক্রিপশন সহ ফার্মেসি সফটওয়্যার।',
      en: 'Complete pharmacy software with medicine stock management, online orders & prescription handling.',
    },
    features: {
      bn: ['ওষুধ স্টক ম্যানেজমেন্ট', 'মেয়াদোত্তীর্ণ সতর্কতা', 'অনলাইন অর্ডার', 'প্রেসক্রিপশন আপলোড', 'বিক্রয় রিপোর্ট', 'সরবরাহকারী ম্যানেজমেন্ট'],
      en: ['Medicine Stock Management', 'Expiry Alerts', 'Online Orders', 'Prescription Upload', 'Sales Reports', 'Supplier Management'],
    },
    facilities: {
      bn: ['২ মাস ফ্রি সাপোর্ট', 'ইন্সটলেশন সহায়তা', 'ট্রেনিং সেশন'],
      en: ['2 Months Free Support', 'Installation Assistance', 'Training Session'],
    },
    faq: [
      { question: { bn: 'একাধিক শাখায় ব্যবহার করা যাবে?', en: 'Can it be used for multiple branches?' }, answer: { bn: 'হ্যাঁ, মাল্টি-ব্রাঞ্চ সাপোর্ট আছে।', en: 'Yes, multi-branch support is available.' } },
    ],
    seo: {
      title: { bn: 'ফার্মেসি ম্যানেজমেন্ট সিস্টেম', en: 'Pharmacy Management System' },
      description: { bn: 'সম্পূর্ণ ফার্মেসি ম্যানেজমেন্ট সফটওয়্যার বাংলাদেশের জন্য।', en: 'Complete pharmacy management software for Bangladesh.' },
      keywords: { bn: ['ফার্মেসি সফটওয়্যার'], en: ['pharmacy software', 'medicine management'] },
    },
    is_featured: true,
    sort_order: 3,
  },
  {
    slug: 'school-management-system',
    category: 'education',
    price_bdt: 20,
    price_usd: 1,
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop',
    images: {
      shop: [
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop',
      ],
      admin: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      ],
    },
    video_url: null,
    demo: [
      { url: 'https://school-demo.trialvo.com', label: { bn: 'স্কুল পোর্টাল', en: 'School Portal' }, username: 'demo@school.com', password: 'demo123' },
      { url: 'https://school-admin.trialvo.com', label: { bn: 'অ্যাডমিন', en: 'Admin' }, username: 'admin@school.com', password: 'admin123' },
    ],
    name: { bn: 'স্কুল ম্যানেজমেন্ট সিস্টেম', en: 'School Management System' },
    short_description: {
      bn: 'ছাত্র ভর্তি, পরীক্ষার ফলাফল, উপস্থিতি ও বেতন ম্যানেজমেন্ট সহ সম্পূর্ণ স্কুল সফটওয়্যার।',
      en: 'Complete school software with student admission, exam results, attendance & fee management.',
    },
    features: {
      bn: ['ছাত্র রেজিস্ট্রেশন', 'উপস্থিতি ট্র্যাকিং', 'পরীক্ষার ফলাফল', 'বেতন ম্যানেজমেন্ট', 'নোটিশ বোর্ড', 'অভিভাবক পোর্টাল', 'শিক্ষক প্যানেল', 'SMS নোটিফিকেশন'],
      en: ['Student Registration', 'Attendance Tracking', 'Exam Results', 'Fee Management', 'Notice Board', 'Parent Portal', 'Teacher Panel', 'SMS Notifications'],
    },
    facilities: {
      bn: ['৬ মাস ফ্রি সাপোর্ট', 'ইন্সটলেশন সহায়তা', 'স্টাফ ট্রেনিং', 'ডেটা মাইগ্রেশন'],
      en: ['6 Months Free Support', 'Installation Assistance', 'Staff Training', 'Data Migration'],
    },
    faq: [
      { question: { bn: 'কতজন ছাত্রের তথ্য রাখা যাবে?', en: 'How many students can be stored?' }, answer: { bn: 'সীমাহীন ছাত্রের তথ্য রাখা যাবে।', en: 'Unlimited student records can be stored.' } },
      { question: { bn: 'অ্যাপ আছে কি?', en: 'Is there a mobile app?' }, answer: { bn: 'হ্যাঁ, Android ও iOS অ্যাপ পাওয়া যায়।', en: 'Yes, Android and iOS apps are available.' } },
    ],
    seo: {
      title: { bn: 'স্কুল ম্যানেজমেন্ট সিস্টেম', en: 'School Management System' },
      description: { bn: 'বাংলাদেশের স্কুলের জন্য সম্পূর্ণ ম্যানেজমেন্ট সফটওয়্যার।', en: 'Complete school management software for Bangladesh.' },
      keywords: { bn: ['স্কুল সফটওয়্যার', 'ছাত্র ম্যানেজমেন্ট'], en: ['school management', 'student management', 'bangladesh school'] },
    },
    is_featured: true,
    sort_order: 4,
  },
  {
    slug: 'salon-booking-system',
    category: 'beauty',
    price_bdt: 8,
    price_usd: 1,
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    images: {
      shop: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=500&fit=crop',
      ],
      admin: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      ],
    },
    video_url: null,
    demo: [
      { url: 'https://salon-demo.trialvo.com', label: { bn: 'সেলুন সাইট', en: 'Salon Site' }, username: 'demo@salon.com', password: 'demo123' },
    ],
    name: { bn: 'সেলুন বুকিং সিস্টেম', en: 'Salon Booking System' },
    short_description: {
      bn: 'অনলাইন অ্যাপয়েন্টমেন্ট বুকিং, স্টাইলিস্ট ম্যানেজমেন্ট ও পেমেন্ট সহ সেলুন ওয়েবসাইট।',
      en: 'Salon website with online appointment booking, stylist management and payment integration.',
    },
    features: {
      bn: ['অনলাইন অ্যাপয়েন্টমেন্ট', 'স্টাইলিস্ট প্রোফাইল', 'সার্ভিস মেনু', 'পেমেন্ট গেটওয়ে', 'SMS রিমাইন্ডার', 'গ্যালারি'],
      en: ['Online Appointment', 'Stylist Profiles', 'Service Menu', 'Payment Gateway', 'SMS Reminder', 'Gallery'],
    },
    facilities: {
      bn: ['২ মাস ফ্রি সাপোর্ট', 'ইন্সটলেশন সহায়তা', 'সোর্স কোড অন্তর্ভুক্ত'],
      en: ['2 Months Free Support', 'Installation Assistance', 'Source Code Included'],
    },
    faq: [
      { question: { bn: 'একাধিক লোকেশন সাপোর্ট করে?', en: 'Does it support multiple locations?' }, answer: { bn: 'হ্যাঁ, মাল্টি-লোকেশন সাপোর্ট আছে।', en: 'Yes, multiple locations are supported.' } },
    ],
    seo: {
      title: { bn: 'সেলুন বুকিং সিস্টেম', en: 'Salon Booking System' },
      description: { bn: 'সেলুনের জন্য অনলাইন বুকিং ও ম্যানেজমেন্ট সিস্টেম।', en: 'Online booking and management system for salons in Bangladesh.' },
      keywords: { bn: ['সেলুন ওয়েবসাইট'], en: ['salon booking', 'beauty salon website'] },
    },
    is_featured: false,
    sort_order: 5,
  },
];

async function seed() {
  console.log('🔐 Logging in as admin...');
  const loginRes = await axios.post(`${BASE}/admin/auth/login`, {
    email: 'admin@trialvo.com',
    password: 'admin123',
  });
  const token = loginRes.data.token;
  console.log('✅ Logged in. Token:', token.substring(0, 20) + '...');

  const headers = { Authorization: `Bearer ${token}` };

  // Get existing products and delete them
  console.log('\n🗑️  Removing old products...');
  const existing = await axios.get(`${BASE}/admin/products`, { headers });
  const oldProducts = existing.data.data || existing.data.products || existing.data || [];
  for (const p of oldProducts) {
    await axios.delete(`${BASE}/admin/products/${p.id}`, { headers });
    console.log(`   Deleted: ${p.slug}`);
  }

  // Create new products
  console.log('\n📦 Creating demo products...');
  for (const product of products) {
    try {
      const res = await axios.post(`${BASE}/admin/products`, product, { headers });
      console.log(`   ✅ Created: ${product.name.en} — BDT ${product.price_bdt}`);
    } catch (err) {
      console.error(`   ❌ Failed: ${product.name.en}`, err.response?.data || err.message);
    }
  }

  console.log('\n🎉 Done! Products seeded successfully.');
}

seed().catch(err => {
  console.error('Fatal error:', err.response?.data || err.message);
  process.exit(1);
});
