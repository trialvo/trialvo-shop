import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const REFUND_DOC: LocalizedLegalDoc = {
  bn: {
    title: "রিফান্ড ও ক্যান্সেলেশন নীতি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "Trialvo Shop-এর প্রোডাক্ট ডিজিটাল — ডেলিভারির পর সোর্স কোড ফিরিয়ে নেওয়া সম্ভব নয়। তাই আমরা কেনার আগে লাইভ ট্রায়াল দিই, যাতে আপনি নিজেই যাচাই করে নিতে পারেন। এই পেজে রিফান্ড কখন প্রযোজ্য, কখন নয় এবং কীভাবে দাবি করবেন তা স্পষ্টভাবে বলা আছে।",
    sections: [
      {
        id: "try-first",
        heading: "১. আগে ট্রায়াল, তারপর কেনা",
        blocks: [
          {
            type: "p",
            text: "ডিজিটাল প্রোডাক্টে রিফান্ড বিরোধ কমানোর সবচেয়ে ভালো উপায় হলো কেনার আগে প্রোডাক্ট চালিয়ে দেখা। যেসব প্রোডাক্টে ট্রায়াল উপলব্ধ, সেখানে অনুরোধ করলে সীমিত মেয়াদের চালু ইনস্ট্যান্স দেওয়া হয় — ফিচার, ডিজাইন, অ্যাডমিন প্যানেল ও পারফরম্যান্স নিজে পরীক্ষা করে নিন।",
          },
          {
            type: "note",
            text: "কেনার আগে ট্রায়াল ব্যবহার করার জোর পরামর্শ দিচ্ছি। ট্রায়ালে যা দেখেছেন, ডেলিভারিতে সেটিই পাবেন।",
          },
        ],
      },
      {
        id: "eligible",
        heading: "২. কখন রিফান্ড প্রযোজ্য",
        blocks: [
          {
            type: "list",
            items: [
              "পেমেন্ট সফল হয়েছে কিন্তু আমাদের পক্ষ থেকে প্রোডাক্ট ডেলিভারি করা হয়নি এবং সমস্যা সমাধানও করা যায়নি।",
              "একই অর্ডারের জন্য ভুলবশত দুইবার পেমেন্ট কাটা হয়েছে — অতিরিক্ত অংশ ফেরত দেওয়া হবে।",
              "ডেলিভার করা প্রোডাক্ট প্রোডাক্ট পেজে বর্ণিত মূল কার্যকারিতা থেকে মৌলিকভাবে ভিন্ন এবং যুক্তিসঙ্গত সময়ে আমরা তা ঠিক করতে ব্যর্থ হয়েছি।",
              "গুরুতর কোনো ত্রুটি যা প্রোডাক্টকে অব্যবহারযোগ্য করে এবং সাপোর্টের মাধ্যমে সমাধান করা যাচ্ছে না।",
            ],
          },
        ],
      },
      {
        id: "not-eligible",
        heading: "৩. কখন রিফান্ড প্রযোজ্য নয়",
        blocks: [
          {
            type: "list",
            items: [
              "সোর্স কোড ডাউনলোড বা ডেলিভারি সম্পন্ন হওয়ার পর মত পরিবর্তন।",
              "প্রোডাক্ট পেজে উল্লেখ নেই এমন কোনো ফিচার প্রত্যাশা করা।",
              "নিজের হোস্টিং, ডোমেইন, সার্ভার কনফিগারেশন বা থার্ড-পার্টি সেবার সীমাবদ্ধতা।",
              "ক্রেতা বা তৃতীয় পক্ষের করা কোড পরিবর্তনের ফলে সৃষ্ট সমস্যা।",
              "কাস্টমাইজেশন বা নতুন ফিচার না পাওয়া, যা মূল প্রোডাক্টের অন্তর্ভুক্ত ছিল না।",
              "ট্রায়াল এক্সটেন্ড প্যাক — মেয়াদ চালু হয়ে গেলে তা অ-ফেরতযোগ্য।",
              "প্রোডাক্ট বা লাইসেন্সের শর্ত লঙ্ঘনের কারণে লাইসেন্স বাতিল হলে।",
            ],
          },
        ],
      },
      {
        id: "cancellation",
        heading: "৪. অর্ডার ক্যান্সেলেশন",
        blocks: [
          {
            type: "p",
            text: "ডেলিভারি শুরু হওয়ার আগে অর্ডার বাতিলের অনুরোধ করলে সাধারণত পূর্ণ অর্থ ফেরত দেওয়া হয়। ডেলিভারি সম্পন্ন হয়ে গেলে ক্যান্সেলেশন আর সম্ভব নয়, কারণ ডিজিটাল ফাইল ফিরিয়ে নেওয়া যায় না।",
          },
          {
            type: "p",
            text: "পেমেন্ট আটকে থাকা বা অসম্পূর্ণ অবস্থায় থাকলে সেই অর্ডার নিশ্চিত হয় না — এতে কোনো ক্যান্সেলেশন ফি নেই।",
          },
        ],
      },
      {
        id: "how-to-claim",
        heading: "৫. রিফান্ড দাবি করার প্রক্রিয়া",
        blocks: [
          {
            type: "list",
            items: [
              "অর্ডারে ব্যবহৃত ইমেইল থেকে আমাদের ইমেইল করুন অথবা যোগাযোগ পেজ ব্যবহার করুন।",
              "অর্ডার আইডি, প্রোডাক্টের নাম এবং পেমেন্টের তারিখ উল্লেখ করুন।",
              "সমস্যাটি স্পষ্টভাবে লিখুন এবং সম্ভব হলে স্ক্রিনশট বা ত্রুটির বার্তা যুক্ত করুন।",
              "আমরা প্রথমে সমস্যা সমাধানের চেষ্টা করব; সমাধান সম্ভব না হলে রিফান্ড পর্যালোচনা করা হবে।",
            ],
          },
          {
            type: "p",
            text: "সাধারণত ৩–৭ কার্যদিবসের মধ্যে আমরা সিদ্ধান্ত জানাই। অনুমোদিত রিফান্ড মূল পেমেন্ট পদ্ধতিতেই ফেরত পাঠানো হয়; ব্যাংক বা গেটওয়ের প্রক্রিয়ার সময় এর সাথে যুক্ত হতে পারে।",
          },
        ],
      },
      {
        id: "chargeback",
        heading: "৬. চার্জব্যাক ও বিরোধ",
        blocks: [
          {
            type: "p",
            text: "আমাদের সাথে যোগাযোগ না করে সরাসরি চার্জব্যাক করলে সমাধান দীর্ঘ হয় এবং সংশ্লিষ্ট লাইসেন্স ও সাপোর্ট তদন্ত শেষ হওয়া পর্যন্ত স্থগিত থাকতে পারে। অনুগ্রহ করে আগে আমাদের জানান — অধিকাংশ সমস্যা সাপোর্টেই সমাধান হয়ে যায়।",
          },
        ],
      },
      {
        id: "changes",
        heading: "৭. নীতির পরিবর্তন",
        blocks: [
          {
            type: "p",
            text: "এই নীতি হালনাগাদ হতে পারে। অর্ডারের সময় প্রকাশিত সংস্করণটিই সেই অর্ডারের জন্য প্রযোজ্য হবে।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Refund & Cancellation Policy",
    updated: LEGAL_UPDATED.en,
    intro:
      "Trialvo Shop products are digital — once source code is delivered it cannot be returned. That is exactly why we offer a live trial before purchase, so you can verify the product yourself. This page sets out clearly when a refund applies, when it does not, and how to claim one.",
    sections: [
      {
        id: "try-first",
        heading: "1. Trial first, then buy",
        blocks: [
          {
            type: "p",
            text: "The best way to avoid a refund dispute on a digital product is to run it before buying. Where a trial is available, requesting one gives you a time-limited running instance so you can check the features, design, admin panel, and performance for yourself.",
          },
          {
            type: "note",
            text: "We strongly recommend using the trial before you buy. What you see in the trial is what is delivered.",
          },
        ],
      },
      {
        id: "eligible",
        heading: "2. When a refund applies",
        blocks: [
          {
            type: "list",
            items: [
              "Payment succeeded but we did not deliver the product and could not resolve the problem.",
              "You were charged twice for the same order by mistake — the extra amount is returned.",
              "The delivered product differs fundamentally from the core functionality described on its product page and we could not fix it within a reasonable time.",
              "A serious defect makes the product unusable and support cannot resolve it.",
            ],
          },
        ],
      },
      {
        id: "not-eligible",
        heading: "3. When a refund does not apply",
        blocks: [
          {
            type: "list",
            items: [
              "Change of mind after the source code has been downloaded or delivery is complete.",
              "Expecting a feature that was not listed on the product page.",
              "Limitations of your own hosting, domain, server configuration, or third-party services.",
              "Problems caused by code changes made by you or a third party.",
              "Customization or new features that were never part of the base product.",
              "Trial extend packs — once the extended period starts they are non-refundable.",
              "License termination resulting from a breach of the product or license terms.",
            ],
          },
        ],
      },
      {
        id: "cancellation",
        heading: "4. Cancelling an order",
        blocks: [
          {
            type: "p",
            text: "If you ask to cancel before delivery has started we normally refund in full. Once delivery is complete cancellation is no longer possible, because digital files cannot be taken back.",
          },
          {
            type: "p",
            text: "An order whose payment is pending or incomplete is never confirmed, and there is no cancellation fee in that case.",
          },
        ],
      },
      {
        id: "how-to-claim",
        heading: "5. How to claim a refund",
        blocks: [
          {
            type: "list",
            items: [
              "Email us from the address used on the order, or use the contact page.",
              "Include the order ID, product name, and payment date.",
              "Describe the problem clearly and attach screenshots or error messages if you can.",
              "We will try to fix the problem first; if it cannot be fixed we review the refund.",
            ],
          },
          {
            type: "p",
            text: "We usually confirm a decision within 3–7 working days. Approved refunds are returned through the original payment method, and your bank or gateway may add its own processing time.",
          },
        ],
      },
      {
        id: "chargeback",
        heading: "6. Chargebacks and disputes",
        blocks: [
          {
            type: "p",
            text: "Raising a chargeback without contacting us first makes resolution slower, and the related license and support may be paused until the investigation closes. Please talk to us first — most issues are solved through support.",
          },
        ],
      },
      {
        id: "changes",
        heading: "7. Changes to this policy",
        blocks: [
          {
            type: "p",
            text: "This policy may be updated. The version published at the time of your order is the version that applies to that order.",
          },
        ],
      },
    ],
  },
};
