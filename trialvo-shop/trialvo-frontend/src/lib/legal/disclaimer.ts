import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const DISCLAIMER_DOC: LocalizedLegalDoc = {
  bn: {
    title: "ডিসক্লেইমার",
    updated: LEGAL_UPDATED.bn,
    intro:
      "এই পেজে Trialvo Shop-এর ওয়েবসাইট, ডেমো, ডকুমেন্টেশন ও প্রোডাক্ট সংক্রান্ত তথ্যের সীমাবদ্ধতা স্পষ্ট করা হয়েছে। কেনার সিদ্ধান্ত নেওয়ার আগে এটি পড়ে নেওয়া ভালো।",
    sections: [
      {
        id: "general-info",
        heading: "১. তথ্য সাধারণ প্রকৃতির",
        blocks: [
          {
            type: "p",
            text: "সাইটের কনটেন্ট, ফিচার তালিকা, স্ক্রিনশট ও ডকুমেন্টেশন সাধারণ তথ্যের জন্য প্রকাশ করা হয়। আমরা যথাসম্ভব নির্ভুল রাখার চেষ্টা করি, তবে প্রোডাক্ট নিয়মিত আপডেট হওয়ায় কোনো তথ্য কখনো পুরোনো হয়ে যেতে পারে। সবচেয়ে নির্ভরযোগ্য যাচাই হলো লাইভ ট্রায়াল।",
          },
        ],
      },
      {
        id: "no-guarantee",
        heading: "২. ফলাফল বা আয়ের কোনো নিশ্চয়তা নেই",
        blocks: [
          {
            type: "p",
            text: "আমরা একটি প্রযুক্তিগত সলিউশন সরবরাহ করি — ব্যবসায়িক সফলতা নয়। কোনো প্রোডাক্ট ব্যবহার করে আপনি কত বিক্রি করবেন, কত ট্রাফিক পাবেন বা কত আয় করবেন তার কোনো নিশ্চয়তা দেওয়া হয় না। ফলাফল আপনার পণ্য, বাজার, মার্কেটিং, দাম ও পরিচালনার উপর নির্ভর করে।",
          },
          {
            type: "note",
            text: "সাইটে দেখানো কোনো সংখ্যা বা উদাহরণ প্রত্যাশিত আয়ের প্রতিশ্রুতি নয়।",
          },
        ],
      },
      {
        id: "seo-disclaimer",
        heading: "৩. SEO ও পারফরম্যান্স",
        blocks: [
          {
            type: "p",
            text: "আমাদের প্রোডাক্টগুলো SEO-বান্ধব স্ট্রাকচার, দ্রুত লোডিং ও পরিষ্কার মার্কআপ নিয়ে তৈরি। তবে সার্চ ইঞ্জিনে র‍্যাংকিং সম্পূর্ণভাবে সার্চ ইঞ্জিনের নিজস্ব অ্যালগরিদম, আপনার কনটেন্ট, প্রতিযোগিতা ও ব্যাকলিংকের উপর নির্ভরশীল — কোনো নির্দিষ্ট র‍্যাংক বা ইনডেক্সিং সময়ের নিশ্চয়তা দেওয়া সম্ভব নয়।",
          },
        ],
      },
      {
        id: "demo-content",
        heading: "৪. ডেমো ডেটা ও ছবি",
        blocks: [
          {
            type: "p",
            text: "ডেমো ও ট্রায়ালে দেখানো পণ্য, দাম, ছবি ও লেখা কেবল উপস্থাপনার উদ্দেশ্যে ব্যবহৃত নমুনা। এগুলো প্রকৃত পণ্য নয় এবং লাইভ ব্যবহারের জন্য এসব ছবির অধিকার আপনার লাইসেন্সে অন্তর্ভুক্ত নাও থাকতে পারে। লাইভে যাওয়ার আগে নিজের কনটেন্ট ও ছবি ব্যবহার করুন।",
          },
        ],
      },
      {
        id: "third-party",
        heading: "৫. তৃতীয় পক্ষের সেবা ও লিংক",
        blocks: [
          {
            type: "p",
            text: "প্রোডাক্ট চালাতে ডোমেইন, হোস্টিং, পেমেন্ট গেটওয়ে, SMS বা ইমেইল প্রোভাইডারের মতো বাহ্যিক সেবা প্রয়োজন হতে পারে। এসব সেবার প্রাপ্যতা, মূল্য, নীতি বা ডাউনটাইমের উপর আমাদের নিয়ন্ত্রণ নেই এবং সেগুলোর জন্য আমরা দায়ী নই।",
          },
          {
            type: "p",
            text: "আমাদের সাইটে থাকা বাহ্যিক লিংক শুধু সুবিধার জন্য দেওয়া — সেসব সাইটের কনটেন্ট বা নীতির দায়ভার আমাদের নয়।",
          },
        ],
      },
      {
        id: "legal-advice",
        heading: "৬. পেশাদার পরামর্শ নয়",
        blocks: [
          {
            type: "p",
            text: "আমাদের কনটেন্ট আইনি, কর, হিসাব বা ব্যবসায়িক পেশাদার পরামর্শ নয়। আপনার ব্যবসার জন্য প্রযোজ্য ট্রেড লাইসেন্স, ভ্যাট, ভোক্তা অধিকার ও ডেটা সুরক্ষা বিধান মেনে চলার দায়িত্ব আপনার — প্রয়োজনে যোগ্য পেশাদারের পরামর্শ নিন।",
          },
        ],
      },
      {
        id: "availability",
        heading: "৭. সেবার প্রাপ্যতা",
        blocks: [
          {
            type: "p",
            text: "আমরা সাইট ও ট্রায়াল অবকাঠামো স্থিরভাবে চালু রাখার চেষ্টা করি, তবে রক্ষণাবেক্ষণ, আপডেট বা অপ্রত্যাশিত কারণে সাময়িক বিঘ্ন ঘটতে পারে। নিরবচ্ছিন্ন প্রাপ্যতার কোনো নিশ্চয়তা দেওয়া হচ্ছে না।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Disclaimer",
    updated: LEGAL_UPDATED.en,
    intro:
      "This page sets out the limits of the information on the Trialvo Shop website, demos, documentation, and products. It is worth reading before you make a purchase decision.",
    sections: [
      {
        id: "general-info",
        heading: "1. Information is general in nature",
        blocks: [
          {
            type: "p",
            text: "Site content, feature lists, screenshots, and documentation are published for general information. We try to keep them accurate, but because products are updated regularly some details can become out of date. The most reliable way to verify anything is a live trial.",
          },
        ],
      },
      {
        id: "no-guarantee",
        heading: "2. No results or earnings guarantee",
        blocks: [
          {
            type: "p",
            text: "We supply a technical solution, not business success. Nothing here guarantees how much you will sell, how much traffic you will get, or how much you will earn from using a product. Results depend on your products, market, marketing, pricing, and operations.",
          },
          {
            type: "note",
            text: "No figure or example shown on this site is a promise of expected revenue.",
          },
        ],
      },
      {
        id: "seo-disclaimer",
        heading: "3. SEO and performance",
        blocks: [
          {
            type: "p",
            text: "Our products are built with SEO-friendly structure, fast loading, and clean markup. Search ranking, however, depends entirely on the search engine's own algorithms, your content, your competition, and your backlinks — so no specific ranking or indexing timeline can be guaranteed.",
          },
        ],
      },
      {
        id: "demo-content",
        heading: "4. Demo data and images",
        blocks: [
          {
            type: "p",
            text: "Products, prices, images, and text shown in demos and trials are sample content used for presentation only. They are not real products, and rights to use those images live may not be included in your license. Use your own content and images before going live.",
          },
        ],
      },
      {
        id: "third-party",
        heading: "5. Third-party services and links",
        blocks: [
          {
            type: "p",
            text: "Running a product may require external services such as a domain, hosting, a payment gateway, or SMS and email providers. We do not control their availability, pricing, policies, or downtime, and we are not responsible for them.",
          },
          {
            type: "p",
            text: "External links on our site are provided for convenience only; we are not responsible for the content or policies of those sites.",
          },
        ],
      },
      {
        id: "legal-advice",
        heading: "6. Not professional advice",
        blocks: [
          {
            type: "p",
            text: "Our content is not legal, tax, accounting, or professional business advice. Complying with the trade licence, VAT, consumer-rights, and data-protection rules that apply to your business is your responsibility — consult a qualified professional where needed.",
          },
        ],
      },
      {
        id: "availability",
        heading: "7. Service availability",
        blocks: [
          {
            type: "p",
            text: "We aim to keep the site and trial infrastructure running consistently, but maintenance, updates, or unexpected events can cause temporary interruptions. Uninterrupted availability is not guaranteed.",
          },
        ],
      },
    ],
  },
};
