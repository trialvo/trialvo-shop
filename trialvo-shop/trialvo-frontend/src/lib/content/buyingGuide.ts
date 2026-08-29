import type { Locale } from "@/lib/i18n";

export type GuideSection = {
  id: string;
  title: string;
  body: string;
  points: string[];
};

export type BuyingGuide = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: GuideSection[];
  closing: string;
};

/**
 * Long-form buying advice for the catalog page. A category listing is mostly
 * product tiles, which gives a crawler almost no unique text to rank; this
 * gives the page substance that also genuinely helps an undecided buyer.
 */
const GUIDE: Record<Locale, BuyingGuide> = {
  bn: {
    eyebrow: "কেনার গাইড",
    title: "রেডিমেড ইকমার্স ওয়েবসাইট কেনার আগে যা যাচাই করবেন",
    intro:
      "একটি রেডিমেড ইকমার্স সলিউশন কেনা মানে শুধু ডিজাইন পছন্দ করা নয়। আপনি একটি কোডবেস, একটি লাইসেন্স এবং দীর্ঘমেয়াদি সাপোর্ট সম্পর্ক কিনছেন। নিচের বিষয়গুলো আগে পরিষ্কার করে নিলে পরে খরচ ও ঝামেলা দুটোই কমে।",
    sections: [
      {
        id: "source-code",
        title: "সোর্স কোড সত্যিই পাচ্ছেন কি না",
        body: "অনেক সাবস্ক্রিপশনভিত্তিক প্ল্যাটফর্মে আপনি শুধু ব্যবহারের অধিকার পান, কোড নয়। কোড হাতে না থাকলে ভবিষ্যতে কাস্টমাইজেশন, ডেটা মাইগ্রেশন বা প্রোভাইডার বদল—সবই আটকে যায়।",
        points: [
          "শপ ফ্রন্টএন্ড ও অ্যাডমিন প্যানেল—দুটোরই সম্পূর্ণ কোড অন্তর্ভুক্ত কি না",
          "ডাটাবেস স্ট্রাকচার ও মাইগ্রেশন ফাইল দেওয়া হচ্ছে কি না",
          "কোনো অংশ অবফাসকেট বা এনক্রিপ্ট করে আটকে রাখা হয়েছে কি না",
          "নিজের ব্র্যান্ডে রিব্র্যান্ড করার অনুমতি আছে কি না",
        ],
      },
      {
        id: "total-cost",
        title: "প্রকৃত মোট খরচ হিসাব করুন",
        body: "প্রোডাক্টের দামই একমাত্র খরচ নয়। ডোমেইন, হোস্টিং, পেমেন্ট গেটওয়ে চার্জ এবং কনটেন্ট এন্ট্রি—সব যোগ করে তুলনা করলে এককালীন পেমেন্ট আর মাসিক সাবস্ক্রিপশনের পার্থক্য স্পষ্ট হয়।",
        points: [
          "এককালীন পেমেন্ট, নাকি মাসিক বা বার্ষিক নবায়ন ফি আছে",
          "সাপোর্ট ও আপডেটের জন্য আলাদা ফি লাগবে কি না",
          "ডোমেইন ও হোস্টিং খরচ আলাদাভাবে হিসাব করা হয়েছে কি না",
          "বিক্রয়ের উপর কোনো কমিশন বা লেনদেন ফি কাটা হবে কি না",
        ],
      },
      {
        id: "trial-first",
        title: "কেনার আগে লাইভ চালিয়ে দেখুন",
        body: "স্ক্রিনশট আর ভিডিও দিয়ে অ্যাডমিন প্যানেলের আসল অভিজ্ঞতা বোঝা যায় না। প্রকৃত ইনস্ট্যান্সে প্রোডাক্ট যোগ করা, অর্ডার প্রসেস করা আর রিপোর্ট দেখার পরই বোঝা যায় এটি আপনার কাজের ধরনের সাথে যায় কি না।",
        points: [
          "অ্যাডমিন প্যানেলে নিজে প্রোডাক্ট ও ক্যাটাগরি যোগ করে দেখুন",
          "একটি অর্ডার শুরু থেকে শেষ পর্যন্ত চালিয়ে দেখুন",
          "মোবাইলে শপের গতি ও লেআউট পরীক্ষা করুন",
          "বাংলা লেখা সব জায়গায় সঠিকভাবে দেখাচ্ছে কি না মিলিয়ে নিন",
        ],
      },
      {
        id: "license-scope",
        title: "লাইসেন্সের সীমা বুঝে নিন",
        body: "লাইসেন্স কতটি ডোমেইনে চলবে এবং কী কী করা যাবে না—এটি কেনার পর নয়, আগে জানা দরকার। বিশেষ করে আপনি যদি এজেন্সি হিসেবে ক্লায়েন্টদের জন্য ব্যবহার করার পরিকল্পনা করেন।",
        points: [
          "একটি লাইসেন্স কয়টি প্রোডাকশন ডোমেইন কাভার করে",
          "ডেভেলপমেন্ট ও স্টেজিং কপি রাখার অনুমতি আছে কি না",
          "পুনঃবিক্রয় বা সাবলাইসেন্স নিষিদ্ধ কি না",
          "লাইসেন্সের মেয়াদ শেষ হওয়ার তারিখ আছে কি না",
        ],
      },
      {
        id: "support-scope",
        title: "সাপোর্টে ঠিক কী কী পড়ে",
        body: "“আজীবন সাপোর্ট” শুনতে ভালো, কিন্তু তার সীমা লিখিতভাবে জানা জরুরি। বাগ ফিক্স আর নতুন ফিচার ডেভেলপমেন্ট এক জিনিস নয়।",
        points: [
          "বাগ ফিক্স ও সিকিউরিটি প্যাচ অন্তর্ভুক্ত কি না",
          "ইনস্টলেশন ও সেটআপ গাইডেন্স অন্তর্ভুক্ত কি না",
          "প্রথম উত্তরের জন্য নির্দিষ্ট সময়সীমা ঘোষিত আছে কি না",
          "নতুন ফিচার ও রিডিজাইন আলাদা কাস্টম কাজ হিসেবে গণ্য কি না",
        ],
      },
      {
        id: "seo-ready",
        title: "SEO ও পারফরম্যান্সের ভিত্তি আছে কি না",
        body: "গুগল থেকে ট্রাফিক আসার জন্য টেকনিক্যাল ভিত্তি লাগে—পরিষ্কার URL, মেটা ট্যাগ, স্ট্রাকচার্ড ডেটা ও দ্রুত লোডিং। এগুলো পরে যোগ করার চেয়ে শুরু থেকেই থাকা অনেক সস্তা।",
        points: [
          "প্রোডাক্ট ও ক্যাটাগরির URL পড়ার উপযোগী ও স্থায়ী কি না",
          "প্রতিটি পেজে আলাদা টাইটেল ও ডেসক্রিপশন সেট করা যায় কি না",
          "প্রোডাক্টের স্ট্রাকচার্ড ডেটা ও সাইটম্যাপ তৈরি হয় কি না",
          "মোবাইলে পেজ লোডের গতি গ্রহণযোগ্য কি না",
        ],
      },
    ],
    closing:
      "কোনো প্রোডাক্ট নিয়ে দ্বিধা থাকলে আগে লাইভ ট্রায়াল নিন—কোনো পেমেন্ট বা কার্ড তথ্য ছাড়াই। এরপরও প্রশ্ন থাকলে আমাদের জানান, আপনার প্রয়োজনের সাথে কোন প্রোডাক্টটি সবচেয়ে ভালো যায় সেটি সরাসরি বলে দেব।",
  },

  en: {
    eyebrow: "Buying guide",
    title: "What to check before buying a ready-made ecommerce website",
    intro:
      "Buying a ready-made ecommerce solution is not just picking a design. You are buying a codebase, a license, and a long-term support relationship. Settling the points below in advance saves both money and frustration later.",
    sections: [
      {
        id: "source-code",
        title: "Whether you really receive the source code",
        body: "Many subscription platforms give you a right to use the software, not the code behind it. Without the code, future customization, data migration, and switching providers all become blocked.",
        points: [
          "Whether the complete code for both the storefront and the admin panel is included",
          "Whether the database structure and migration files are provided",
          "Whether any part is obfuscated or encrypted and held back",
          "Whether you are allowed to rebrand it fully as your own",
        ],
      },
      {
        id: "total-cost",
        title: "Work out the real total cost",
        body: "The product price is rarely the only cost. Add up the domain, hosting, payment gateway fees, and content entry, and the gap between a one-time payment and a monthly subscription becomes clear.",
        points: [
          "Whether it is one-time, or carries a monthly or annual renewal fee",
          "Whether support and updates cost extra",
          "Whether domain and hosting are budgeted separately",
          "Whether any commission or transaction fee is taken from your sales",
        ],
      },
      {
        id: "trial-first",
        title: "Run it live before you pay",
        body: "Screenshots and videos cannot convey what an admin panel is actually like to use. Only after adding products, processing an order, and opening the reports do you learn whether it fits how you work.",
        points: [
          "Add your own products and categories in the admin panel",
          "Take one order all the way through the flow",
          "Check the storefront's speed and layout on a phone",
          "Confirm Bangla text renders correctly everywhere",
        ],
      },
      {
        id: "license-scope",
        title: "Understand the limits of the license",
        body: "How many domains the license covers, and what you may not do with it, is something to establish before buying rather than after — especially if you plan to use it for client work as an agency.",
        points: [
          "How many production domains a single license covers",
          "Whether development and staging copies are permitted",
          "Whether reselling or sublicensing is prohibited",
          "Whether the license has an expiry date",
        ],
      },
      {
        id: "support-scope",
        title: "What support actually covers",
        body: "\u201cLifetime support\u201d sounds reassuring, but its boundaries need to be in writing. Fixing a bug and building a new feature are not the same thing.",
        points: [
          "Whether bug fixes and security patches are included",
          "Whether installation and setup guidance is included",
          "Whether a target time for the first reply is stated",
          "Whether new features and redesigns count as separate custom work",
        ],
      },
      {
        id: "seo-ready",
        title: "Whether the SEO and performance groundwork is there",
        body: "Traffic from Google needs a technical foundation: clean URLs, meta tags, structured data, and fast loading. Having it from the start is far cheaper than retrofitting it.",
        points: [
          "Whether product and category URLs are readable and stable",
          "Whether each page can have its own title and description",
          "Whether product structured data and a sitemap are generated",
          "Whether mobile page load speed is acceptable",
        ],
      },
    ],
    closing:
      "If you are undecided about a product, take a live trial first — no payment and no card details. If questions remain after that, tell us what you need and we will say plainly which product fits it best.",
  },
};

export function buyingGuide(locale: Locale): BuyingGuide {
  return GUIDE[locale];
}
