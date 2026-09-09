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
        id: "demo",
        eyebrow: "ধাপ ০২",
        title: "ইনস্ট্যান্ট ডেমোতে ঢুকুন",
        summary:
          "নাম ও ইমেইল দিন — এক মিনিটের মধ্যে শপ ও অ্যাডমিন প্যানেলের লগইন হাতে। কোনো অ্যাপ্রুভাল, কোনো কার্ড নেই।",
        details: [
          "প্রোডাক্ট পেজের “ইনস্ট্যান্ট ডেমো” বাটনে ক্লিক করুন — তিনটি ফিল্ড, ব্যস।",
          "লগইন সাথে সাথে স্ক্রিনে দেখানো হয় এবং ইমেইলে অ্যাকসেস পেজের লিংক যায়।",
          "স্টোরফ্রন্ট ও অ্যাডমিন দুটোই আসল প্রোডাক্ট — প্রোডাক্ট যোগ করুন, অর্ডার বানান, রিপোর্ট দেখুন।",
          "ডেমো শেয়ার্ড ও নিয়মিত রিসেট হয়, তাই আসল গ্রাহকের তথ্য দেবেন না।",
        ],
      },
      {
        id: "trial",
        eyebrow: "ধাপ ০৩",
        title: "নিজের ডোমেইনে এক মাস ফ্রি চালান",
        summary:
          "ডেমো পছন্দ হলে অনুরোধ করুন — আপনার নিজের ডোমেইন ও হোস্টিংয়ে আমরা নিজে বসিয়ে দেব, পূর্ণ এক মাস ফ্রি। এই সুবিধা অন্য কেউ দেয় না।",
        details: [
          "হোস্টিং আছে কি না বলুন: নিজের VPS বা cPanel, অথবা Trialvo থেকে হোস্টিং নিন।",
          "ট্রায়ালের মেয়াদ নিশ্চিত করুন এবং আপনার ডোমেইন দিন।",
          "আমাদের টিম সার্ভার অ্যাকসেস নিয়ে যোগাযোগ করে সাধারণত ২৪ ঘণ্টার মধ্যে লাইভ করে দেয়।",
          "স্ট্যাটাস পেজে ধাপে ধাপে অগ্রগতি দেখুন — পেয়েছি, সেটআপ চলছে, লাইভ।",
          "আসল ক্রেতা নিয়ে ব্যবসা চালান; ডেটা আপনার সার্ভারেই থাকে।",
        ],
      },
      {
        id: "purchase",
        eyebrow: "ধাপ ০৪",
        title: "এককালীন পেমেন্টে কিনুন",
        summary:
          "নিশ্চিত হলে চেকআউট করুন — একবার পেমেন্ট, তারপর আজীবন লাইসেন্স, সাপোর্ট ও আপডেট। ট্রায়াল ইনস্ট্যান্সটাই পারমানেন্ট হয়ে যায়।",
        details: [
          "স্ট্যাটাস পেজ থেকে “প্রোডাক্ট কিনুন” চাপুন — ট্রায়াল ইনস্ট্যান্সের সাথে অর্ডার লিংক হয়ে যায়।",
          "নিরাপদ পেমেন্ট গেটওয়ের মাধ্যমে পেমেন্ট সম্পন্ন করুন।",
          "চেকআউটে দেখানো মোট মূল্যই চূড়ান্ত — কোনো লুকানো চার্জ নেই।",
          "পেমেন্ট নিশ্চিত হলে ট্রায়ালের মেয়াদ উঠে যায় — ডেটা, সেটআপ, ডোমেইন সব একই থাকে।",
        ],
      },
      {
        id: "launch",
        eyebrow: "ধাপ ০৫",
        title: "সোর্স কোড নিয়ে নিজের ব্র্যান্ডে চলুন",
        summary:
          "সোর্স কোড, ডাটাবেস স্ট্রাকচার ও ডকুমেন্টেশন পান। লোগো, রঙ ও কনটেন্ট বদলে সম্পূর্ণ নিজের করে নিন — কোড আপনার, নিয়ন্ত্রণও আপনার।",
        details: [
          "ডেলিভারি লিংক ও নির্দেশনা অর্ডারের ইমেইলে পাঠানো হয়।",
          "লোগো, রঙ, ফন্ট ও টেক্সট বদলে প্রোডাক্টকে সম্পূর্ণ নিজের ব্র্যান্ড বানান।",
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
        id: "demo",
        eyebrow: "Step 02",
        title: "Open the instant demo",
        summary:
          "Enter your name and email — shop and admin logins are in your hands within a minute. No approval, no card.",
        details: [
          "Click “Instant demo” on a product page — three fields, done.",
          "Logins appear on screen right away and an access-page link goes to your email.",
          "Storefront and admin are the real product — add products, create orders, open reports.",
          "The demo is shared and resets regularly, so do not enter real customer data.",
        ],
      },
      {
        id: "trial",
        eyebrow: "Step 03",
        title: "Run it free for a month on your own domain",
        summary:
          "Liked the demo? Request a trial — we deploy it ourselves on your own domain and hosting, free for a full month. Nobody else offers this.",
        details: [
          "Tell us about hosting: your own VPS or cPanel, or get hosting from Trialvo.",
          "Confirm the trial length and give your domain.",
          "Our team contacts you for server access and usually has it live within 24 hours.",
          "Follow progress on your status page — received, setting up, live.",
          "Run real business with real customers; the data stays on your server.",
        ],
      },
      {
        id: "purchase",
        eyebrow: "Step 04",
        title: "Buy with a one-time payment",
        summary:
          "When you are satisfied, check out. Pay once and the lifetime license, support, and updates follow. The trial instance itself becomes permanent.",
        details: [
          "Click “Buy product” on your status page — the order is linked to your trial instance.",
          "Complete payment through the secure payment gateway.",
          "The total shown at checkout is final; there are no hidden charges.",
          "Once payment is confirmed the trial expiry is lifted — data, setup, and domain all stay as they are.",
        ],
      },
      {
        id: "launch",
        eyebrow: "Step 05",
        title: "Take the source code and make it yours",
        summary:
          "Receive the source code, database structure, and documentation. Swap in your logo, colours, and content — the code is yours and so is the control.",
        details: [
          "Delivery links and instructions are sent to the email on your order.",
          "Change the logo, colours, fonts, and copy to make the product entirely your brand.",
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
