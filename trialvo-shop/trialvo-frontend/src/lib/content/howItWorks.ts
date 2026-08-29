import type { Locale } from "@/lib/i18n";

export type HowStep = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  details: string[];
};

export type HowItWorksContent = {
  steps: HowStep[];
  prepareTitle: string;
  prepareIntro: string;
  prepare: string[];
  afterTitle: string;
  afterIntro: string;
  after: string[];
};

const CONTENT: Record<Locale, HowItWorksContent> = {
  bn: {
    steps: [
      {
        id: "choose",
        eyebrow: "ধাপ ০১",
        title: "প্রোডাক্ট বেছে নিন",
        summary:
          "ক্যাটালগ থেকে আপনার ব্যবসার ধরনের সাথে মেলে এমন রেডিমেড ইকমার্স সলিউশন বাছুন।",
        details: [
          "ক্যাটাগরি অনুযায়ী ফিল্টার করুন — ইকমার্স, ফ্যাশন, টেক বা লাইফস্টাইল।",
          "প্রতিটি প্রোডাক্ট পেজে ফিচার তালিকা, সুবিধাসমূহ, স্ক্রিনশট ও প্রশ্নোত্তর দেখে নিন।",
          "মূল্য BDT-তে দেখানো হয় এবং ডিসকাউন্ট থাকলে কার্যকর মূল্য স্পষ্টভাবে থাকে।",
          "কোনটি বেছে নেবেন বুঝতে না পারলে আমাদের জানান — প্রয়োজন শুনে সাজেশন দেব।",
        ],
      },
      {
        id: "trial",
        eyebrow: "ধাপ ০২",
        title: "ফ্রি লাইভ ট্রায়াল চালান",
        summary:
          "কেনার আগে আসল চালু প্রোডাক্টে ঢুকে নিজে সব যাচাই করে নিন — কোনো পেমেন্ট বা কার্ড লাগে না।",
        details: [
          "প্রোডাক্ট পেজের “ফ্রি ট্রায়াল” বাটনে ক্লিক করে নাম, ইমেইল ও ব্যবহারের উদ্দেশ্য দিন।",
          "অনুরোধ পর্যালোচনার পর অনুমোদন হলে ইমেইলে একটি স্ট্যাটাস লিংক পাবেন।",
          "ট্রায়ালে শপ ও অ্যাডমিন প্যানেল দুটোই আসল প্রোডাক্টের মতোই কাজ করে।",
          "প্রোডাক্ট যোগ করে, অর্ডার তৈরি করে ও রিপোর্ট দেখে পুরো ফ্লো পরীক্ষা করুন।",
          "মেয়াদ শেষ হওয়ার আগে আরও সময় লাগলে এক্সটেন্ড প্যাক নিতে পারেন।",
        ],
      },
      {
        id: "purchase",
        eyebrow: "ধাপ ০৩",
        title: "এককালীন পেমেন্টে কিনুন",
        summary:
          "নিশ্চিত হলে চেকআউট করুন — একবার পেমেন্ট, তারপর আজীবন লাইসেন্স, সাপোর্ট ও আপডেট।",
        details: [
          "চেকআউটে নাম, ইমেইল ও ফোন নম্বর দিন — ডেলিভারি এই তথ্যেই যাবে।",
          "নিরাপদ পেমেন্ট গেটওয়ের মাধ্যমে পেমেন্ট সম্পন্ন করুন।",
          "চেকআউটে দেখানো মোট মূল্যই চূড়ান্ত — কোনো লুকানো চার্জ নেই।",
          "পেমেন্ট নিশ্চিত হলে সাথে সাথে অর্ডার কনফার্ম হয় এবং ডেলিভারি প্রক্রিয়া শুরু হয়।",
        ],
      },
      {
        id: "delivery",
        eyebrow: "ধাপ ০৪",
        title: "ডেলিভারি ও সেটআপ",
        summary:
          "সোর্স কোড, ডাটাবেস স্ট্রাকচার ও সেটআপ ডকুমেন্টেশন পান — সেটআপে সাপোর্ট গাইডেন্স অন্তর্ভুক্ত।",
        details: [
          "ডেলিভারি লিংক ও নির্দেশনা অর্ডারের ইমেইলে পাঠানো হয়।",
          "ধাপে ধাপে ডকুমেন্টেশন দেখে নিজের হোস্টিংয়ে ফাইল আপলোড ও ডাটাবেস কনফিগার করুন।",
          "কোথাও আটকে গেলে সাপোর্টে জানান — ইনস্টলেশন গাইডেন্স সাপোর্টের অন্তর্ভুক্ত।",
          "প্রয়োজনে সার্ভার সেটআপ ও ডিপ্লয়মেন্ট আলাদা সেবা হিসেবে নেওয়া যায়।",
        ],
      },
      {
        id: "launch",
        eyebrow: "ধাপ ০৫",
        title: "রিব্র্যান্ড করে লাইভ করুন",
        summary:
          "লোগো, রঙ ও কনটেন্ট নিজের ব্র্যান্ডে বদলে শপ চালু করুন — কোড আপনার, নিয়ন্ত্রণও আপনার।",
        details: [
          "লোগো, রঙ, ফন্ট ও টেক্সট বদলে প্রোডাক্টকে সম্পূর্ণ নিজের ব্র্যান্ড বানান।",
          "ডেমো ডেটা মুছে নিজের পণ্য, দাম ও ছবি যোগ করুন।",
          "পেমেন্ট গেটওয়ে ও ডেলিভারি সেটিংস নিজের ব্যবসার সাথে মিলিয়ে নিন।",
          "লাইভ হওয়ার পরও বাগ ফিক্স, আপডেট ও প্রশ্নের উত্তরে আমরা পাশে থাকি।",
        ],
      },
    ],
    prepareTitle: "শুরুর আগে হাতে রাখুন",
    prepareIntro:
      "এই কয়েকটি জিনিস আগে গুছিয়ে রাখলে ডেলিভারির পর লাইভ হতে অনেক কম সময় লাগে।",
    prepare: [
      "একটি ডোমেইন নাম — নিজের ব্র্যান্ডের সাথে মেলে এমন।",
      "হোস্টিং অ্যাকাউন্ট, যেখানে প্রোডাক্টের প্রযুক্তি চলবে।",
      "SSL সার্টিফিকেট (অনেক হোস্টিং প্যাকেজে বিনামূল্যে থাকে)।",
      "পেমেন্ট গেটওয়ে অ্যাকাউন্ট ও প্রয়োজনীয় ব্যবসায়িক নথি।",
      "পণ্যের তালিকা, দাম, বিবরণ ও পরিষ্কার ছবি।",
      "লোগো ও ব্র্যান্ড রঙ, যদি থাকে।",
    ],
    afterTitle: "কেনার পরও যা চলতে থাকে",
    afterIntro:
      "ডেলিভারি শেষ হলেই সম্পর্ক শেষ নয় — আজীবন সাপোর্ট ও আপডেট মানে দীর্ঘমেয়াদি সহায়তা।",
    after: [
      "প্রোডাক্টের নিজস্ব বাগ পাওয়া গেলে বিনা খরচে ঠিক করে দেওয়া হয়।",
      "নতুন উন্নয়ন ও সিকিউরিটি প্যাচ প্রকাশ হলে আপনি তা পান।",
      "অ্যাডমিন প্যানেল ব্যবহারের প্রশ্নে গাইডেন্স পাওয়া যায়।",
      "নতুন ফিচার, ইন্টিগ্রেশন বা রিডিজাইন দরকার হলে কাস্টম কাজ হিসেবে করে দেওয়া যায়।",
      "ব্যবসা বড় হলে DevOps ও মেইনটেন্যান্স সেবাও নেওয়া যায়।",
    ],
  },

  en: {
    steps: [
      {
        id: "choose",
        eyebrow: "Step 01",
        title: "Choose a product",
        summary:
          "Pick the ready-made ecommerce solution from the catalog that matches the kind of business you run.",
        details: [
          "Filter by category — ecommerce, fashion, tech, or lifestyle.",
          "Each product page lists features, inclusions, screenshots, and questions specific to it.",
          "Prices are shown in BDT, with the effective price stated clearly when a discount applies.",
          "If you are unsure which one fits, tell us your requirements and we will suggest one.",
        ],
      },
      {
        id: "trial",
        eyebrow: "Step 02",
        title: "Run a free live trial",
        summary:
          "Log into a real running instance and verify everything for yourself before buying — no payment, no card.",
        details: [
          "Click “Start free trial” on a product page and give your name, email, and intended use.",
          "Once the request is reviewed and approved, a status link is emailed to you.",
          "In the trial, both the shop and the admin panel behave exactly like the real product.",
          "Add products, create orders, and open reports to test the whole flow.",
          "If you need more time before the trial ends, an extend pack is available.",
        ],
      },
      {
        id: "purchase",
        eyebrow: "Step 03",
        title: "Buy with a one-time payment",
        summary:
          "When you are satisfied, check out. Pay once and the lifetime license, support, and updates follow.",
        details: [
          "Enter your name, email, and phone at checkout — delivery goes to these details.",
          "Complete payment through the secure payment gateway.",
          "The total shown at checkout is final; there are no hidden charges.",
          "As soon as payment is confirmed the order is created and delivery begins.",
        ],
      },
      {
        id: "delivery",
        eyebrow: "Step 04",
        title: "Delivery and setup",
        summary:
          "Receive the source code, database structure, and setup documentation — with setup guidance included in support.",
        details: [
          "Delivery links and instructions are sent to the email on your order.",
          "Follow the step-by-step documentation to upload files and configure the database on your hosting.",
          "If you get stuck, raise it with support — installation guidance is included.",
          "Server setup and deployment are available separately if you would rather we did it.",
        ],
      },
      {
        id: "launch",
        eyebrow: "Step 05",
        title: "Rebrand and go live",
        summary:
          "Swap in your logo, colours, and content, then launch. The code is yours and so is the control.",
        details: [
          "Change the logo, colours, fonts, and copy to make the product entirely your brand.",
          "Clear the demo data and add your own products, prices, and images.",
          "Point the payment gateway and delivery settings at your own business accounts.",
          "After launch we stay available for bug fixes, updates, and questions.",
        ],
      },
    ],
    prepareTitle: "Have these ready before you start",
    prepareIntro:
      "Sorting these out in advance cuts the time between delivery and going live considerably.",
    prepare: [
      "A domain name that matches your brand.",
      "A hosting account that can run the product's technology.",
      "An SSL certificate (many hosting plans include one free).",
      "A payment gateway account and the business documents it requires.",
      "Your product list, prices, descriptions, and clear photographs.",
      "Your logo and brand colours, if you have them.",
    ],
    afterTitle: "What continues after purchase",
    afterIntro:
      "Delivery is not the end of the relationship — lifetime support and updates mean long-term help.",
    after: [
      "Bugs found in the product itself are fixed at no cost.",
      "You receive improvements and security patches as we release them.",
      "Guidance is available whenever you have a question about the admin panel.",
      "New features, integrations, or a redesign can be taken on as custom work.",
      "As your business grows, DevOps and maintenance services are available too.",
    ],
  },
};

export function howItWorks(locale: Locale): HowItWorksContent {
  return CONTENT[locale];
}
