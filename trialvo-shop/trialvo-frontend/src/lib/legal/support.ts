import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const SUPPORT_DOC: LocalizedLegalDoc = {
  bn: {
    title: "সাপোর্ট নীতি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "প্রতিটি Trialvo Shop প্রোডাক্টে আজীবন সাপোর্ট ও আজীবন আপডেট অন্তর্ভুক্ত — কোনো নবায়ন ফি নেই। এই পেজে স্পষ্টভাবে বলা আছে সাপোর্টে কী কী পড়ে, কী পড়ে না, কত সময়ে উত্তর পাবেন এবং কীভাবে অনুরোধ করলে দ্রুত সমাধান হয়।",
    sections: [
      {
        id: "included",
        heading: "১. সাপোর্টে যা অন্তর্ভুক্ত",
        blocks: [
          {
            type: "list",
            items: [
              "প্রোডাক্টের নিজস্ব বাগ ও ত্রুটি চিহ্নিত করা ও ঠিক করা।",
              "ইনস্টলেশন ও প্রাথমিক সেটআপে গাইডেন্স — ফাইল আপলোড, ডাটাবেস কনফিগারেশন, এনভায়রনমেন্ট ভেরিয়েবল।",
              "অ্যাডমিন প্যানেল ব্যবহারের প্রশ্নের উত্তর ও ফিচার কীভাবে কাজ করে তার ব্যাখ্যা।",
              "নতুন প্রকাশিত আপডেট ও সিকিউরিটি প্যাচ পাওয়া এবং প্রয়োগে দিকনির্দেশনা।",
              "প্রোডাক্টে থাকা কনফিগারেশন অপশন নিয়ে পরামর্শ।",
            ],
          },
        ],
      },
      {
        id: "excluded",
        heading: "২. সাপোর্টে যা অন্তর্ভুক্ত নয়",
        blocks: [
          {
            type: "p",
            text: "নিচের কাজগুলো কাস্টম কাজ হিসেবে গণ্য এবং আলাদাভাবে আলোচনা ও কোটেশনের বিষয়:",
          },
          {
            type: "list",
            items: [
              "নতুন ফিচার তৈরি করা বা বিদ্যমান ফিচারের কার্যপ্রণালী বদলে দেওয়া।",
              "ডিজাইন পুনর্গঠন, নতুন থিম বা কাস্টম UI তৈরি।",
              "তৃতীয় পক্ষের API, কুরিয়ার, ERP বা অ্যাকাউন্টিং সফটওয়্যারের সাথে ইন্টিগ্রেশন।",
              "সার্ভার সেটআপ, DevOps, ডোমেইন ও DNS ব্যবস্থাপনা, SSL ইনস্টলেশন।",
              "আপনার বা তৃতীয় পক্ষের করা কোড পরিবর্তনের ফলে সৃষ্ট সমস্যা সমাধান।",
              "কনটেন্ট এন্ট্রি, পণ্য আপলোড, ছবি সম্পাদনা বা মার্কেটিং সেবা।",
              "হোস্টিং বা পেমেন্ট গেটওয়ে প্রোভাইডারের নিজস্ব সমস্যা।",
            ],
          },
          {
            type: "note",
            text: "এসব কাজের প্রয়োজন হলে আমাদের জানান — কাস্টম ডেভেলপমেন্ট ও মেইনটেন্যান্স সেবা আলাদাভাবে পাওয়া যায়।",
          },
        ],
      },
      {
        id: "channels",
        heading: "৩. সাপোর্ট চ্যানেল",
        blocks: [
          {
            type: "list",
            items: [
              "ইমেইল — বিস্তারিত প্রযুক্তিগত সমস্যা ও ফাইল সংযুক্তির জন্য সবচেয়ে উপযুক্ত।",
              "যোগাযোগ ফর্ম — সাধারণ প্রশ্ন ও কেনার আগের জিজ্ঞাসার জন্য।",
              "হোয়াটসঅ্যাপ ও ফোন — দ্রুত ছোট প্রশ্ন ও স্পষ্টীকরণের জন্য।",
            ],
          },
        ],
      },
      {
        id: "response",
        heading: "৪. রেসপন্স সময়",
        blocks: [
          {
            type: "p",
            text: "আমরা কার্যদিবসে সাধারণত ২৪ ঘণ্টার মধ্যে প্রথম উত্তর দেওয়ার লক্ষ্য রাখি। প্রোডাক্ট সম্পূর্ণ অচল করে দেওয়া গুরুতর সমস্যাকে সর্বোচ্চ অগ্রাধিকার দেওয়া হয়। সাপ্তাহিক ছুটি ও সরকারি ছুটিতে উত্তর কিছুটা দেরি হতে পারে।",
          },
          {
            type: "p",
            text: "সমাধানের সময় সমস্যার জটিলতার উপর নির্ভর করে। কোনো সমস্যা কোডের গভীর পরিবর্তনের প্রয়োজন হলে তা পরবর্তী আপডেট রিলিজে অন্তর্ভুক্ত হতে পারে।",
          },
        ],
      },
      {
        id: "how-to-ask",
        heading: "৫. কীভাবে অনুরোধ করলে দ্রুত সমাধান হয়",
        blocks: [
          {
            type: "list",
            items: [
              "অর্ডার আইডি ও প্রোডাক্টের নাম উল্লেখ করুন।",
              "সমস্যাটি কোথায় ঘটছে — কোন পেজ, কোন বাটন, কোন ধাপে — তা লিখুন।",
              "সমস্যাটি পুনরায় তৈরি করার ধাপগুলো ক্রমানুসারে দিন।",
              "স্ক্রিনশট, স্ক্রিন রেকর্ডিং বা সঠিক ত্রুটির বার্তা সংযুক্ত করুন।",
              "সার্ভার পরিবেশ (PHP/Node সংস্করণ, হোস্টিং ধরন) উল্লেখ করুন, প্রযোজ্য হলে।",
              "কোড পরিবর্তন করেছেন কিনা জানান — এটি নির্ণয়ের সময় অনেক কমায়।",
            ],
          },
        ],
      },
      {
        id: "updates",
        heading: "৬. আপডেট কীভাবে দেওয়া হয়",
        blocks: [
          {
            type: "p",
            text: "আমরা প্রোডাক্টের মূল কোডবেসে বাগ ফিক্স, সিকিউরিটি প্যাচ ও উন্নয়ন প্রকাশ করি। আপডেট উপলব্ধ হলে ক্রেতাদের জানানো হয় এবং প্রয়োগের নির্দেশনা দেওয়া হয়। ব্যাপক কাস্টমাইজ করা ইনস্টলেশনে আপডেট প্রয়োগে অতিরিক্ত কাজ লাগতে পারে, যা কাস্টম কাজের আওতায় পড়ে।",
          },
        ],
      },
      {
        id: "scope-limits",
        heading: "৭. সাপোর্টের সীমা",
        blocks: [
          {
            type: "p",
            text: "গ্রহণযোগ্য ব্যবহার নীতি বা লাইসেন্স চুক্তির গুরুতর লঙ্ঘন হলে সাপোর্ট স্থগিত হতে পারে। সাপোর্ট ডেলিভার করা প্রোডাক্টের সাথে যুক্ত — লাইসেন্স বাতিল হলে সাপোর্ট অধিকারও শেষ হয়।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Support Policy",
    updated: LEGAL_UPDATED.en,
    intro:
      "Every Trialvo Shop product includes lifetime support and lifetime updates, with no renewal fee. This page sets out exactly what support covers, what it does not, how quickly you can expect a reply, and how to raise a request that gets solved fast.",
    sections: [
      {
        id: "included",
        heading: "1. What support covers",
        blocks: [
          {
            type: "list",
            items: [
              "Diagnosing and fixing bugs and defects in the product itself.",
              "Guidance on installation and initial setup — uploading files, configuring the database, environment variables.",
              "Answering questions about using the admin panel and explaining how features work.",
              "Access to released updates and security patches, with guidance on applying them.",
              "Advice on the configuration options built into the product.",
            ],
          },
        ],
      },
      {
        id: "excluded",
        heading: "2. What support does not cover",
        blocks: [
          {
            type: "p",
            text: "The following count as custom work and are quoted and agreed separately:",
          },
          {
            type: "list",
            items: [
              "Building new features or changing how an existing feature behaves.",
              "Redesign work, new themes, or custom UI.",
              "Integration with third-party APIs, couriers, ERP, or accounting software.",
              "Server setup, DevOps, domain and DNS management, SSL installation.",
              "Fixing problems caused by code changes made by you or a third party.",
              "Content entry, product uploads, image editing, or marketing services.",
              "Issues originating with your hosting or payment gateway provider.",
            ],
          },
          {
            type: "note",
            text: "If you need any of this, just ask — custom development and maintenance are available separately.",
          },
        ],
      },
      {
        id: "channels",
        heading: "3. Support channels",
        blocks: [
          {
            type: "list",
            items: [
              "Email — best for detailed technical issues and attachments.",
              "Contact form — for general questions and pre-sales enquiries.",
              "WhatsApp and phone — for quick questions and clarifications.",
            ],
          },
        ],
      },
      {
        id: "response",
        heading: "4. Response times",
        blocks: [
          {
            type: "p",
            text: "We aim to send a first reply within 24 hours on working days. Issues that make a product completely unusable get the highest priority. Replies may take a little longer on weekends and public holidays.",
          },
          {
            type: "p",
            text: "Resolution time depends on complexity. Where a fix requires deeper changes to the code it may ship in the next update release.",
          },
        ],
      },
      {
        id: "how-to-ask",
        heading: "5. How to get a faster answer",
        blocks: [
          {
            type: "list",
            items: [
              "Include your order ID and the product name.",
              "Say where the problem happens — which page, which button, which step.",
              "List the steps to reproduce it, in order.",
              "Attach screenshots, a screen recording, or the exact error message.",
              "Mention your server environment (PHP/Node version, hosting type) where relevant.",
              "Tell us whether you have modified the code — this cuts diagnosis time significantly.",
            ],
          },
        ],
      },
      {
        id: "updates",
        heading: "6. How updates are delivered",
        blocks: [
          {
            type: "p",
            text: "We publish bug fixes, security patches, and improvements against the product's original codebase. Buyers are notified when an update is available and given instructions for applying it. Heavily customised installations may need extra work to take an update, which falls under custom work.",
          },
        ],
      },
      {
        id: "scope-limits",
        heading: "7. Limits of support",
        blocks: [
          {
            type: "p",
            text: "Support may be paused following a serious breach of the Acceptable Use Policy or the License Agreement. Support is tied to a delivered product — if a license is terminated, support rights end with it.",
          },
        ],
      },
    ],
  },
};
