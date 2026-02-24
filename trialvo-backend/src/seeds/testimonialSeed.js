const { v4: uuidv4 } = require('uuid');

const sampleTestimonials = [
 {
  name: { bn: 'রাহুল হাসান', en: 'Rahul Hasan' },
  role: { bn: 'ফ্যাশন স্টোরের মালিক', en: 'Fashion Store Owner' },
  content: {
   bn: 'এখানকার ফ্যাশন স্টোর ওয়েবসাইট নিয়ে আমি অত্যন্ত সন্তুষ্ট। এডমিন প্যানেল দিয়ে সব কিছু ম্যানেজ করা অনেক সহজ। সাপোর্ট টিমও অনেক সহায়ক ছিল। আমার ব্যবসা এখন অনেক ভালো চলছে।',
   en: 'I am extremely satisfied with the fashion store website from here. Managing everything with the admin panel is very easy. The support team was also very helpful. My business is doing much better now.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  images: [
   'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  ],
  is_active: 1,
 },
 {
  name: { bn: 'ফাতিমা আক্তার', en: 'Fatima Akter' },
  role: { bn: 'গিফট শপের উদ্যোক্তা', en: 'Gift Shop Entrepreneur' },
  content: {
   bn: 'গিফট শপ ওয়েবসাইট কিনে আমার ব্যবসা শুরু করেছি। দারুণ ডিজাইন এবং ফিচার। কাস্টমাররাও অনেক প্রশংসা করছে। পেমেন্ট সিস্টেমটাও দারুণ কাজ করে।',
   en: 'I started my business by buying the gift shop website. Great design and features. Customers are also praising it a lot. The payment system works great too.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  images: [
   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=300&fit=crop',
  ],
  is_active: 1,
 },
 {
  name: { bn: 'তানভীর আহমেদ', en: 'Tanvir Ahmed' },
  role: { bn: 'টেক স্টোরের মালিক', en: 'Tech Store Owner' },
  content: {
   bn: 'টেক গ্যাজেট স্টোর ওয়েবসাইটটি চমৎকার। প্রোডাক্ট কম্পেয়ার ফিচার আমার কাস্টমারদের অনেক সাহায্য করছে। ইনস্টলেশন সাপোর্টও দারুণ ছিল।',
   en: 'The tech gadget store website is excellent. The product compare feature is helping my customers a lot. Installation support was also great.',
  },
  rating: 4,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  images: [],
  is_active: 1,
 },
 {
  name: { bn: 'সাবরিনা চৌধুরী', en: 'Sabrina Chowdhury' },
  role: { bn: 'ইকমার্স ব্যবসায়ী', en: 'Ecommerce Business Owner' },
  content: {
   bn: 'কমপ্লিট ইকমার্স সলিউশন ব্যবহার করে আমার অনলাইন দোকান দিয়েছি। মাত্র ১ দিনে সব সেটআপ হয়ে গেছে। সোর্স কোড পেয়ে নিজে কাস্টমাইজ করতে পেরেছি। অসাধারণ অভিজ্ঞতা!',
   en: 'I set up my online store using the Complete Ecommerce Solution. Everything was set up in just 1 day. I was able to customize it myself with the source code. Amazing experience!',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  images: [
   'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  ],
  is_active: 1,
 },
 {
  name: { bn: 'আরিফ রহমান', en: 'Arif Rahman' },
  role: { bn: 'ফ্রিল্যান্সার', en: 'Freelancer' },
  content: {
   bn: 'আমি ক্লায়েন্টদের জন্য এখান থেকে ওয়েবসাইট কিনি। প্রতিবারই চমৎকার কোয়ালিটি পাচ্ছি। ক্লায়েন্টরাও খুশি। ব্যবসা করার জন্য চমৎকার একটি প্ল্যাটফর্ম।',
   en: 'I buy websites from here for my clients. Every time I get excellent quality. Clients are also happy. An excellent platform for doing business.',
  },
  rating: 5,
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  images: [],
  is_active: 1,
 },
 {
  name: { bn: 'নুসরাত জাহান', en: 'Nusrat Jahan' },
  role: { bn: 'একসেসরিজ ব্যবসায়ী', en: 'Accessories Business Owner' },
  content: {
   bn: 'একসেসরিজ ওয়েবসাইটটি দিয়ে আমার অনলাইন ব্যবসা শুরু করেছি। মোবাইল রেসপন্সিভ ডিজাইন দারুণ। কাস্টমাররা সহজেই অর্ডার করতে পারছে।',
   en: 'I started my online business with the accessories website. The mobile responsive design is great. Customers can easily place orders.',
  },
  rating: 4,
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  images: [
   'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  ],
  is_active: 1,
 },
];

module.exports = {
 table: 'testimonials',
 async run(connection) {
  for (const t of sampleTestimonials) {
   const id = uuidv4();
   await connection.execute(
    `INSERT INTO testimonials (id, name, role, content, rating, avatar, images, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
     id,
     JSON.stringify(t.name),
     JSON.stringify(t.role),
     JSON.stringify(t.content),
     t.rating,
     t.avatar,
     JSON.stringify(t.images),
     t.is_active,
    ]
   );
  }
  console.log(`    💬 Inserted ${sampleTestimonials.length} sample testimonials`);
 },
};
